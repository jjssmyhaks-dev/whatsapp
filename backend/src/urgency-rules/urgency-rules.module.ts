import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UrgencyRulesService } from './urgency-rules.service';
import { UrgencyRulesController } from './urgency-rules.controller';
import { UrgencyRule } from '../common/database/entities/urgency-rule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UrgencyRule])],
  controllers: [UrgencyRulesController],
  providers: [UrgencyRulesService],
  exports: [UrgencyRulesService],
})
export class UrgencyRulesModule {}
