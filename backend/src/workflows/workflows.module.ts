import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesFollowUpWorkflow } from './sales-follow-up.workflow';
import { OutreachCampaignWorkflow } from './outreach-campaign.workflow';
import {
  Lead, Campaign, WaTemplate, Contact,
  Message, AgentRun,
} from '../common/database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead, Campaign, WaTemplate, Contact, Message, AgentRun]),
  ],
  providers: [SalesFollowUpWorkflow, OutreachCampaignWorkflow],
  exports: [SalesFollowUpWorkflow, OutreachCampaignWorkflow],
})
export class WorkflowsModule {}
