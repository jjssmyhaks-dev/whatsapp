/**
 * Outreach agent — handles campaign replies, opt-in/opt-out, and marketing engagement.
 *
 * Manages:
 *   - Opt-out/unsubscribe requests
 *   - Campaign response tracking
 *   - Interest signals for retargeting
 */

import { Logger, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../../common/database/entities/campaign.entity';
import { Contact } from '../../common/database/entities/contact.entity';
import { AgentRun } from '../../common/database/entities/agent-run.entity';
import { Message } from '../../common/database/entities/message.entity';

export interface OutreachAction {
  outcome: 'opted_out' | 'interested' | 'not_interested' | 'info_requested' | 'campaign_reply_logged';
  replyText?: string;
  notes?: string;
}

@Injectable()
export class OutreachAgent {
  private readonly logger = new Logger(OutreachAgent.name);

  constructor(
    @InjectRepository(Campaign) private campaignRepo: Repository<Campaign>,
    @InjectRepository(Contact) private contactRepo: Repository<Contact>,
    @InjectRepository(AgentRun) private agentRunRepo: Repository<AgentRun>,
  ) {}

  async handle(message: Message, contact: Contact, userId: string): Promise<OutreachAction> {
    const startTime = Date.now();
    const text = (message.rawText || '').toLowerCase();

    // --- Opt-out ---
    if (['stop', 'unsubscribe', 'opt out', 'remove me', 'no more'].some(k => text.includes(k))) {
      // Find active campaigns this contact is part of
      const activeCampaigns = await this.campaignRepo.find({
        where: { userId, status: 'active' },
      });
      for (const c of activeCampaigns) {
        c.metadata = { ...(c.metadata || {}), optedOut: [...(c.metadata?.optedOut || []), contact.id] };
        await this.campaignRepo.save(c);
      }
      await this.logRun(userId, 'outreach', 'opt_out', text, 'opted_out', null, Date.now() - startTime);
      return {
        outcome: 'opted_out',
        replyText: "You've been removed from our messaging list. You won't receive further automated messages from us. If you change your mind, just say 'subscribe' anytime.",
        notes: 'Contact opted out from all active campaigns',
      };
    }

    // --- Re-subscribe ---
    if (['subscribe', 'start', 'opt in', 'resume', 'yes please'].some(k => text.includes(k))) {
      // Remove from opt-out lists
      const campaigns = await this.campaignRepo.find({ where: { userId, status: { $in: ['active', 'paused'] } as any } });
      for (const c of campaigns) {
        if (c.metadata?.optedOut?.includes(contact.id)) {
          c.metadata.optedOut = c.metadata.optedOut.filter((id: string) => id !== contact.id);
          await this.campaignRepo.save(c);
        }
      }
      await this.logRun(userId, 'outreach', 'resubscribe', text, 'interested', null, Date.now() - startTime);
      return {
        outcome: 'interested',
        replyText: "You're back on the list! You'll receive our updates going forward. Is there anything specific you'd like to hear about?",
        notes: 'Contact re-subscribed',
      };
    }

    // --- Interested ---
    if (['interested', 'tell me more', 'more info', 'learn more', 'sounds good', 'how does it work'].some(k => text.includes(k))) {
      await this.logRun(userId, 'outreach', 'interest_signal', text, 'interested', null, Date.now() - startTime);
      return {
        outcome: 'interested',
        replyText: "Awesome — glad you're interested! A member of our team will reach out with more details shortly. In the meantime, you can check out our website for more info.",
        notes: 'Positive engagement signal from outreach',
      };
    }

    // --- Not interested ---
    if (['not interested', 'no thanks', 'not now', 'maybe later', 'not for me'].some(k => text.includes(k))) {
      await this.logRun(userId, 'outreach', 'not_interested', text, 'not_interested', null, Date.now() - startTime);
      return {
        outcome: 'not_interested',
        replyText: "No problem at all! We'll pause sending you messages for now. If anything changes, we're just a message away.",
        notes: 'Contact declined — marked not interested',
      };
    }

    // --- General campaign reply ---
    await this.logRun(userId, 'outreach', 'campaign_reply', text, 'campaign_reply_logged', null, Date.now() - startTime);
    return {
      outcome: 'campaign_reply_logged',
      replyText: "Thanks for your response! A human team member will review this and get back to you if needed.",
      notes: 'Generic campaign reply logged',
    };
  }

  private async logRun(userId: string, agentName: string, action: string, input: string, outcome: string, threadId: string | null, durationMs: number) {
    try {
      const run = this.agentRunRepo.create({ userId, agentName, action, input, outcome, threadId, durationMs });
      await this.agentRunRepo.save(run);
    } catch (err) { this.logger.warn(`Agent run log failed: ${err.message}`); }
  }
}
