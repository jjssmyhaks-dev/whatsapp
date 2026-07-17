/**
 * Orchestrator agent — routes inbound WhatsApp messages to the correct specialist agent.
 * 
 * Architecture:
 *   Inbound webhook → Orchestrator.classify() → Triage | Sales | Outreach | InternalOps
 * 
 * On message classification:
 *   - Routine/general inquiry → Triage agent
 *   - Purchase intent / pricing → Sales agent
 *   - Marketing reply / campaign → Outreach agent
 *   - Internal/team message → Internal-Ops agent
 */

import { Logger } from '@nestjs/common';

export interface OrchestratorResult {
  agentName: 'triage' | 'sales' | 'outreach' | 'internal-ops';
  confidence: number;
  reason: string;
  extractedIntent: string;
}

export class OrchestratorAgent {
  private readonly logger = new Logger(OrchestratorAgent.name);

  /**
   * Classify inbound message intent and route to the appropriate specialist agent.
   * Fast-path: keyword → rule-based classification.
   * Fallback: Mistral LLM classification.
   */
  async classify(
    messageText: string,
    contactPhone: string,
    context: {
      isVip: boolean;
      isTeamMember: boolean;
      threadHistory: string[];
    },
  ): Promise<OrchestratorResult> {
    const text = messageText.toLowerCase();

    // 1. Internal-ops: message from a team member
    if (context.isTeamMember) {
      return {
        agentName: 'internal-ops',
        confidence: 1.0,
        reason: 'Sender is an authorised team member',
        extractedIntent: 'team_communication',
      };
    }

    // 2. Triage: VIP contacts always get triage (immediate human alert)
    if (context.isVip) {
      return {
        agentName: 'triage',
        confidence: 1.0,
        reason: 'VIP contact — route to triage for immediate human notification',
        extractedIntent: 'vip_contact',
      };
    }

    // 3. Sales intent keywords
    const salesKeywords = [
      'price', 'pricing', 'cost', 'quote', 'proposal', 'buy', 'purchase',
      'plan', 'subscription', 'order', 'demo', 'trial', 'offer', 'discount',
      'how much', 'package', 'plan', 'upgrade',
    ];
    if (salesKeywords.some(k => text.includes(k))) {
      return {
        agentName: 'sales',
        confidence: 0.9,
        reason: `Matched sales intent keywords`,
        extractedIntent: 'sales_inquiry',
      };
    }

    // 4. Triage: urgency + critical keywords
    const urgencyKeywords = [
      'urgent', 'emergency', 'asap', 'critical', 'down', 'broken',
      'help', 'stuck', 'crash', 'error', 'not working', 'issue',
    ];
    if (urgencyKeywords.some(k => text.includes(k))) {
      return {
        agentName: 'triage',
        confidence: 0.9,
        reason: 'Matched urgency keywords',
        extractedIntent: 'urgent_request',
      };
    }

    // 5. Triage: important business keywords
    const importantKeywords = [
      'invoice', 'payment', 'contract', 'deadline', 'meeting',
      'approval', 'document', 'sign',
    ];
    if (importantKeywords.some(k => text.includes(k))) {
      return {
        agentName: 'triage',
        confidence: 0.85,
        reason: 'Matched important business keywords',
        extractedIntent: 'business_important',
      };
    }

    // 6. Outreach: campaign engagement / marketing reply
    const outreachKeywords = [
      'unsubscribe', 'stop', 'opt out', 'not interested', 'interested',
      'more info', 'tell me more', 'offer', 'promotion', 'sale',
    ];
    if (outreachKeywords.some(k => text.includes(k))) {
      return {
        agentName: 'outreach',
        confidence: 0.8,
        reason: 'Matched outreach/campaign keywords',
        extractedIntent: 'campaign_response',
      };
    }

    // 7. Default → Triage (handles everything else: greetings, FAQs, small talk)
    return {
      agentName: 'triage',
      confidence: 0.7,
      reason: 'Default routing — no specific intent matched',
      extractedIntent: 'general_inquiry',
    };
  }
}
