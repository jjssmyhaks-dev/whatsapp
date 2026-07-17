/**
 * Triage agent — handles urgent/important messages and routine FAQs.
 * Built as a Mastra agent: classifies urgency, auto-replies to routine,
 * alerts humans on urgent/important.
 */

import { Logger, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../../common/database/entities/message.entity';
import { Thread } from '../../common/database/entities/thread.entity';
import { Contact } from '../../common/database/entities/contact.entity';
import { Template } from '../../common/database/entities/template.entity';
import { AgentRun } from '../../common/database/entities/agent-run.entity';

export interface TriageAction {
  classification: 'urgent' | 'important' | 'routine' | 'spam';
  action: 'auto_replied' | 'notification_sent' | 'ignored';
  replyText?: string;
  templateUsed?: string;
}

@Injectable()
export class TriageAgent {
  private readonly logger = new Logger(TriageAgent.name);

  constructor(
    @InjectRepository(Message) private messageRepo: Repository<Message>,
    @InjectRepository(Thread) private threadRepo: Repository<Thread>,
    @InjectRepository(Contact) private contactRepo: Repository<Contact>,
    @InjectRepository(Template) private templateRepo: Repository<Template>,
    @InjectRepository(AgentRun) private agentRunRepo: Repository<AgentRun>,
  ) {}

  async handle(message: Message, thread: Thread, contact: Contact, userId: string): Promise<TriageAction> {
    const startTime = Date.now();
    const text = (message.rawText || '').toLowerCase();

    // VIP override → always urgent
    if (contact.isVip) {
      await this.logRun(userId, 'triage', 'vip_override', text, 'urgent', thread.id, Date.now() - startTime);
      return { classification: 'urgent', action: 'notification_sent' };
    }

    // Urgency keyword check
    const urgent = ['urgent', 'emergency', 'asap', 'critical', 'down', 'broken', 'help immediately'];
    const important = ['important', 'invoice', 'payment', 'contract', 'deadline', 'meeting', 'approval'];
    const spam = ['win a free', 'lottery', 'click this link', 'make money fast'];

    if (urgent.some(k => text.includes(k))) {
      await this.logRun(userId, 'triage', 'keyword_urgent', text, 'urgent', thread.id, Date.now() - startTime);
      return { classification: 'urgent', action: 'notification_sent' };
    }

    if (important.some(k => text.includes(k))) {
      await this.logRun(userId, 'triage', 'keyword_important', text, 'important', thread.id, Date.now() - startTime);
      return { classification: 'important', action: 'notification_sent' };
    }

    if (spam.some(k => text.includes(k))) {
      await this.logRun(userId, 'triage', 'keyword_spam', text, 'spam', thread.id, Date.now() - startTime);
      return { classification: 'spam', action: 'ignored' };
    }

    // Template match for routine messages
    const templates = await this.templateRepo.find({
      where: { userId, active: true },
      order: { priority: 'DESC' },
      take: 20,
    });

    for (const tpl of templates) {
      const triggerLower = tpl.triggerIntent.toLowerCase();
      if (text.includes(triggerLower) || triggerLower.includes(text) || this.fuzzyMatch(text, triggerLower)) {
        await this.logRun(userId, 'triage', 'template_match', text, 'routine', thread.id, Date.now() - startTime, tpl.replyText);
        return {
          classification: 'routine',
          action: 'auto_replied',
          replyText: tpl.replyText,
          templateUsed: tpl.name,
        };
      }
    }

    // Default: routine auto-reply from greeting
    const greeting = ['hello', 'hi', 'hey', 'good morning', 'good afternoon'];
    if (greeting.some(g => text.includes(g))) {
      await this.logRun(userId, 'triage', 'greeting_template', text, 'routine', thread.id, Date.now() - startTime);
      return {
        classification: 'routine',
        action: 'auto_replied',
        replyText: "Hello! Thanks for reaching out. How can we help you today?",
        templateUsed: 'Welcome Greeting',
      };
    }

    // Fallback → important (needs human review)
    await this.logRun(userId, 'triage', 'fallback', text, 'important', thread.id, Date.now() - startTime);
    return { classification: 'important', action: 'notification_sent' };
  }

  private fuzzyMatch(text: string, trigger: string): boolean {
    if (text.length < 4 || trigger.length < 4) return false;
    const words = trigger.split(' ');
    return words.filter(w => w.length > 3 && text.includes(w)).length / words.length >= 0.6;
  }

  private async logRun(
    userId: string, agentName: string, action: string,
    input: string, outcome: string, threadId: string | null,
    durationMs: number, output?: string,
  ) {
    try {
      const run = this.agentRunRepo.create({
        userId, agentName, action, input,
        output: output || null,
        outcome,
        threadId,
        durationMs,
      });
      await this.agentRunRepo.save(run);
    } catch (err) {
      this.logger.warn(`Failed to log agent run: ${err.message}`);
    }
  }
}
