import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EncryptionService } from '../common/encryption/encryption.service';
import { WhatsAppConnection } from '../common/database/entities/whatsapp-connection.entity';
import { WebhookService } from '../webhook/webhook.service';

@Injectable()
export class WhatsAppConnectionsService {
  private readonly logger = new Logger(WhatsAppConnectionsService.name);

  constructor(
    private encryptionService: EncryptionService,
    @InjectRepository(WhatsAppConnection)
    private connectionRepo: Repository<WhatsAppConnection>,
    private webhookService: WebhookService,
  ) {}

  async list(userId: string) {
    return this.connectionRepo.find({
      where: { userId },
      select: [
        'id', 'userId', 'wabaId', 'phoneNumberId', 'businessPhoneNumber',
        'status', 'webhookUrl', 'metaApiVersion', 'createdAt', 'updatedAt',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async get(userId: string, id: string) {
    const conn = await this.connectionRepo.findOne({
      where: { id, userId },
      select: [
        'id', 'userId', 'wabaId', 'phoneNumberId', 'businessPhoneNumber',
        'status', 'webhookUrl', 'metaApiVersion', 'createdAt', 'updatedAt',
      ],
    });
    if (!conn) throw new Error('Connection not found');
    return conn;
  }

  async create(
    userId: string,
    dto: {
      phoneNumberId: string;
      businessPhoneNumber: string;
      accessToken: string;
      webhookVerifyToken?: string;
    },
  ) {
    const encrypted = this.encryptionService.encryptForTenant(dto.accessToken, userId);

    const conn = this.connectionRepo.create({
      userId,
      phoneNumberId: dto.phoneNumberId,
      businessPhoneNumber: dto.businessPhoneNumber,
      accessTokenEncrypted: encrypted,
      webhookVerifyToken: dto.webhookVerifyToken || null,
      status: 'pending',
      metaApiVersion: 'v18.0',
    });
    await this.connectionRepo.save(conn);
    return conn;
  }

  async update(
    userId: string,
    id: string,
    dto: { webhookUrl?: string; status?: 'pending' | 'active' | 'inactive' | 'error' },
  ) {
    const conn = await this.connectionRepo.findOne({ where: { id, userId } });
    if (!conn) throw new Error('Connection not found');

    if (dto.webhookUrl !== undefined) conn.webhookUrl = dto.webhookUrl;
    if (dto.status !== undefined) conn.status = dto.status;
    conn.updatedAt = new Date();

    await this.connectionRepo.save(conn);
    return conn;
  }

  async delete(userId: string, id: string) {
    const result = await this.connectionRepo.delete({ id, userId });
    return (result.affected ?? 0) > 0;
  }

  async testMessage(
    userId: string,
    id: string,
    dto: { to: string; text: string },
  ) {
    const conn = await this.connectionRepo.findOne({ where: { id, userId } });
    if (!conn) throw new Error('Connection not found');

    const token = this.encryptionService.decryptForTenant(
      conn.accessTokenEncrypted,
      userId,
    );

    return this.webhookService.sendMessage(
      conn.phoneNumberId,
      dto.to,
      dto.text,
      token,
    );
  }
}
