import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { WebhookModule } from './webhook/webhook.module';
import { TriageModule } from './triage/triage.module';
import { TemplatesModule } from './templates/templates.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ThreadsModule } from './threads/threads.module';
import { BillingModule } from './billing/billing.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './common/database/database.module';
import { EncryptionModule } from './common/encryption/encryption.module';
import { MistralModule } from './common/mistral/mistral.module';
import { EmbeddingsModule } from './common/embeddings/embeddings.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    DatabaseModule,

    // BullMQ Queue
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),

    // Common modules
    CommonModule,
    EncryptionModule,
    MistralModule,
    EmbeddingsModule,

    // Feature modules
    WebhookModule,
    TriageModule,
    TemplatesModule,
    NotificationsModule,
    ThreadsModule,
    BillingModule,
    AuthModule,
  ],
})
export class AppModule {}
