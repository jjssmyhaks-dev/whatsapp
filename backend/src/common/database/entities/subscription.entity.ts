import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'subscriptions' })
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: false })
  plan: string;

  @Column({ default: 'active' })
  status: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'unpaid';

  @Column({ name: 'razorpay_customer_id', nullable: true })
  @Index()
  razorpayCustomerId: string;

  @Column({ name: 'razorpay_subscription_id', nullable: true })
  @Index()
  razorpaySubscriptionId: string;

  @Column({ name: 'razorpay_plan_id', nullable: true })
  razorpayPlanId: string;

  @Column({ name: 'billing_cycle', default: 'monthly' })
  billingCycle: 'monthly' | 'quarterly' | 'yearly';

  @Column({ name: 'current_period_start', type: 'timestamp', nullable: true })
  currentPeriodStart: Date;

  @Column({ name: 'current_period_end', type: 'timestamp', nullable: true })
  currentPeriodEnd: Date;

  @Column({ name: 'trial_start', type: 'timestamp', nullable: true })
  trialStart: Date;

  @Column({ name: 'trial_end', type: 'timestamp', nullable: true })
  trialEnd: Date;

  @Column({ name: 'usage_current_period', default: 0 })
  usageCurrentPeriod: number;

  @Column({ name: 'usage_limit', default: 100 })
  usageLimit: number;

  @Column({ name: 'message_count', default: 0 })
  messageCount: number;

  @Column({ name: 'last_billed_at', type: 'timestamp', nullable: true })
  lastBilledAt: Date;

  @Column({ name: 'next_billing_at', type: 'timestamp', nullable: true })
  nextBillingAt: Date;

  @Column({ name: 'cancel_at_period_end', default: false })
  cancelAtPeriodEnd: boolean;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
