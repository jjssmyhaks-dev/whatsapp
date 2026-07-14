import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Thread } from './thread.entity';
import { Message } from './message.entity';

@Entity({ name: 'notifications' })
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  threadId: string;

  @ManyToOne(() => Thread, (thread) => thread.id)
  @JoinColumn({ name: 'thread_id' })
  thread: Thread;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  messageId: string;

  @ManyToOne(() => Message, (message) => message.id)
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @Column({ name: 'notification_type', nullable: false })
  notificationType: 'urgent' | 'important' | 'follow_up' | 'system';

  @Column({ name: 'title', nullable: true })
  title: string;

  @Column({ name: 'body', type: 'text', nullable: true })
  body: string;

  @Column({ name: 'payload', type: 'jsonb', nullable: true })
  payload: Record<string, any>;

  @Column({ name: 'channel', default: 'push' })
  channel: 'push' | 'email' | 'sms';

  @Column({ name: 'recipient_token', nullable: true })
  recipientToken: string;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ default: false })
  delivered: boolean;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ default: false })
  read: boolean;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
