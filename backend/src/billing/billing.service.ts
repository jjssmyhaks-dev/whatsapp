import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../common/database/entities/subscription.entity';
import { User } from '../common/database/entities/user.entity';

const PLANS = {
  free: {
    name: 'Free',
    description: 'For trying out the platform',
    messageLimit: 100,
    price: 0,
    features: [
      '100 messages/month',
      '1 WhatsApp number',
      'Basic templates',
      'Email support',
    ],
  },
  starter: {
    name: 'Starter',
    description: 'For small businesses',
    messageLimit: 1000,
    price: 999, // INR
    features: [
      '1,000 messages/month',
      '1 WhatsApp number',
      'All templates',
      'Priority support',
      'Basic analytics',
    ],
  },
  growth: {
    name: 'Growth',
    description: 'For growing teams',
    messageLimit: 10000,
    price: 4999, // INR
    features: [
      '10,000 messages/month',
      'Up to 3 WhatsApp numbers',
      'All templates + AI replies',
      'Priority support',
      'Advanced analytics',
      'Custom urgency rules',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    description: 'Custom solution for large teams',
    messageLimit: 100000,
    price: 0, // Custom pricing
    features: [
      'Custom message volume',
      'Unlimited WhatsApp numbers',
      'Dedicated support',
      'White-label option',
      'SLA guarantees',
    ],
  },
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  getPlans() {
    return PLANS;
  }

  async getSubscription(userId: string) {
    let sub = await this.subscriptionRepo.findOne({ where: { userId } });
    if (!sub) {
      // Create a free tier subscription automatically
      sub = this.subscriptionRepo.create({
        userId,
        plan: 'free',
        status: 'active',
        billingCycle: 'monthly',
        usageLimit: PLANS.free.messageLimit,
        usageCurrentPeriod: 0,
        messageCount: 0,
      });
      await this.subscriptionRepo.save(sub);
    }
    return sub;
  }

  async getUsage(userId: string) {
    const sub = await this.getSubscription(userId);
    const plan = PLANS[sub.plan as keyof typeof PLANS] || PLANS.free;
    return {
      current: sub.usageCurrentPeriod,
      limit: sub.usageLimit,
      percentage: sub.usageLimit > 0
        ? Math.round((sub.usageCurrentPeriod / sub.usageLimit) * 100 * 10) / 10
        : 0,
      plan: sub.plan,
      planName: plan.name,
      billingCycle: sub.billingCycle,
    };
  }

  async createSubscription(
    userId: string,
    planName: string,
    paymentMethod: string,
  ) {
    const plan = PLANS[planName as keyof typeof PLANS];
    if (!plan) throw new Error(`Unknown plan: ${planName}`);

    let sub = await this.subscriptionRepo.findOne({ where: { userId } });
    if (sub) {
      sub.plan = planName;
      sub.status = 'active';
      sub.usageLimit = plan.messageLimit;
      sub.metadata = { paymentMethod };
      if (planName === 'free') {
        sub.razorpaySubscriptionId = null;
        sub.razorpayPlanId = null;
      }
      await this.subscriptionRepo.save(sub);
    } else {
      sub = this.subscriptionRepo.create({
        userId,
        plan: planName,
        status: 'active',
        billingCycle: 'monthly',
        usageLimit: plan.messageLimit,
        usageCurrentPeriod: 0,
        messageCount: 0,
        metadata: { paymentMethod },
      });
      await this.subscriptionRepo.save(sub);
    }

    // Update user tier
    await this.userRepo.update(userId, { subscriptionTier: planName });

    return sub;
  }

  async cancelSubscription(userId: string) {
    const sub = await this.subscriptionRepo.findOne({ where: { userId } });
    if (!sub) throw new Error('No active subscription');

    sub.cancelAtPeriodEnd = true;
    sub.metadata = { ...sub.metadata, cancelRequestedAt: new Date().toISOString() };
    await this.subscriptionRepo.save(sub);
    return sub;
  }

  async incrementUsage(userId: string, count: number = 1) {
    await this.subscriptionRepo.update(
      { userId },
      {
        usageCurrentPeriod: () => `"usageCurrentPeriod" + ${count}`,
        messageCount: () => `"messageCount" + ${count}`,
      },
    );
  }

  async checkUsageLimit(userId: string): Promise<boolean> {
    const sub = await this.getSubscription(userId);
    if (sub.usageLimit === 0) return true; // Enterprise = unlimited
    return sub.usageCurrentPeriod < sub.usageLimit;
  }
}
