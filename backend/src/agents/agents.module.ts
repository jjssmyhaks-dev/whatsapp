import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrchestratorAgent } from './orchestrator/orchestrator.agent';
import { TriageAgent } from './triage/triage.agent';
import { SalesAgent } from './sales/sales.agent';
import { OutreachAgent } from './outreach/outreach.agent';
import { InternalOpsAgent } from './internal-ops/internal-ops.agent';
import { OrchestratorService } from './orchestrator.service';
import {
  Message, Thread, Contact, Template, UrgencyRule,
  Notification, Lead, Campaign, WaTemplate, AgentRun,
  TeamMember, KnowledgeBase, User,
} from '../common/database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Message, Thread, Contact, Template, UrgencyRule,
      Notification, Lead, Campaign, WaTemplate, AgentRun,
      TeamMember, KnowledgeBase, User,
    ]),
  ],
  providers: [
    OrchestratorAgent,
    TriageAgent,
    SalesAgent,
    OutreachAgent,
    InternalOpsAgent,
    OrchestratorService,
  ],
  exports: [OrchestratorService],
})
export class AgentsModule {}
