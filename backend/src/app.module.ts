import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { WebhookModule } from './webhook/webhook.module';
import { TriageModule } from './triage/triage.module';
import { TemplatesModule } from './templates/templates.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ThreadsModule } from './threads/threads.module';
import { BillingModule } from './billing/billing.module';
import { UrgencyRulesModule } from './urgency-rules/urgency-rules.module';
import { ContactsModule } from './contacts/contacts.module';
import { WhatsAppConnectionsModule } from './whatsapp-connections/whatsapp-connections.module';
import { StatsModule } from './stats/stats.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { SeedModule } from './common/seed/seed.module';
import { DatabaseModule } from './common/database/database.module';
import { EncryptionModule } from './common/encryption/encryption.module';
import { MistralModule } from './common/mistral/mistral.module';
import { EmbeddingsModule } from './common/embeddings/embeddings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
    CommonModule,
    EncryptionModule,
    MistralModule,
    EmbeddingsModule,
    WebhookModule,
    TriageModule,
    TemplatesModule,
    NotificationsModule,
    ThreadsModule,
    BillingModule,
    UrgencyRulesModule,
    ContactsModule,
    WhatsAppConnectionsModule,
    StatsModule,
    AuthModule,
  ],
})
export class AppModule {}
