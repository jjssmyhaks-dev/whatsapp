import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { TriageModule } from '../triage/triage.module';
import { ThreadsModule } from '../threads/threads.module';

@Module({
  imports: [TriageModule, ThreadsModule],
  controllers: [StatsController],
})
export class StatsModule {}
