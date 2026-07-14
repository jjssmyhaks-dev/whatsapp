import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../common/database/entities/notification.entity';
import { User } from '../common/database/entities/user.entity';
import { Contact } from '../common/database/entities/contact.entity';

// OneSignal notification payload
interface OneSignalNotification {
  app_id: string;
  contents: { en: string };
  headings?: { en: string };
  subtitle?: { en: string };
  data?: Record<string, any>;
  include_player_ids?: string[];
  include_external_user_ids?: string[];
  priority?: number;
  ttl?: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  /**
   * Sends an urgent notification via OneSignal
   * @param userId The user to notify
   * @param threadId The thread ID
   * @param messageId The message ID
   * @param urgencyLevel The urgency level
   * @param messageText The message text
   * @param contact The contact who sent the message
   */
  async sendUrgentNotification(
    userId: string,
    threadId: string,
    messageId: string,
    urgencyLevel: 'urgent' | 'important',
    messageText: string,
    contact: Contact,
  ): Promise<Notification> {
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Create notification record
      const notification = this.notificationRepo.create({
        userId,
        threadId,
        messageId,
        notificationType: urgencyLevel,
        title: `New ${urgencyLevel.toUpperCase()} Message`,
        body: this.buildNotificationBody(messageText, contact, urgencyLevel),
        payload: {
          threadId,
          messageId,
          contactId: contact.id,
          contactName: contact.displayName || contact.phoneNumber,
          messageText: messageText.substring(0, 200), // Truncate for notification
          urgency: urgencyLevel,
        },
        channel: 'push',
        sentAt: new Date(),
        delivered: false,
      });

      await this.notificationRepo.save(notification);

      // Send via OneSignal
      await this.sendOneSignalNotification(notification);

      this.logger.log({
        message: 'Urgent notification sent',
        userId,
        threadId,
        messageId,
        urgencyLevel,
      });

      return notification;
    } catch (error) {
      this.logger.error({
        message: 'Failed to send urgent notification',
        error: error.message,
        stack: error.stack,
        userId,
        threadId,
        messageId,
      });
      throw error;
    }
  }

  /**
   * Builds the notification body
   */
  private buildNotificationBody(
    messageText: string,
    contact: Contact,
    urgencyLevel: 'urgent' | 'important',
  ): string {
    const contactName = contact.displayName || contact.whatsappName || contact.phoneNumber;
    const truncatedMessage = messageText.length > 100
      ? messageText.substring(0, 100) + '...'
      : messageText;

    return `${contactName}: ${truncatedMessage}`;
  }

  /**
   * Sends a notification via OneSignal
   */
  private async sendOneSignalNotification(notification: Notification): Promise<boolean> {
    try {
      const oneSignalAppId = this.configService.get<string>('ONESIGNAL_APP_ID');
      const oneSignalApiKey = this.configService.get<string>('ONESIGNAL_API_KEY');

      if (!oneSignalAppId || !oneSignalApiKey) {
        this.logger.warn('OneSignal credentials not configured');
        return false;
      }

      // In a real implementation, we would get the user's OneSignal player ID
      // from their user record or a separate device table
      const user = await this.userRepo.findOne({
        where: { id: notification.userId },
      });

      if (!user) {
        this.logger.warn(`User not found for notification: ${notification.userId}`);
        return false;
      }

      // For demo purposes, we'll use a test player ID
      // In production, this would come from the user's device registration
      const testPlayerId = this.configService.get<string>('ONESIGNAL_TEST_PLAYER_ID');

      const payload: OneSignalNotification = {
        app_id: oneSignalAppId,
        contents: { en: notification.body || '' },
        headings: { en: notification.title || 'New Message' },
        data: notification.payload || {},
        include_player_ids: testPlayerId ? [testPlayerId] : undefined,
        priority: 10, // High priority for urgent notifications
        ttl: 3600, // 1 hour TTL
      };

      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(oneSignalApiKey).toString('base64')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error({
          message: 'OneSignal notification failed',
          status: response.status,
          error,
        });
        return false;
      }

      const result = await response.json();
      
      // Update notification as delivered
      await this.notificationRepo.update(notification.id, {
        delivered: true,
        deliveredAt: new Date(),
      });

      this.logger.debug({
        message: 'OneSignal notification sent',
        notificationId: notification.id,
        oneSignalId: result.id,
      });

      return true;
    } catch (error) {
      this.logger.error({
        message: 'Failed to send OneSignal notification',
        error: error.message,
        stack: error.stack,
        notificationId: notification.id,
      });
      return false;
    }
  }

  /**
   * Sends a test notification
   */
  async sendTestNotification(userId: string): Promise<boolean> {
    try {
      const notification = this.notificationRepo.create({
        userId,
        notificationType: 'system',
        title: 'Test Notification',
        body: 'This is a test notification from WhatsApp Triage Agent',
        payload: { test: true },
        channel: 'push',
        sentAt: new Date(),
        delivered: false,
      });

      await this.notificationRepo.save(notification);
      return await this.sendOneSignalNotification(notification);
    } catch (error) {
      this.logger.error({
        message: 'Failed to send test notification',
        error: error.message,
        userId,
      });
      return false;
    }
  }

  /**
   * Gets notifications for a user
   */
  async getNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    read?: boolean,
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      const query: any = { userId };
      
      if (read !== undefined) {
        query.read = read;
      }

      const [notifications, total] = await this.notificationRepo.findAndCount({
        where: query,
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });

      return { notifications, total };
    } catch (error) {
      this.logger.error({
        message: 'Failed to get notifications',
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Marks a notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    try {
      const notification = await this.notificationRepo.findOne({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        throw new Error(`Notification not found: ${notificationId}`);
      }

      notification.read = true;
      notification.readAt = new Date();
      
      await this.notificationRepo.save(notification);

      return notification;
    } catch (error) {
      this.logger.error({
        message: 'Failed to mark notification as read',
        error: error.message,
        notificationId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Marks all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await this.notificationRepo.update(
        { userId, read: false },
        { read: true, readAt: new Date() },
      );

      return result.affected || 0;
    } catch (error) {
      this.logger.error({
        message: 'Failed to mark all notifications as read',
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Deletes a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.notificationRepo.delete({
        id: notificationId,
        userId,
      });

      return result.affected && result.affected > 0;
    } catch (error) {
      this.logger.error({
        message: 'Failed to delete notification',
        error: error.message,
        notificationId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Gets unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await this.notificationRepo.count({
        where: { userId, read: false },
      });

      return count;
    } catch (error) {
      this.logger.error({
        message: 'Failed to get unread count',
        error: error.message,
        userId,
      });
      throw error;
    }
  }
}
