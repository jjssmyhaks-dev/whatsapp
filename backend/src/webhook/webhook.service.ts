import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EncryptionService } from '../common/encryption/encryption.service';
import { WhatsAppConnection } from '../common/database/entities/whatsapp-connection.entity';
import { Message } from '../common/database/entities/message.entity';
import { Thread } from '../common/database/entities/thread.entity';
import { Contact } from '../common/database/entities/contact.entity';

// WhatsApp Webhook Payload Types
interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          button?: { text: string };
          interactive?: any;
        }>;
      };
      field: string;
    }>;
  }>;
}

interface WhatsAppVerifyRequest {
  'hub.mode': string;
  'hub.challenge': string;
  'hub.verify_token': string;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private configService: ConfigService,
    private encryptionService: EncryptionService,
    @InjectQueue('message-processing')
    private messageQueue: Queue,
    @InjectRepository(WhatsAppConnection)
    private whatsappConnectionRepo: Repository<WhatsAppConnection>,
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    @InjectRepository(Thread)
    private threadRepo: Repository<Thread>,
    @InjectRepository(Contact)
    private contactRepo: Repository<Contact>,
  ) {}

  /**
   * Verifies the webhook challenge from Meta
   * @param mode The mode (subscribe/unsubscribe)
   * @param challenge The challenge token
   * @param verifyToken The verify token
   * @returns The challenge if valid
   */
  verifyWebhook(mode: string, challenge: string, verifyToken: string): string {
    const expectedToken = this.configService.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN');
    
    if (mode !== 'subscribe' || verifyToken !== expectedToken) {
      this.logger.warn(`Webhook verification failed: mode=${mode}, verifyToken=${verifyToken}`);
      throw new BadRequestException('Webhook verification failed');
    }
    
    this.logger.log('Webhook verification successful');
    return challenge;
  }

  /**
   * Validates the webhook signature from Meta
   * @param payload The raw request body
   * @param signature The X-Hub-Signature-256 header
   * @returns True if signature is valid
   */
  validateSignature(payload: string, signature: string): boolean {
    const appSecret = this.configService.get<string>('WHATSAPP_APP_SECRET');
    if (!appSecret) {
      this.logger.error('WHATSAPP_APP_SECRET not configured');
      return false;
    }

    // Meta uses HMAC-SHA256 with prefix "sha256="
    const expectedSignature = this.encryptionService.hmac(payload, appSecret);
    const expectedFullSignature = `sha256=${expectedSignature}`;

    // Compare signatures
    return this.encryptionService.verifyHmac(
      payload,
      signature.replace('sha256=', ''),
      appSecret,
    );
  }

  /**
   * Processes an inbound webhook payload from WhatsApp
   * @param payload The webhook payload
   * @returns Processing result
   */
  async processWebhook(payload: WhatsAppWebhookPayload): Promise<{ success: boolean; messageId?: string }> {
    try {
      // Extract message data from payload
      const entry = payload.entry?.[0];
      if (!entry) {
        this.logger.warn('No entry in webhook payload');
        return { success: false };
      }

      const change = entry.changes?.[0];
      if (!change) {
        this.logger.warn('No changes in webhook payload');
        return { success: false };
      }

      const value = change.value;
      if (!value || value.messaging_product !== 'whatsapp') {
        this.logger.warn('Not a WhatsApp messaging event');
        return { success: false };
      }

      // Extract metadata
      const phoneNumberId = value.metadata?.phone_number_id;
      const displayPhoneNumber = value.metadata?.display_phone_number;

      if (!phoneNumberId || !displayPhoneNumber) {
        this.logger.warn('Missing phone number metadata in webhook');
        return { success: false };
      }

      // Find the WhatsApp connection for this phone number
      const connection = await this.whatsappConnectionRepo.findOne({
        where: { phoneNumberId },
      });

      if (!connection) {
        this.logger.warn(`No WhatsApp connection found for phone_number_id: ${phoneNumberId}`);
        return { success: false };
      }

      // Process messages
      const messages = value.messages || [];
      
      for (const msg of messages) {
        await this.processMessage(msg, connection, value.contacts);
      }

      return { success: true };
    } catch (error) {
      this.logger.error({
        message: 'Failed to process webhook payload',
        error: error.message,
        stack: error.stack,
      });
      return { success: false };
    }
  }

  /**
   * Processes a single WhatsApp message
   * @param message The message object
   * @param connection The WhatsApp connection
   * @param contacts The contacts from the webhook
   */
  private async processMessage(
    message: any,
    connection: WhatsAppConnection,
    contacts?: Array<{ profile: { name: string }; wa_id: string }>,
  ): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Extract message data
      const messageId = message.id;
      const from = message.from;
      const timestamp = new Date(message.timestamp);
      const messageType = message.type;

      // Extract text content
      let text = '';
      if (messageType === 'text' && message.text?.body) {
        text = message.text.body;
      } else if (messageType === 'button' && message.button?.text) {
        text = message.button.text;
      } else if (messageType === 'interactive') {
        // Handle interactive messages (buttons, lists, etc.)
        text = this.extractInteractiveText(message.interactive);
      } else {
        this.logger.warn(`Unsupported message type: ${messageType}`);
        return;
      }

      // Find or create contact
      let contact = await this.contactRepo.findOne({
        where: { userId: connection.userId, phoneNumber: from },
      });

      if (!contact) {
        // Get contact name from webhook or use phone number
        let displayName = from;
        const waContact = contacts?.find((c) => c.wa_id === from);
        if (waContact?.profile?.name) {
          displayName = waContact.profile.name;
        }

        contact = this.contactRepo.create({
          userId: connection.userId,
          phoneNumber: from,
          displayName,
          whatsappName: waContact?.profile?.name,
        });
        await this.contactRepo.save(contact);
        this.logger.log(`Created new contact: ${from}`);
      }

      // Find or create thread
      let thread = await this.threadRepo.findOne({
        where: { userId: connection.userId, contactId: contact.id },
        order: { createdAt: 'DESC' },
      });

      if (!thread) {
        thread = this.threadRepo.create({
          userId: connection.userId,
          contactId: contact.id,
          threadKey: `${connection.userId}_${from}`,
          status: 'open',
        });
        await this.threadRepo.save(thread);
        this.logger.log(`Created new thread for contact: ${from}`);
      }

      // Create message record
      const messageEntity = this.messageRepo.create({
        threadId: thread.id,
        userId: connection.userId,
        direction: 'inbound',
        rawText: text,
        payload: message,
        whatsappMessageId: messageId,
        createdAt: timestamp,
      });

      await this.messageRepo.save(messageEntity);

      // Update thread
      thread.lastMessageId = messageEntity.id;
      thread.updatedAt = new Date();
      await this.threadRepo.save(thread);

      // Update contact
      contact.lastMessageAt = new Date();
      contact.messageCount += 1;
      await this.contactRepo.save(contact);

      // Add to processing queue
      await this.messageQueue.add(
        'process-message',
        {
          messageId: messageEntity.id,
          threadId: thread.id,
          userId: connection.userId,
          contactId: contact.id,
          text,
          whatsappMessageId: messageId,
          phoneNumberId: connection.phoneNumberId,
          accessTokenEncrypted: connection.accessTokenEncrypted,
          timestamp: timestamp.toISOString(),
        },
        {
          jobId: `msg_${messageEntity.id}`,
          priority: contact.isVip ? 1 : 0,
        },
      );

      this.logger.debug({
        message: 'Message queued for processing',
        messageId: messageEntity.id,
        userId: connection.userId,
        from,
        textLength: text.length,
        processingTime: Date.now() - startTime,
      });
    } catch (error) {
      this.logger.error({
        message: 'Failed to process message',
        error: error.message,
        stack: error.stack,
        messageId: message?.id,
        from: message?.from,
      });
      throw error;
    }
  }

  /**
   * Extracts text from interactive message
   */
  private extractInteractiveText(interactive: any): string {
    if (!interactive) return '';

    if (interactive.type === 'button_reply') {
      return interactive.button_reply?.title || '';
    } else if (interactive.type === 'list_reply') {
      return interactive.list_reply?.title || '';
    } else if (interactive.type === 'product') {
      return `Product: ${interactive.product?.catalog_id || ''}`;
    } else if (interactive.type === 'product_list') {
      return `Product List: ${interactive.product_list?.body || ''}`;
    }

    return JSON.stringify(interactive);
  }

  /**
   * Sends a message via WhatsApp Cloud API
   * @param phoneNumberId The phone number ID to send from
   * @param to The recipient phone number
   * @param text The message text
   * @param accessToken The access token
   * @returns The API response
   */
  async sendMessage(
    phoneNumberId: string,
    to: string,
    text: string,
    accessToken: string,
  ): Promise<any> {
    const apiVersion = this.configService.get<string>('WHATSAPP_API_VERSION', 'v18.0');
    const baseUrl = `https://graph.facebook.com/${apiVersion}`;

    try {
      const response = await fetch(`${baseUrl}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          text: { body: text },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error({
          message: 'Failed to send WhatsApp message',
          status: response.status,
          error,
        });
        throw new Error(`Failed to send message: ${response.status} - ${error}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error({
        message: 'Error sending WhatsApp message',
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Sends a template message via WhatsApp Cloud API
   * @param phoneNumberId The phone number ID to send from
   * @param to The recipient phone number
   * @param templateName The template name
   * @param parameters Template parameters
   * @param accessToken The access token
   * @returns The API response
   */
  async sendTemplateMessage(
    phoneNumberId: string,
    to: string,
    templateName: string,
    accessToken: string,
    parameters?: Array<{ type: string; text?: string; [key: string]: any }>,
  ): Promise<any> {
    const apiVersion = this.configService.get<string>('WHATSAPP_API_VERSION', 'v18.0');
    const baseUrl = `https://graph.facebook.com/${apiVersion}`;

    try {
      const body: any = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en_US' },
        },
      };

      if (parameters && parameters.length > 0) {
        body.template.components = [{ type: 'body', parameters }];
      }

      const response = await fetch(`${baseUrl}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error({
          message: 'Failed to send WhatsApp template message',
          status: response.status,
          error,
        });
        throw new Error(`Failed to send template message: ${response.status} - ${error}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error({
        message: 'Error sending WhatsApp template message',
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Gets the WhatsApp connection for a user
   * @param userId The user ID
   * @returns The WhatsApp connection or null
   */
  async getConnection(userId: string): Promise<WhatsAppConnection | null> {
    return this.whatsappConnectionRepo.findOne({
      where: { userId, status: 'active' },
    });
  }

  /**
   * Gets the access token for a connection (decrypted)
   * @param connection The WhatsApp connection
   * @returns The decrypted access token
   */
  async getAccessToken(connection: WhatsAppConnection): Promise<string> {
    return this.encryptionService.decryptForTenant(
      connection.accessTokenEncrypted,
      connection.userId,
    );
  }
}
