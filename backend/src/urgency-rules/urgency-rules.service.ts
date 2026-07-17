import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UrgencyRule } from '../common/database/entities/urgency-rule.entity';

@Injectable()
export class UrgencyRulesService {
  private readonly logger = new Logger(UrgencyRulesService.name);

  private readonly DEFAULT_RULES = [
    { keywordOrPhrase: 'urgent', urgencyLevel: 'urgent' as const, matchType: 'contains' as const, priority: 10 },
    { keywordOrPhrase: 'emergency', urgencyLevel: 'urgent' as const, matchType: 'contains' as const, priority: 10 },
    { keywordOrPhrase: 'asap', urgencyLevel: 'urgent' as const, matchType: 'contains' as const, priority: 9 },
    { keywordOrPhrase: 'critical', urgencyLevel: 'urgent' as const, matchType: 'contains' as const, priority: 9 },
    { keywordOrPhrase: 'server down', urgencyLevel: 'urgent' as const, matchType: 'contains' as const, priority: 8 },
    { keywordOrPhrase: 'deadline', urgencyLevel: 'important' as const, matchType: 'contains' as const, priority: 8 },
    { keywordOrPhrase: 'payment', urgencyLevel: 'important' as const, matchType: 'contains' as const, priority: 7 },
    { keywordOrPhrase: 'invoice', urgencyLevel: 'important' as const, matchType: 'contains' as const, priority: 7 },
    { keywordOrPhrase: 'meeting', urgencyLevel: 'important' as const, matchType: 'contains' as const, priority: 6 },
    { keywordOrPhrase: 'contract', urgencyLevel: 'important' as const, matchType: 'contains' as const, priority: 6 },
  ];

  constructor(
    @InjectRepository(UrgencyRule)
    private urgencyRuleRepo: Repository<UrgencyRule>,
  ) {}

  async seedDefaults(userId: string): Promise<void> {
    const existing = await this.urgencyRuleRepo.count({ where: { userId } });
    if (existing > 0) return;

    const rules = this.DEFAULT_RULES.map((r) =>
      this.urgencyRuleRepo.create({ userId, ...r, isActive: true }),
    );
    await this.urgencyRuleRepo.save(rules);
    this.logger.log(`Seeded ${rules.length} default urgency rules for user ${userId}`);
  }

  async list(userId: string, options: { limit?: number; offset?: number } = {}) {
    const [rules, total] = await this.urgencyRuleRepo.findAndCount({
      where: { userId },
      order: { priority: 'DESC', createdAt: 'DESC' },
      take: options.limit || 100,
      skip: options.offset || 0,
    });
    return { rules, total };
  }

  async get(userId: string, id: string) {
    const rule = await this.urgencyRuleRepo.findOne({ where: { id, userId } });
    if (!rule) throw new Error('Rule not found');
    return rule;
  }

  async create(
    userId: string,
    dto: {
      keywordOrPhrase: string;
      urgencyLevel: 'urgent' | 'important' | 'routine';
      matchType?: 'contains' | 'exact' | 'regex' | 'starts_with' | 'ends_with';
      isCaseSensitive?: boolean;
      isActive?: boolean;
      priority?: number;
    },
  ) {
    const rule = this.urgencyRuleRepo.create({
      userId,
      keywordOrPhrase: dto.keywordOrPhrase,
      urgencyLevel: dto.urgencyLevel,
      matchType: dto.matchType || 'contains',
      isCaseSensitive: dto.isCaseSensitive ?? false,
      isActive: dto.isActive ?? true,
      priority: dto.priority || 0,
    });
    await this.urgencyRuleRepo.save(rule);
    return rule;
  }

  async update(
    userId: string,
    id: string,
    dto: {
      keywordOrPhrase?: string;
      urgencyLevel?: 'urgent' | 'important' | 'routine';
      matchType?: 'contains' | 'exact' | 'regex' | 'starts_with' | 'ends_with';
      isCaseSensitive?: boolean;
      isActive?: boolean;
      priority?: number;
    },
  ) {
    const rule = await this.urgencyRuleRepo.findOne({ where: { id, userId } });
    if (!rule) throw new Error('Rule not found');

    if (dto.keywordOrPhrase !== undefined) rule.keywordOrPhrase = dto.keywordOrPhrase;
    if (dto.urgencyLevel !== undefined) rule.urgencyLevel = dto.urgencyLevel;
    if (dto.matchType !== undefined) rule.matchType = dto.matchType;
    if (dto.isCaseSensitive !== undefined) rule.isCaseSensitive = dto.isCaseSensitive;
    if (dto.isActive !== undefined) rule.isActive = dto.isActive;
    if (dto.priority !== undefined) rule.priority = dto.priority;
    rule.updatedAt = new Date();

    await this.urgencyRuleRepo.save(rule);
    return rule;
  }

  async delete(userId: string, id: string) {
    const result = await this.urgencyRuleRepo.delete({ id, userId });
    return (result.affected ?? 0) > 0;
  }

  async toggle(userId: string, id: string) {
    const rule = await this.urgencyRuleRepo.findOne({ where: { id, userId } });
    if (!rule) throw new Error('Rule not found');
    rule.isActive = !rule.isActive;
    rule.updatedAt = new Date();
    await this.urgencyRuleRepo.save(rule);
    return rule;
  }
}
