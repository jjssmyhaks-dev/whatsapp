import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { TemplatesModule } from '../../templates/templates.module';
import { UrgencyRulesModule } from '../../urgency-rules/urgency-rules.module';

@Module({
  imports: [TemplatesModule, UrgencyRulesModule],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
