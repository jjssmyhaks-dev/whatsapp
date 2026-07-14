import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Contact } from './contact.entity';

@Entity({ name: 'threads' })
export class Thread {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  contactId: string;

  @ManyToOne(() => Contact, (contact) => contact.id)
  @JoinColumn({ name: 'contact_id' })
  contact: Contact;

  @Column({ name: 'thread_key', nullable: true })
  @Index()
  threadKey: string;

  @Column({ name: 'last_message_id', type: 'uuid', nullable: true })
  lastMessageId: string;

  @Column({ name: 'last_human_reply_at', type: 'timestamp', nullable: true })
  lastHumanReplyAt: Date;

  @Column({ name: 'sla_deadline', type: 'timestamp', nullable: true })
  slaDeadline: Date;

  @Column({ name: 'follow_up_sent', default: false })
  followUpSent: boolean;

  @Column({ name: 'follow_up_count', default: 0 })
  followUpCount: number;

  @Column({ default: 'open' })
  status: 'open' | 'closed' | 'archived' | 'waiting_human';

  @Column({ name: 'priority', default: 'normal' })
  priority: 'low' | 'normal' | 'high' | 'urgent';

  @Column({ name: 'assignee_id', type: 'uuid', nullable: true })
  assigneeId: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
