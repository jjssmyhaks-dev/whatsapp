import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrchestratorAgent } from './orchestrator/orchestrator.agent';
import { TriageAgent } from './triage/triage.agent';
import { SalesAgent } from './sales/sales.agent';
import { OutreachAgent } from './outreach/outreach.agent';
import { InternalOpsAgent } from './internal-ops/internal-ops.agent';
import { Message } from '../common/database/entities/message.entity';
import { Thread } from '../common/database/entities/thread.entity';
import { Contact } from '../common/database/entities/contact.entity';
import { TeamMember } from '../common/database/entities/team-member.entity';
import { Notification } from '../common/database/entities/notification.entity';

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(
    @InjectRepository(Message) private messageRepo: Repository<Message>,
    @InjectRepository(Thread) private threadRepo: Repository<Thread>,
    @InjectRepository(Contact) private contactRepo: Repository<Contact>,
    @InjectRepository(TeamMember) private teamMemberRepo: Repository<TeamMember>,
    @InjectRepository(Notification) private notificationRepo: Repository<Notification>,
    private orchestratorAgent: OrchestratorAgent,
    private triageAgent: TriageAgent,
    private salesAgent: SalesAgent,
    private outreachAgent: OutreachAgent,
    private internalOpsAgent: InternalOpsAgent,
  ) {}

  async dispatch(messageText: string, fromPhone: string, userId: string, threadId: string) {
    this.logger.log(`Dispatching message from ${fromPhone} for user ${userId}`);

    const contact = await this.contactRepo.findOne({ where: { phoneNumber: fromPhone, userId } });
    const isVip = contact?.isVip ?? false;
    const isTeamMember = !!(await this.teamMemberRepo.findOne({ where: { phoneNumber: fromPhone, userId, isActive: true } }));

    const classification = await this.orchestratorAgent.classify(messageText, fromPhone, {
      isVip,
      isTeamMember,
      threadHistory: [],
    });

    this.logger.log(`Routed to ${classification.agentName} (confidence: ${classification.confidence})`);

    // Find or create thread
    let thread = await this.threadRepo.findOne({ where: { id: threadId } });
    if (!thread) {
      if (!contact) {
        const newContact = this.contactRepo.create({ userId, phoneNumber: fromPhone, displayName: fromPhone });
        const saved = await this.contactRepo.save(newContact);
        thread = this.threadRepo.create({
          userId,
          contactId: saved.id,
          threadKey: `${userId}_${fromPhone}`,
          status: 'open',
        });
      } else {
        thread = this.threadRepo.create({
          userId,
          contactId: contact.id,
          threadKey: `${userId}_${fromPhone}`,
          status: 'open',
        });
      }
    }

    // Create inbound message
    const message = this.messageRepo.create({
      userId,
      threadId: thread.id,
      rawText: messageText,
      direction: 'inbound',
      payload: { from: fromPhone },
    });

    if (!thread.id) {
      thread = await this.threadRepo.save(thread);
    }
    message.threadId = thread.id;
    const savedMsg = await this.messageRepo.save(message);

    // Update thread
    thread.lastMessageId = savedMsg.id;
    await this.threadRepo.save(thread);

    // Dispatch to specialist
    const result = await this.executeSpecialistAgent(
      classification.agentName, savedMsg, thread, contact, fromPhone, userId,
    );

    // Store the reply
    if (result.replyText) {
      const outbound = this.messageRepo.create({
        userId,
        threadId: thread.id,
        rawText: result.replyText,
        direction: 'outbound',
        payload: { from: 'agent', agentName: classification.agentName, templateUsed: result.templateUsed },
      });
      const savedOut = await this.messageRepo.save(outbound);
      thread.lastMessageId = savedOut.id;
    }

    // Notification for urgent/important
    if (result.classification === 'urgent' || result.classification === 'important') {
      await this.sendHumanNotification(userId, thread.id, fromPhone, messageText, result.classification);
    }

    // Update thread priority
    if (result.classification === 'urgent') thread.priority = 'urgent';
    else if (result.classification === 'important') thread.priority = 'high';
    await this.threadRepo.save(thread);

    return {
      agentName: classification.agentName,
      classification: result.classification,
      replyText: result.replyText,
      templateUsed: result.templateUsed,
      threadId: thread.id,
    };
  }

  private async executeSpecialistAgent(agentName: string, message: Message, thread: Thread, contact: Contact | null, fromPhone: string, userId: string) {
    switch (agentName) {
      case 'internal-ops': {
        const r = await this.internalOpsAgent.handle(message, fromPhone, userId);
        return { classification: r.outcome as string, replyText: r.replyText };
      }
      case 'sales': {
        if (!contact) {
          contact = this.contactRepo.create({ userId, phoneNumber: fromPhone, displayName: fromPhone });
          contact = await this.contactRepo.save(contact);
        }
        const r = await this.salesAgent.handle(message, contact, userId);
        return {
          classification: 'routine',
          replyText: r.replyText,
          templateUsed: `Sales: ${r.outcome}`,
        };
      }
      case 'outreach': {
        if (!contact) {
          contact = this.contactRepo.create({ userId, phoneNumber: fromPhone, displayName: fromPhone });
          contact = await this.contactRepo.save(contact);
        }
        const r = await this.outreachAgent.handle(message, contact, userId);
        return {
          classification: 'routine',
          replyText: r.replyText,
          templateUsed: `Outreach: ${r.outcome}`,
        };
      }
      case 'triage':
      default: {
        if (!contact) {
          contact = this.contactRepo.create({ userId, phoneNumber: fromPhone, displayName: fromPhone });
          contact = await this.contactRepo.save(contact);
        }
        const r = await this.triageAgent.handle(message, thread, contact, userId);
        return {
          classification: r.classification,
          replyText: r.replyText,
          templateUsed: r.templateUsed,
        };
      }
    }
  }

  private async sendHumanNotification(userId: string, threadId: string, fromPhone: string, messageText: string, urgency: string) {
    try {
      const notification = this.notificationRepo.create({
        userId,
        threadId,
        notificationType: urgency === 'urgent' ? 'urgent' : 'important',
        title: `${urgency === 'urgent' ? '🚨 Urgent' : '⚠️ Important'} from ${fromPhone}`,
        body: messageText.substring(0, 300),
        channel: 'push',
        read: false,
      });
      await this.notificationRepo.save(notification);
    } catch (err) {
      this.logger.warn(`Failed to create notification: ${err.message}`);
    }
  }
}
