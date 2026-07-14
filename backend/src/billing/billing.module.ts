import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { Subscription } from '../common/database/entities/subscription.entity';
import { User } from '../common/database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, User]),
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
