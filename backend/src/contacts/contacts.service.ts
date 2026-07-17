import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../common/database/entities/contact.entity';

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(
    @InjectRepository(Contact)
    private contactRepo: Repository<Contact>,
  ) {}

  async list(userId: string, options: { limit?: number; offset?: number; vip?: boolean; search?: string } = {}) {
    const qb = this.contactRepo
      .createQueryBuilder('contact')
      .where('contact.userId = :userId', { userId });

    if (options.vip !== undefined) {
      qb.andWhere('contact.isVip = :vip', { vip: options.vip });
    }
    if (options.search) {
      qb.andWhere(
        '(contact.displayName ILIKE :s OR contact.phoneNumber ILIKE :s)',
        { s: `%${options.search}%` },
      );
    }

    qb.orderBy('contact.lastMessageAt', 'DESC', 'NULLS LAST')
      .take(options.limit || 50)
      .skip(options.offset || 0);

    const [contacts, total] = await qb.getManyAndCount();
    return { contacts, total };
  }

  async get(userId: string, id: string) {
    const contact = await this.contactRepo.findOne({ where: { id, userId } });
    if (!contact) throw new Error('Contact not found');
    return contact;
  }

  async update(
    userId: string,
    id: string,
    dto: { displayName?: string; isVip?: boolean; tags?: string[] },
  ) {
    const contact = await this.contactRepo.findOne({ where: { id, userId } });
    if (!contact) throw new Error('Contact not found');

    if (dto.displayName !== undefined) contact.displayName = dto.displayName;
    if (dto.isVip !== undefined) contact.isVip = dto.isVip;
    if (dto.tags !== undefined) contact.tags = dto.tags;
    contact.updatedAt = new Date();

    await this.contactRepo.save(contact);
    return contact;
  }
}
