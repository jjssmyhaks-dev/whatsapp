import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'urgency_rules' })
export class UrgencyRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'keyword_or_phrase', nullable: false })
  keywordOrPhrase: string;

  @Column({ name: 'urgency_level', nullable: false })
  urgencyLevel: 'urgent' | 'important' | 'routine';

  @Column({ name: 'match_type', default: 'contains' })
  matchType: 'contains' | 'exact' | 'regex' | 'starts_with' | 'ends_with';

  @Column({ name: 'is_case_sensitive', default: false })
  isCaseSensitive: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'priority', default: 0 })
  priority: number;

  @Column({ name: 'usage_count', default: 0 })
  usageCount: number;

  @Column({ name: 'last_triggered_at', type: 'timestamp', nullable: true })
  lastTriggeredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
