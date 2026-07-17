import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { User as UserEntity } from '../common/database/entities/user.entity';

@ApiTags('billing')
@Controller('billing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get available plans' })
  getPlans() {
    return this.billingService.getPlans();
  }

  @Get('subscription')
  @ApiOperation({ summary: 'Get current subscription' })
  async getSubscription(@User() user: UserEntity) {
    return this.billingService.getSubscription(user.id);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get current usage' })
  async getUsage(@User() user: UserEntity) {
    return this.billingService.getUsage(user.id);
  }

  @Post('subscription')
  @ApiOperation({ summary: 'Create or upgrade subscription' })
  async createSubscription(
    @User() user: UserEntity,
    @Body() dto: { plan: string; paymentMethod: string },
  ) {
    return this.billingService.createSubscription(user.id, dto.plan, dto.paymentMethod);
  }

  @Post('subscription/cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  async cancelSubscription(@User() user: UserEntity) {
    return this.billingService.cancelSubscription(user.id);
  }
}
