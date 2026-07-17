import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { WhatsAppConnection } from '../common/database/entities/whatsapp-connection.entity';
import { Message } from '../common/database/entities/message.entity';
import { Thread } from '../common/database/entities/thread.entity';
import { Contact } from '../common/database/entities/contact.entity';
import { Lead, Campaign, WaTemplate, AgentRun, TeamMember, Notification, KnowledgeBase } from '../common/database/entities';
import { TriageModule } from '../triage/triage.module';
import { AgentsModule } from '../agents/agents.module';
import { WorkflowsModule } from '../workflows/workflows.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'message-processing',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    TypeOrmModule.forFeature([
      WhatsAppConnection, Message, Thread, Contact,
      Lead, Campaign, WaTemplate, AgentRun, TeamMember,
      Notification, KnowledgeBase,
    ]),
    forwardRef(() => TriageModule),
    AgentsModule,
    WorkflowsModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
