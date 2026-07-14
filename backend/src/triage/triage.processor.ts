import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { TriageService } from './triage.service';

@Processor('message-processing')
export class TriageProcessor {
  private readonly logger = new Logger(TriageProcessor.name);

  constructor(private readonly triageService: TriageService) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug({
      message: 'Processing job',
      jobId: job.id,
      jobName: job.name,
    });
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.debug({
      message: 'Job completed',
      jobId: job.id,
      jobName: job.name,
      result,
    });
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error({
      message: 'Job failed',
      jobId: job.id,
      jobName: job.name,
      error: error.message,
      stack: error.stack,
    });
  }

  /**
   * Processes a message from the queue
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
    const {
      messageId,
      threadId,
      userId,
      contactId,
      text,
      whatsappMessageId,
      phoneNumberId,
      accessTokenEncrypted,
      timestamp,
    } = job.data;

    this.logger.log({
      message: 'Processing message from queue',
      messageId,
      userId,
      textLength: text.length,
    });

    try {
      // Process the message through triage
      const result = await this.triageService.processMessage(
        messageId,
        threadId,
        userId,
        contactId,
        text,
        phoneNumberId,
        accessTokenEncrypted,
        timestamp,
      );

      // Schedule follow-up if needed
      if (result.classification === 'urgent' || result.classification === 'important') {
        await this.triageService.scheduleFollowUp(threadId, userId);
      }

      this.logger.log({
        message: 'Message processed successfully',
        messageId,
        classification: result.classification,
        action: result.action,
        fastPathHit: result.fastPathHit,
        processingTimeMs: result.processingTimeMs,
      });

      return result;
    } catch (error) {
      this.logger.error({
        message: 'Failed to process message in queue',
        error: error.message,
        stack: error.stack,
        messageId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Processes follow-up checks
   */
  @Process('check-follow-up')
  async checkFollowUp(job: Job<{ threadId: string }>) {
    const { threadId } = job.data;

    this.logger.log({
      message: 'Checking follow-up for thread',
      threadId,
    });

    try {
      const result = await this.triageService.checkFollowUp(threadId);
      
      if (result) {
        this.logger.log({
          message: 'Follow-up sent for thread',
          threadId,
        });
      }

      return result;
    } catch (error) {
      this.logger.error({
        message: 'Failed to check follow-up',
        error: error.message,
        stack: error.stack,
        threadId,
      });
      throw error;
    }
  }
}
