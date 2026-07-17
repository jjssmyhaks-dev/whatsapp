import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TriageService } from './triage.service';
import { TriageProcessor } from './triage.processor';
import { Message } from '../common/database/entities/message.entity';
import { Thread } from '../common/database/entities/thread.entity';
import { Template } from '../common/database/entities/template.entity';
import { UrgencyRule } from '../common/database/entities/urgency-rule.entity';
import { Contact } from '../common/database/entities/contact.entity';
import { Notification } from '../common/database/entities/notification.entity';
import { TemplatesModule } from '../templates/templates.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebhookModule } from '../webhook/webhook.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'follow-up-scheduler',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    TypeOrmModule.forFeature([Message, Thread, Template, UrgencyRule, Contact, Notification]),
    TemplatesModule,
    NotificationsModule,
    forwardRef(() => WebhookModule),
  ],
  providers: [TriageService, TriageProcessor],
  exports: [TriageService],
})
export class TriageModule {}
