import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'agent_runs' })
export class AgentRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: false })
  agentName: string;

  @Column({ nullable: true, type: 'varchar' })
  conversationId: string | null;

  @Column({ nullable: true, type: 'varchar' })
  threadId: string | null;

  @Column({ nullable: false })
  action: string;

  @Column({ type: 'text', nullable: true })
  input: string | null;

  @Column({ type: 'text', nullable: true })
  output: string | null;

  @Column({ nullable: true, type: 'varchar' })
  outcome: string | null;

  @Column({ default: 0, type: 'integer' })
  tokensUsed: number;

  @Column({ default: 0, type: 'integer' })
  durationMs: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
