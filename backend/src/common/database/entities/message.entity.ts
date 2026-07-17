import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Thread } from './thread.entity';
import { User } from './user.entity';

@Entity({ name: 'messages' })
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  threadId: string;

  @ManyToOne(() => Thread, (thread) => thread.id)
  @JoinColumn({ name: 'thread_id' })
  thread: Thread;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ default: 'inbound' })
  direction: 'inbound' | 'outbound';

  @Column({ name: 'raw_text', type: 'text', nullable: true })
  rawText: string;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, any>;

  @Column({ nullable: true })
  classification: 'urgent' | 'important' | 'routine' | 'spam' | 'ambiguous';

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  confidence: number;

  @Column({ name: 'action_taken', nullable: true })
  actionTaken: 'auto_replied' | 'notification_sent' | 'queued' | 'ignored' | 'human_replied' | 'error';

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId: string;

  @Column({ name: 'mistral_prompt', type: 'text', nullable: true })
  mistralPrompt: string;

  @Column({ name: 'mistral_response', type: 'text', nullable: true })
  mistralResponse: string;

  @Column({ name: 'mistral_model', nullable: true })
  mistralModel: string;

  @Column({ name: 'mistral_tokens_used', type: 'integer', nullable: true })
  mistralTokensUsed: number;

  @Column({ name: 'fast_path_hit', default: false })
  fastPathHit: boolean;

  @Column({ name: 'fast_path_type', nullable: true })
  fastPathType: 'keyword' | 'embedding' | 'regex' | 'vip_override';

  @Column({ name: 'processing_time_ms', type: 'integer', nullable: true })
  processingTimeMs: number;

  @Column({ name: 'whatsapp_message_id', nullable: true })
  @Index()
  whatsappMessageId: string;

  @Column({ name: 'whatsapp_status', nullable: true })
  whatsappStatus: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
