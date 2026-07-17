import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TemplatesService } from '../templates/templates.service';
import { UrgencyRulesService } from '../urgency-rules/urgency-rules.service';

const DEFAULT_TEMPLATES = [
  {
    name: 'Business Hours',
    triggerIntent: 'What are your business hours?',
    replyText: 'We are open Monday to Friday, 9 AM to 6 PM IST. We typically respond within 2 hours during business hours.',
    priority: 10,
  },
  {
    name: 'Contact Info',
    triggerIntent: 'How can I contact you?',
    replyText: 'You can reach us anytime via WhatsApp here, or email us at support@example.com. We aim to respond within 24 hours.',
    priority: 9,
  },
  {
    name: 'Services Info',
    triggerIntent: 'What services do you offer?',
    replyText: 'We offer [service description]. Please let us know what you need help with and we can provide more details!',
    priority: 8,
  },
  {
    name: 'Thank You Reply',
    triggerIntent: 'Thank you',
    replyText: "You're welcome! Is there anything else we can help you with?",
    priority: 7,
  },
  {
    name: 'Welcome Greeting',
    triggerIntent: 'Hello',
    replyText: "Hello! Welcome to [Business Name]. How can we assist you today?",
    priority: 6,
  },
  {
    name: 'Pricing FAQ',
    triggerIntent: 'What are your prices?',
    replyText: 'Our pricing depends on your specific needs. Could you let us know what services you are interested in? We would be happy to share a tailored quote.',
    priority: 5,
  },
  {
    name: 'Urgent Acknowledgement',
    triggerIntent: 'urgent acknowledgement',
    replyText: 'Thank you for your message. We have received your urgent request and will respond as soon as possible.',
    isUrgentAcknowledgement: true,
    priority: 10,
  },
];

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @Inject(TemplatesService) private templatesService: TemplatesService,
    @Inject(UrgencyRulesService) private urgencyRulesService: UrgencyRulesService,
  ) {}

  async onModuleInit() {
    // Seed happens on first user registration, not here
    this.logger.log('Seed service initialized. Seeds are applied per-user on first access.');
  }

  async seedForUser(userId: string) {
    await this.seedTemplates(userId);
    await this.urgencyRulesService.seedDefaults(userId);
  }

  private async seedTemplates(userId: string) {
    try {
      const { total } = await this.templatesService.listTemplates(userId, { take: 1 });
      if (total > 0) {
        this.logger.log(`User ${userId} already has templates, skipping seed`);
        return;
      }

      for (const tpl of DEFAULT_TEMPLATES) {
        await this.templatesService.createTemplate(userId, {
          name: tpl.name,
          triggerIntent: tpl.triggerIntent,
          replyText: tpl.replyText,
          active: true,
          isUrgentAcknowledgement: tpl.isUrgentAcknowledgement || false,
          responseType: 'text',
          priority: tpl.priority,
        });
      }

      this.logger.log(`Seeded ${DEFAULT_TEMPLATES.length} default templates for user ${userId}`);
    } catch (error) {
      this.logger.warn(`Failed to seed templates: ${error.message}`);
    }
  }
}
