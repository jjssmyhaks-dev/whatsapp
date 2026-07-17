import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'templates' })
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'name', nullable: false })
  name: string;

  @Column({ name: 'trigger_intent', nullable: false })
  @Index()
  triggerIntent: string;

  @Column({ name: 'trigger_embedding', type: 'text', nullable: true })
  triggerEmbedding: string | null;

  @Column({ name: 'reply_text', type: 'text', nullable: false })
  replyText: string;

  @Column({ default: true })
  active: boolean;

  @Column({ name: 'is_urgent_acknowledgement', default: false })
  isUrgentAcknowledgement: boolean;

  @Column({ name: 'response_type', default: 'text' })
  responseType: 'text' | 'template' | 'interactive';

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ name: 'usage_count', default: 0 })
  usageCount: number;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @Column({ name: 'priority', default: 0 })
  priority: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
