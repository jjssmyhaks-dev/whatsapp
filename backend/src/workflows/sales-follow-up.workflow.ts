import { Logger, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from '../common/database/entities/lead.entity';
import { Contact } from '../common/database/entities/contact.entity';
import { Message } from '../common/database/entities/message.entity';
import { AgentRun } from '../common/database/entities/agent-run.entity';

export interface FollowUpStep {
  day: number;
  templateMessage: string;
  action: 'send_message' | 'check_reply' | 'mark_lost' | 'mark_won';
}

const FOLLOW_UP_SEQUENCE: FollowUpStep[] = [
  {
    day: 0,
    templateMessage: "Hi {{firstName}}! Thanks for reaching out about WhatsApp Copilot. I wanted to follow up — do you have any questions?",
    action: 'send_message',
  },
  {
    day: 3,
    templateMessage: "Hi {{firstName}}, just checking in. We'd love to help you get started with WhatsApp Copilot. Would a quick call work for you this week?",
    action: 'send_message',
  },
  {
    day: 7,
    templateMessage: "Hi {{firstName}} — last message from me. If you're still interested in WhatsApp Copilot, I'm here to help. If the timing isn't right, no worries.",
    action: 'send_message',
  },
  {
    day: 14,
    templateMessage: '',
    action: 'mark_lost',
  },
];

@Injectable()
export class SalesFollowUpWorkflow {
  private readonly logger = new Logger(SalesFollowUpWorkflow.name);

  constructor(
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
    @InjectRepository(Contact) private contactRepo: Repository<Contact>,
    @InjectRepository(Message) private messageRepo: Repository<Message>,
    @InjectRepository(AgentRun) private agentRunRepo: Repository<AgentRun>,
  ) {}

  async processDueFollowUps(userId: string) {
    const leads = await this.leadRepo
      .createQueryBuilder('lead')
      .leftJoinAndSelect('lead.contact', 'contact')
      .where('lead.userId = :userId', { userId })
      .andWhere('lead.stage IN (:...stages)', { stages: ['lead', 'qualified', 'proposal', 'negotiation'] })
      .getMany();

    const results: Array<{ leadId: string; action: string; success: boolean }> = [];

    for (const lead of leads) {
      try {
        const result = await this.processLead(lead, userId);
        results.push(result);
      } catch (err) {
        this.logger.error(`Failed to process lead ${lead.id}: ${(err as Error).message}`);
        results.push({ leadId: lead.id, action: 'error', success: false });
      }
    }

    return results;
  }

  private async processLead(lead: Lead, userId: string) {
    const contact = lead.contact as Contact | null;
    if (!contact) return { leadId: lead.id, action: 'no_contact', success: false };

    const daysSinceCreation = this.daysBetween(new Date(lead.createdAt), new Date());
    const currentStep = this.findCurrentStep(daysSinceCreation);
    if (!currentStep) return { leadId: lead.id, action: 'no_step_due', success: true };

    // Check if contact has replied since last check
    const hasReplied = await this.hasRecentReply(contact.phoneNumber, userId);
    if (hasReplied && daysSinceCreation < 14) {
      this.logger.log(`Lead ${lead.id} replied recently — skipping follow-up`);
      return { leadId: lead.id, action: 'skipped_has_reply', success: true };
    }

    switch (currentStep.action) {
      case 'send_message': {
        const text = currentStep.templateMessage.replace('{{firstName}}', contact.displayName || 'there');
        this.logger.log(`[SALES-FU] Day ${currentStep.day} → Lead ${lead.id}: "${text.substring(0, 80)}..."`);

        const outMsg = this.messageRepo.create({
          userId,
          rawText: text,
          direction: 'outbound',
          payload: { from: 'sales-workflow', leadId: lead.id },
        });
        await this.messageRepo.save(outMsg);

        lead.nextAction = `Follow-up day ${currentStep.day} sent`;
        lead.nextActionDue = new Date(Date.now() + 3 * 86400_000);
        lead.interactionCount += 1;
        await this.leadRepo.save(lead);

        await this.logRun(userId, 'sales-follow-up', `follow_up_day_${currentStep.day}`, lead.id, 'message_sent');
        return { leadId: lead.id, action: `sent_day_${currentStep.day}`, success: true };
      }

      case 'mark_lost': {
        lead.stage = 'lost';
        lead.nextAction = null as any;
        lead.notes = (lead.notes || '') + '\nMarked lost: 14 days no response';
        await this.leadRepo.save(lead);
        await this.logRun(userId, 'sales-follow-up', 'mark_lost', lead.id, 'lost');
        return { leadId: lead.id, action: 'marked_lost', success: true };
      }

      default:
        return { leadId: lead.id, action: 'no_action', success: true };
    }
  }

  private findCurrentStep(daysSinceCreation: number): FollowUpStep | null {
    const dueSteps = FOLLOW_UP_SEQUENCE.filter(s => daysSinceCreation >= s.day);
    if (dueSteps.length === 0) return null;
    return dueSteps[dueSteps.length - 1];
  }

  private async hasRecentReply(phoneNumber: string, userId: string): Promise<boolean> {
    const since = new Date(Date.now() - 3 * 86400_000);
    return this.messageRepo
      .createQueryBuilder('msg')
      .where('msg.userId = :userId', { userId })
      .andWhere('msg.payload @> :payload', { payload: JSON.stringify({ from: phoneNumber }) })
      .andWhere('msg.direction = :dir', { dir: 'inbound' })
      .andWhere('msg.createdAt > :since', { since })
      .getExists();
  }

  private daysBetween(a: Date, b: Date): number {
    return Math.floor((b.getTime() - a.getTime()) / 86400_000);
  }

  private async logRun(userId: string, agentName: string, action: string, leadId: string, outcome: string) {
    try {
      const run = this.agentRunRepo.create({
        userId, agentName, action,
        input: `Lead: ${leadId}`,
        outcome,
        metadata: { leadId },
        durationMs: 0,
      });
      await this.agentRunRepo.save(run);
    } catch (err) { this.logger.warn(`Run log failed: ${(err as Error).message}`); }
  }
}
