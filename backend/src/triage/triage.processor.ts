import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bullmq';
import { OrchestratorService } from '../agents/orchestrator.service';
import { TriageService } from './triage.service';

@Processor('message-processing')
export class TriageProcessor {
  private readonly logger = new Logger(TriageProcessor.name);

  constructor(
    private readonly triageService: TriageService,
    @Inject(forwardRef(() => OrchestratorService))
    private readonly orchestratorService: OrchestratorService,
  ) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(`Processing ${job.name} job ${job.id}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.debug(`Job ${job.id} completed: agentName=${result?.agentName}, classification=${result?.classification}`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }

  /**
   * Process inbound message through the multi-agent orchestrator.
   */
  @Process('process-message')
  async processMessage(job: Job<{
    messageId: string;
    threadId: string;
    userId: string;
    contactId: string;
    text: string;
    whatsappMessageId: string;
    phoneNumberId: string;
    accessTokenEncrypted: string;
    timestamp: string;
  }>) {
    const { threadId, userId, text, phoneNumberId } = job.data;
    const fromPhone = job.data.phoneNumberId ? `whatsapp:${phoneNumberId}` : 'unknown';

    this.logger.log(`Dispatching via multi-agent orchestrator: ${text.substring(0, 100)}`);

    try {
      // Use the multi-agent orchestrator (orchestrator → triage|sales|outreach|internal-ops)
      const result = await this.orchestratorService.dispatch(text, fromPhone, userId, threadId);

      this.logger.log(`Orchestrator result: agent=${result.agentName}, classification=${result.classification}`);

      return {
        success: true,
        agentName: result.agentName,
        classification: result.classification,
        replyText: result.replyText,
      };
    } catch (error) {
      this.logger.error(`Orchestrator dispatch failed: ${error.message} — falling back to triage`);
      // Fallback to original triage
      const fb = await this.triageService.processMessage(
        job.data.messageId, threadId, userId,
        job.data.contactId, text, phoneNumberId,
        job.data.accessTokenEncrypted, job.data.timestamp,
      );
      return { success: true, agentName: 'triage_fallback', classification: fb.classification };
    }
  }

  @Process('check-follow-up')
  async checkFollowUp(job: Job<{ threadId: string }>) {
    return this.triageService.checkFollowUp(job.data.threadId);
  }
}
