/**
 * Internal-Ops agent — handles messages from verified team members.
 *
 * Capabilities:
 *   - Authenticate team member by phone number
 *   - Respond to internal queries (stats, lead lookup, campaign status)
 *   - Execute admin commands (pause campaign, update lead, change settings)
 */

import { Logger, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamMember } from '../../common/database/entities/team-member.entity';
import { Lead } from '../../common/database/entities/lead.entity';
import { Campaign } from '../../common/database/entities/campaign.entity';
import { AgentRun } from '../../common/database/entities/agent-run.entity';
import { Message } from '../../common/database/entities/message.entity';

export interface InternalOpsAction {
  outcome: 'authenticated' | 'unauthorized' | 'stats_returned' | 'lead_lookup' | 'campaign_action';
  replyText: string;
}

@Injectable()
export class InternalOpsAgent {
  private readonly logger = new Logger(InternalOpsAgent.name);

  constructor(
    @InjectRepository(TeamMember) private teamMemberRepo: Repository<TeamMember>,
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
    @InjectRepository(Campaign) private campaignRepo: Repository<Campaign>,
    @InjectRepository(AgentRun) private agentRunRepo: Repository<AgentRun>,
  ) {}

  async handle(message: Message, phoneNumber: string, userId: string): Promise<InternalOpsAction> {
    const startTime = Date.now();
    const text = (message.rawText || '').toLowerCase().trim();

    // Verify team membership
    const member = await this.teamMemberRepo.findOne({
      where: { userId, phoneNumber, isActive: true },
    });

    if (!member) {
      await this.logRun(userId, 'internal-ops', 'unauthorized', text, 'unauthorized', null, Date.now() - startTime);
      return { outcome: 'unauthorized', replyText: "Sorry, I didn't recognise this number as an authorised team member. If you believe this is an error, please contact your admin." };
    }

    // --- Stats query ---
    if (text.includes('stats') || text.includes('dashboard') || text.includes('report') || text.includes('summary')) {
      const [totalLeads, wonLeads, activeCampaigns] = await Promise.all([
        this.leadRepo.count({ where: { userId } }),
        this.leadRepo.count({ where: { userId, stage: 'won' } }),
        this.campaignRepo.count({ where: { userId, status: 'active' } }),
      ]);

      const reply = [
        `📊 Quick Stats:`,
        `• Total leads: ${totalLeads}`,
        `• Won: ${wonLeads}`,
        `• Active campaigns: ${activeCampaigns}`,
        ``,
        `Need something more specific? Try "leads by stage", "campaign X status", or "lead lookup PHONE".`,
      ].join('\n');

      await this.logRun(userId, 'internal-ops', 'stats_query', text, 'stats_returned', null, Date.now() - startTime);
      return { outcome: 'stats_returned', replyText: reply };
    }

    // --- Lead lookup by phone ---
    const phoneMatch = text.match(/(\d{10,15})/);
    if ((text.includes('lead') && (text.includes('lookup') || text.includes('find') || text.includes('search'))) || (text.includes('lead') && phoneMatch)) {
      const searchPhone = phoneMatch ? phoneMatch[1] : null;
      if (searchPhone) {
        // Search contacts by phone and leads
        const leads = await this.leadRepo
          .createQueryBuilder('lead')
          .leftJoinAndSelect('lead.contact', 'contact')
          .where('lead.userId = :userId', { userId })
          .andWhere('contact.phoneNumber LIKE :phone', { phone: `%${searchPhone}%` })
          .getMany();

        if (leads.length === 0) {
          const reply = `No leads found for phone containing "${searchPhone}".`;
          await this.logRun(userId, 'internal-ops', 'lead_lookup_empty', text, 'lead_lookup', null, Date.now() - startTime);
          return { outcome: 'lead_lookup', replyText: reply };
        }

        const reply = leads.map(l => {
          const contact = l.contact as any;
          return `📋 Lead: ${contact?.displayName || contact?.phoneNumber || 'Unknown'}\n   Stage: ${l.stage} | Value: ${l.dealValue || '—'} | Next: ${l.nextAction || '—'}`;
        }).join('\n\n');

        await this.logRun(userId, 'internal-ops', 'lead_lookup', text, 'lead_lookup', null, Date.now() - startTime);
        return { outcome: 'lead_lookup', replyText: reply };
      }
    }

    // --- Campaign actions ---
    if (text.includes('campaign') && (text.includes('status') || text.includes('pause') || text.includes('resume') || text.includes('stop'))) {
      const campaigns = await this.campaignRepo.find({ where: { userId }, take: 10 });
      const reply = campaigns.length === 0
        ? 'No campaigns found.'
        : campaigns.map(c => `📢 ${c.name}: ${c.status} (${c.sentCount} sent, ${c.repliedCount} replied)`).join('\n');

      await this.logRun(userId, 'internal-ops', 'campaign_status', text, 'campaign_action', null, Date.now() - startTime);
      return { outcome: 'campaign_action', replyText: reply };
    }

    // --- Default: authenticated, pass to human review suggestion ---
    const reply = `Hey ${member.displayName || 'team member'}! I received your message. If you need stats, try "stats". For lead lookups, try "lead PHONE". For campaign info, try "campaign status". Otherwise a human will review this shortly.`;

    await this.logRun(userId, 'internal-ops', 'default', text, 'authenticated', null, Date.now() - startTime);
    return { outcome: 'authenticated', replyText: reply };
  }

  private async logRun(userId: string, agentName: string, action: string, input: string, outcome: string, threadId: string | null, durationMs: number) {
    try {
      const run = this.agentRunRepo.create({ userId, agentName, action, input, outcome, threadId, durationMs });
      await this.agentRunRepo.save(run);
    } catch (err) { this.logger.warn(`Agent run log failed: ${err.message}`); }
  }
}
