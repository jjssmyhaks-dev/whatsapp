import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Thread } from '../common/database/entities/thread.entity';
import { Message } from '../common/database/entities/message.entity';
import { Contact } from '../common/database/entities/contact.entity';

@Injectable()
export class ThreadsService {
  private readonly logger = new Logger(ThreadsService.name);

  constructor(
    @InjectRepository(Thread)
    private threadRepo: Repository<Thread>,
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    @InjectRepository(Contact)
    private contactRepo: Repository<Contact>,
  ) {}

  async listThreads(
    userId: string,
    options: {
      status?: string;
      priority?: string;
      limit?: number;
      offset?: number;
      search?: string;
    } = {},
  ) {
    const qb = this.threadRepo
      .createQueryBuilder('thread')
      .leftJoinAndSelect('thread.contact', 'contact')
      .where('thread.userId = :userId', { userId });

    if (options.status) {
      qb.andWhere('thread.status = :status', { status: options.status });
    }
    if (options.priority) {
      qb.andWhere('thread.priority = :priority', { priority: options.priority });
    }
    if (options.search) {
      qb.andWhere(
        '(contact.displayName ILIKE :search OR contact.phoneNumber ILIKE :search)',
        { search: `%${options.search}%` },
      );
    }

    qb.orderBy('thread.updatedAt', 'DESC')
      .take(options.limit || 50)
      .skip(options.offset || 0);

    const [threads, total] = await qb.getManyAndCount();
    return { threads, total };
  }

  async getThread(userId: string, threadId: string) {
    const thread = await this.threadRepo.findOne({
      where: { id: threadId, userId },
      relations: ['contact'],
    });
    if (!thread) throw new Error('Thread not found');
    return thread;
  }

  async getMessages(
    userId: string,
    threadId: string,
    options: { limit?: number; offset?: number } = {},
  ) {
    const [messages, total] = await this.messageRepo.findAndCount({
      where: { threadId, userId },
      order: { createdAt: 'DESC' },
      take: options.limit || 50,
      skip: options.offset || 0,
    });
    return { messages: messages.reverse(), total };
  }

  async updateThread(
    userId: string,
    threadId: string,
    data: {
      status?: 'open' | 'closed' | 'archived' | 'waiting_human';
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      assigneeId?: string | null;
    },
  ) {
    const thread = await this.threadRepo.findOne({
      where: { id: threadId, userId },
    });
    if (!thread) throw new Error('Thread not found');

    if (data.status) thread.status = data.status;
    if (data.priority) thread.priority = data.priority;
    if (data.assigneeId !== undefined) thread.assigneeId = data.assigneeId;
    thread.updatedAt = new Date();

    await this.threadRepo.save(thread);
    return thread;
  }

  async sendMessage(
    userId: string,
    threadId: string,
    text: string,
  ) {
    const thread = await this.threadRepo.findOne({
      where: { id: threadId, userId },
    });
    if (!thread) throw new Error('Thread not found');

    const message = this.messageRepo.create({
      threadId,
      userId,
      direction: 'outbound',
      rawText: text,
      actionTaken: 'human_replied',
      whatsappStatus: 'pending',
    });
    await this.messageRepo.save(message);

    // Update thread lastHumanReplyAt
    thread.lastHumanReplyAt = new Date();
    thread.lastMessageId = message.id;
    thread.updatedAt = new Date();
    await this.threadRepo.save(thread);

    return message;
  }

  async getStats(userId: string) {
    const totalThreads = await this.threadRepo.count({ where: { userId } });
    const totalMessages = await this.messageRepo.count({ where: { userId } });

    const urgentMessages = await this.messageRepo.count({
      where: { userId, classification: 'urgent' },
    });
    const importantMessages = await this.messageRepo.count({
      where: { userId, classification: 'important' },
    });
    const routineMessages = await this.messageRepo.count({
      where: { userId, classification: 'routine' },
    });

    const fastPathMessages = await this.messageRepo.count({
      where: { userId, fastPathHit: true },
    });

    const openThreads = await this.threadRepo.count({
      where: { userId, status: 'open' },
    });
    const waitingThreads = await this.threadRepo.count({
      where: { userId, status: 'waiting_human' },
    });

    return {
      totalThreads,
      openThreads,
      waitingThreads,
      totalMessages,
      urgentCount: urgentMessages,
      importantCount: importantMessages,
      routineCount: routineMessages,
      fastPathHitRate:
        totalMessages > 0
          ? Math.round((fastPathMessages / totalMessages) * 100 * 10) / 10
          : 0,
    };
  }
}
