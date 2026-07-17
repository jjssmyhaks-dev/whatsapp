import { Logger, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../common/database/entities/campaign.entity';
import { Contact } from '../common/database/entities/contact.entity';
import { WaTemplate } from '../common/database/entities/wa-template.entity';
import { Message } from '../common/database/entities/message.entity';
import { AgentRun } from '../common/database/entities/agent-run.entity';

@Injectable()
export class OutreachCampaignWorkflow {
  private readonly logger = new Logger(OutreachCampaignWorkflow.name);

  constructor(
    @InjectRepository(Campaign) private campaignRepo: Repository<Campaign>,
    @InjectRepository(Contact) private contactRepo: Repository<Contact>,
    @InjectRepository(WaTemplate) private waTemplateRepo: Repository<WaTemplate>,
    @InjectRepository(Message) private messageRepo: Repository<Message>,
    @InjectRepository(AgentRun) private agentRunRepo: Repository<AgentRun>,
  ) {}

  async processActiveCampaigns(userId: string) {
    const campaigns = await this.campaignRepo.find({
      where: { userId, status: 'active' },
    });

    const results: Array<{ campaignId: string; messagesQueued: number }> = [];

    for (const campaign of campaigns) {
      try {
        const r = await this.processCampaign(campaign, userId);
        results.push(r);
      } catch (err) {
        this.logger.error(`Campaign ${campaign.id} failed: ${(err as Error).message}`);
      }
    }

    return results;
  }

  private async processCampaign(campaign: Campaign, userId: string) {
    const campaignDays = this.daysSince(campaign.startedAt || campaign.createdAt);
    const sequence = campaign.sequence || [];
    const currentStep = sequence.find((s: { day: number; templateId: string; delayHours: number }) => this.daysMatch(campaignDays, s.day));

    if (!currentStep) return { campaignId: campaign.id, messagesQueued: 0 };

    const optedOut: string[] = campaign.metadata?.optedOut || [];
    const contacts = await this.contactRepo.find({ where: { userId } });
    const eligibleContacts = contacts.filter(c => !optedOut.includes(c.id));

    const sentKey = `step_${currentStep.day}_sent`;
    const alreadySent: string[] = campaign.metadata?.[sentKey] || [];
    const pending = eligibleContacts.filter(c => !alreadySent.includes(c.id));

    const template = await this.waTemplateRepo.findOne({ where: { id: currentStep.templateId } });
    if (!template || template.approvalStatus !== 'approved') {
      this.logger.warn(`Campaign ${campaign.id} step ${currentStep.day}: template unavailable or not approved`);
      return { campaignId: campaign.id, messagesQueued: 0 };
    }

    let sent = 0;
    const newSent: string[] = [];

    for (const contact of pending.slice(0, 50)) {
      const personalizedMsg = template.content
        .replace('{{firstName}}', contact.displayName || 'there')
        .replace('{{phone}}', contact.phoneNumber);

      this.logger.log(`[CAMPAIGN] ${campaign.name} → ${contact.phoneNumber}: "${personalizedMsg.substring(0, 80)}..."`);

      const msg = this.messageRepo.create({
        userId,
        rawText: personalizedMsg,
        direction: 'outbound',
        payload: { from: 'campaign-workflow', campaignId: campaign.id, stepDay: currentStep.day, templateUsed: template.name },
      });
      await this.messageRepo.save(msg);

      newSent.push(contact.id);
      sent++;
    }

    campaign.metadata = {
      ...(campaign.metadata || {}),
      [sentKey]: [...alreadySent, ...newSent],
    };
    campaign.sentCount += sent;

    if (campaign.sentCount >= eligibleContacts.length * sequence.length) {
      campaign.status = 'completed';
      campaign.completedAt = new Date();
    }

    await this.campaignRepo.save(campaign);

    await this.logRun(userId, 'outreach-workflow', 'campaign_step', `Campaign: ${campaign.id} day ${currentStep.day}`, `${sent} messages sent`);
    return { campaignId: campaign.id, messagesQueued: sent };
  }

  async launchCampaign(campaignId: string, userId: string) {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId, userId } });
    if (!campaign) throw new Error('Campaign not found');

    campaign.status = 'active';
    campaign.startedAt = new Date();
    await this.campaignRepo.save(campaign);

    await this.logRun(userId, 'outreach-workflow', 'launch_campaign', `Campaign: ${campaign.id}`, 'launched');
    return campaign;
  }

  private daysSince(date: Date): number {
    return Math.floor((Date.now() - new Date(date).getTime()) / 86400_000);
  }

  private daysMatch(actual: number, target: number): boolean {
    return actual >= target && actual < target + 1;
  }

  private async logRun(userId: string, agentName: string, action: string, input: string, outcome: string) {
    try {
      const run = this.agentRunRepo.create({ userId, agentName, action, input, outcome, durationMs: 0 });
      await this.agentRunRepo.save(run);
    } catch (err) { this.logger.warn(`Run log failed: ${(err as Error).message}`); }
  }
}
