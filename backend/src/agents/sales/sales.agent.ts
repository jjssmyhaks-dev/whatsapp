/**
 * Sales agent — handles purchase intent, pricing inquiries, and lead qualification.
 * This agent:
 *   1. Qualifies inbound sales inquiries
 *   2. Creates/updates leads in the pipeline
 *   3. Sends pricing info / proposals
 *   4. Initiates multi-step follow-up workflow
 */

import { Logger, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from '../../common/database/entities/lead.entity';
import { Contact } from '../../common/database/entities/contact.entity';
import { AgentRun } from '../../common/database/entities/agent-run.entity';
import { Message } from '../../common/database/entities/message.entity';

export interface SalesAction {
  outcome: 'lead_created' | 'lead_updated' | 'info_sent' | 'needs_review';
  leadId?: string;
  stage?: string;
  replyText?: string;
  notes?: string;
}

@Injectable()
export class SalesAgent {
  private readonly logger = new Logger(SalesAgent.name);

  constructor(
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
    @InjectRepository(Contact) private contactRepo: Repository<Contact>,
    @InjectRepository(AgentRun) private agentRunRepo: Repository<AgentRun>,
  ) {}

  async handle(message: Message, contact: Contact, userId: string): Promise<SalesAction> {
    const startTime = Date.now();
    const text = (message.rawText || '').toLowerCase();

    // Find existing lead for this contact
    const existingLead = await this.leadRepo.findOne({
      where: { userId, contactId: contact.id },
      order: { createdAt: 'DESC' },
    });

    // --- Demo request ---
    if (text.includes('demo') || text.includes('trial')) {
      if (existingLead) {
        existingLead.stage = 'qualified';
        existingLead.nextAction = 'Schedule demo call';
        existingLead.notes = (existingLead.notes || '') + '\nContact requested demo/trial';
        existingLead.interactionCount += 1;
        await this.leadRepo.save(existingLead);
        await this.logRun(userId, 'sales', 'demo_request', text, 'lead_updated', null, Date.now() - startTime);
        return {
          outcome: 'lead_updated',
          leadId: existingLead.id,
          stage: 'qualified',
          replyText: "Great — we'd love to show you around! Our team will reach out within 24 hours to schedule your demo. In the meantime, is there anything specific you'd like us to cover?",
          notes: 'Demo requested',
        };
      }

      const newLead = this.leadRepo.create({
        userId, contactId: contact.id,
        stage: 'qualified',
        nextAction: 'Schedule demo call',
        notes: 'Demo requested via WhatsApp',
        interactionCount: 1,
      });
      const saved = await this.leadRepo.save(newLead);
      await this.logRun(userId, 'sales', 'demo_request_new_lead', text, 'lead_created', null, Date.now() - startTime);
      return {
        outcome: 'lead_created',
        leadId: saved.id,
        stage: 'qualified',
        replyText: "Great — we'd love to show you around! Our team will reach out within 24 hours to schedule your demo. In the meantime, is there anything specific you'd like us to cover?",
        notes: 'Demo requested — new lead created',
      };
    }

    // --- Pricing inquiry ---
    if (text.includes('price') || text.includes('pricing') || text.includes('cost') || text.includes('how much')) {
      const reply = "Here's a quick overview: our Starter plan is $29/mo, Professional $79/mo, and Enterprise is custom. Each plan includes WhatsApp automation, smart triage, and analytics. Want me to walk you through which tier fits your needs?";
      if (existingLead) {
        existingLead.interactionCount += 1;
        existingLead.notes = (existingLead.notes || '') + '\nPricing inquiry';
        existingLead.nextAction = 'Follow up on pricing';
        await this.leadRepo.save(existingLead);
        await this.logRun(userId, 'sales', 'pricing_inquiry', text, 'info_sent', null, Date.now() - startTime);
        return { outcome: 'info_sent', leadId: existingLead.id, stage: existingLead.stage, replyText: reply };
      }

      const newLead = this.leadRepo.create({
        userId, contactId: contact.id,
        stage: 'lead',
        nextAction: 'Follow up on pricing',
        notes: 'Pricing inquiry via WhatsApp',
        interactionCount: 1,
      });
      const saved = await this.leadRepo.save(newLead);
      await this.logRun(userId, 'sales', 'pricing_inquiry_new_lead', text, 'lead_created', null, Date.now() - startTime);
      return { outcome: 'lead_created', leadId: saved.id, stage: 'lead', replyText: reply, notes: 'New lead — pricing inquiry' };
    }

    // --- Order / Purchase intent ---
    if (text.includes('buy') || text.includes('purchase') || text.includes('order') || text.includes('subscribe') || text.includes('sign up') || text.includes('upgrade')) {
      const reply = "Exciting! Let's get you set up. Could you tell me which plan you're interested in — Starter ($29/mo), Professional ($79/mo), or Enterprise (custom)? I'll prepare everything for you.";
      if (existingLead) {
        existingLead.stage = 'proposal';
        existingLead.nextAction = 'Prepare proposal and send contract';
        existingLead.interactionCount += 1;
        existingLead.notes = (existingLead.notes || '') + '\nPurchase intent expressed';
        await this.leadRepo.save(existingLead);
        await this.logRun(userId, 'sales', 'purchase_intent', text, 'lead_updated', null, Date.now() - startTime);
        return { outcome: 'lead_updated', leadId: existingLead.id, stage: 'proposal', replyText: reply };
      }

      const newLead = this.leadRepo.create({
        userId, contactId: contact.id,
        stage: 'proposal',
        nextAction: 'Prepare proposal and send contract',
        notes: 'Purchase intent via WhatsApp',
        interactionCount: 1,
      });
      const saved = await this.leadRepo.save(newLead);
      await this.logRun(userId, 'sales', 'purchase_intent_new_lead', text, 'lead_created', null, Date.now() - startTime);
      return { outcome: 'lead_created', leadId: saved.id, stage: 'proposal', replyText: reply, notes: 'New lead — purchase intent' };
    }

    // --- Qualification / general sales inquiry ---
    const reply = "Thanks for your interest! To make sure we send the right info: are you looking for yourself, a small team, or a larger organization? That'll help us tailor the conversation.";
    if (existingLead) {
      existingLead.interactionCount += 1;
      existingLead.nextAction = 'Qualify further';
      existingLead.notes = (existingLead.notes || '') + '\nGeneral sales inquiry';
      await this.leadRepo.save(existingLead);
      await this.logRun(userId, 'sales', 'general_inquiry', text, 'lead_updated', null, Date.now() - startTime);
      return { outcome: 'lead_updated', leadId: existingLead.id, stage: existingLead.stage, replyText: reply };
    }

    const newLead = this.leadRepo.create({
      userId, contactId: contact.id,
      stage: 'lead',
      nextAction: 'Qualify lead',
      notes: 'General sales inquiry via WhatsApp',
      interactionCount: 1,
    });
    const saved = await this.leadRepo.save(newLead);
    await this.logRun(userId, 'sales', 'general_inquiry_new_lead', text, 'lead_created', null, Date.now() - startTime);
    return { outcome: 'lead_created', leadId: saved.id, stage: 'lead', replyText: reply, notes: 'New lead — general inquiry' };
  }

  private async logRun(userId: string, agentName: string, action: string, input: string, outcome: string, threadId: string | null, durationMs: number) {
    try {
      const run = this.agentRunRepo.create({ userId, agentName, action, input, outcome, threadId, durationMs });
      await this.agentRunRepo.save(run);
    } catch (err) { this.logger.warn(`Agent run log failed: ${err.message}`); }
  }
}
