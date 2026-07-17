import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsAppConnectionsService } from './whatsapp-connections.service';
import { WhatsAppConnectionsController } from './whatsapp-connections.controller';
import { WhatsAppConnection } from '../common/database/entities/whatsapp-connection.entity';
import { EncryptionModule } from '../common/encryption/encryption.module';
import { WebhookModule } from '../webhook/webhook.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WhatsAppConnection]),
    EncryptionModule,
    forwardRef(() => WebhookModule),
  ],
  controllers: [WhatsAppConnectionsController],
  providers: [WhatsAppConnectionsService],
  exports: [WhatsAppConnectionsService],
})
export class WhatsAppConnectionsModule {}
