import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Contact } from './contact.entity';

@Entity({ name: 'leads' })
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  contactId: string;

  @ManyToOne(() => Contact, { nullable: true })
  @JoinColumn({ name: 'contact_id' })
  contact: Contact;

  @Column({ default: 'lead' })
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  dealValue: number;

  @Column({ nullable: true })
  dealCurrency: string;

  @Column({ nullable: true, type: 'text' })
  nextAction: string;

  @Column({ type: 'timestamp', nullable: true })
  nextActionDue: Date;

  @Column({ nullable: true, type: 'varchar' })
  ownerId: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column({ name: 'interaction_count', default: 0 })
  interactionCount: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
