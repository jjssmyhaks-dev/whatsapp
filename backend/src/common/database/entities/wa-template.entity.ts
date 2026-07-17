import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'wa_templates' })
export class WaTemplate {
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

  @Column({ default: 'text' })
  category: 'text' | 'image' | 'document' | 'interactive';

  @Column({ default: 'en_US' })
  language: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ default: 'draft' })
  approvalStatus: 'draft' | 'pending' | 'approved' | 'rejected';

  @Column({ nullable: true, type: 'varchar' })
  metaTemplateId: string;

  @Column({ nullable: true, type: 'text' })
  rejectionReason: string;

  @Column({ default: 0 })
  usageCount: number;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
