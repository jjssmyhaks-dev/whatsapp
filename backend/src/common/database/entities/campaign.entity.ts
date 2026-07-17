import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'campaigns' })
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: false })
  name: string;

  @Column({ default: 'draft' })
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 0 })
  messageCount: number;

  @Column({ default: 0 })
  sentCount: number;

  @Column({ default: 0 })
  repliedCount: number;

  @Column({ type: 'jsonb', default: [] })
  sequence: Array<{
    day: number;
    templateId: string;
    delayHours: number;
  }>;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
