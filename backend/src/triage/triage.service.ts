import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { MistralService } from '../common/mistral/mistral.service';
import { EmbeddingsService } from '../common/embeddings/embeddings.service';
import { EncryptionService } from '../common/encryption/encryption.service';
import { Message } from '../common/database/entities/message.entity';
import { Thread } from '../common/database/entities/thread.entity';
import { Template } from '../common/database/entities/template.entity';
import { UrgencyRule } from '../common/database/entities/urgency-rule.entity';
import { Contact } from '../common/database/entities/contact.entity';
import { Notification } from '../common/database/entities/notification.entity';
import { WebhookService } from '../webhook/webhook.service';
import { NotificationsService } from '../notifications/notifications.service';

// Types for triage results
export interface TriageResult {
  messageId: string;
  classification: 'urgent' | 'important' | 'routine' | 'spam' | 'ambiguous';
  confidence: number;
  action: 'auto_replied' | 'notification_sent' | 'queued' | 'ignored' | 'error';
  replyText?: string;
  templateId?: string;
  fastPathHit: boolean;
  fastPathType?: 'keyword' | 'embedding' | 'regex' | 'vip_override';
  processingTimeMs: number;
  mistralPrompt?: string;
  mistralResponse?: string;
  mistralTokensUsed?: number;
  error?: string;
}

interface FastPathResult {
  matched: boolean;
  type: 'keyword' | 'embedding' | 'regex' | 'vip_override';
  classification?: 'urgent' | 'important' | 'routine' | 'spam';
  template?: Template;
  rule?: UrgencyRule;
}

@Injectable()
export class TriageService {
  private readonly logger = new Logger(TriageService.name);
  private readonly DEFAULT_SLA_HOURS = 2;
  private readonly DEFAULT_EMBEDDING_THRESHOLD = 0.85;

  constructor(
    private mistralService: MistralService,
    private embeddingsService: EmbeddingsService,
    private encryptionService: EncryptionService,
    private webhookService: WebhookService,
    private notificationsService: NotificationsService,
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    @InjectRepository(Thread)
    private threadRepo: Repository<Thread>,
    @InjectRepository(Template)
    private templateRepo: Repository<Template>,
    @InjectRepository(UrgencyRule)
    private urgencyRuleRepo: Repository<UrgencyRule>,
    @InjectRepository(Contact)
    private contactRepo: Repository<Contact>,
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
  ) {}

  /**
   * Processes a message through the triage pipeline
   * This is the main entry point for message processing
   */
  async processMessage(
    messageId: string,
    threadId: string,
    userId: string,
    contactId: string,
    text: string,
    phoneNumberId: string,
    accessTokenEncrypted: string,
    timestamp?: string,
  ): Promise<TriageResult> {
    const startTime = Date.now();
    
    try {
      // Load entities
      const message = await this.messageRepo.findOne({ where: { id: messageId } });
      const thread = await this.threadRepo.findOne({ where: { id: threadId } });
      const contact = await this.contactRepo.findOne({ where: { id: contactId } });
      
      if (!message || !thread || !contact) {
        throw new Error(`Entities not found: message=${messageId}, thread=${threadId}, contact=${contactId}`);
      }

      // Get access token
      const accessToken = this.encryptionService.decryptForTenant(
        accessTokenEncrypted,
        userId,
      );

      // Step 1: Fast-path check (VIP override first)
      const fastPathResult = await this.checkFastPath(text, userId, contact);
      
      if (fastPathResult.matched) {
        return await this.handleFastPathResult(
          fastPathResult,
          message,
          thread,
          contact,
          phoneNumberId,
          accessToken,
          startTime,
        );
      }

      // Step 2: Mistral classification and reply generation
      const mistralResult = await this.classifyWithMistral(
        text,
        thread,
        userId,
      );

      return await this.handleMistralResult(
        mistralResult,
        message,
        thread,
        contact,
        phoneNumberId,
        accessToken,
        startTime,
      );
    } catch (error) {
      this.logger.error({
        message: 'Triage processing failed',
        error: error.message,
        stack: error.stack,
        messageId,
        userId,
      });

      // Update message with error
      await this.messageRepo.update(messageId, {
        errorMessage: error.message,
        actionTaken: 'error',
      });

      return {
        messageId,
        classification: 'ambiguous',
        confidence: 0,
        action: 'error',
        fastPathHit: false,
        processingTimeMs: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Checks the fast-path rules (keyword, regex, embedding, VIP override)
   */
  private async checkFastPath(
    text: string,
    userId: string,
    contact: Contact,
  ): Promise<FastPathResult> {
    const startTime = Date.now();
    
    // Check 1: VIP override - always urgent for VIP contacts
    if (contact.isVip) {
      this.logger.debug({
        message: 'Fast-path: VIP override',
        userId,
        contactId: contact.id,
        processingTime: Date.now() - startTime,
      });
      
      return {
        matched: true,
        type: 'vip_override',
        classification: 'urgent',
      };
    }

    // Check 2: Urgency keyword/regex rules
    const urgencyRules = await this.urgencyRuleRepo.find({
      where: { userId, isActive: true },
      order: { priority: 'DESC' },
    });

    for (const rule of urgencyRules) {
      if (this.matchRule(text, rule)) {
        this.logger.debug({
          message: 'Fast-path: Urgency rule matched',
          userId,
          ruleId: rule.id,
          keyword: rule.keywordOrPhrase,
          classification: rule.urgencyLevel,
          processingTime: Date.now() - startTime,
        });

        // Update rule usage
        await this.urgencyRuleRepo.update(rule.id, {
          usageCount: rule.usageCount + 1,
          lastTriggeredAt: new Date(),
        });

        return {
          matched: true,
          type: rule.matchType === 'regex' ? 'regex' : 'keyword',
          classification: rule.urgencyLevel,
          rule,
        };
      }
    }

    // Check 3: Template embedding similarity
    const templates = await this.templateRepo.find({
      where: { userId, active: true, triggerEmbedding: MoreThan('') },
      order: { priority: 'DESC' },
    });

    if (templates.length > 0) {
      const threshold = this.getEmbeddingThreshold(userId);
      
      for (const template of templates) {
        try {
          if (!template.triggerEmbedding) continue;
          const embedding = JSON.parse(template.triggerEmbedding) as number[];
          const similarity = this.embeddingsService.cosineSimilarity(
            embedding,
            await this.embeddingsService.generateEmbedding(text),
          );

          if (similarity >= threshold) {
            this.logger.debug({
              message: 'Fast-path: Template embedding matched',
              userId,
              templateId: template.id,
              similarity,
              threshold,
              processingTime: Date.now() - startTime,
            });

            // Update template usage
            await this.templateRepo.update(template.id, {
              usageCount: template.usageCount + 1,
              lastUsedAt: new Date(),
            });

            return {
              matched: true,
              type: 'embedding',
              template,
            };
          }
        } catch (error) {
          this.logger.warn({
            message: 'Failed to parse template embedding',
            templateId: template.id,
            error: error.message,
          });
        }
      }
    }

    this.logger.debug({
      message: 'Fast-path: No match found',
      userId,
      processingTime: Date.now() - startTime,
    });

    return { matched: false, type: 'keyword' };
  }

  /**
   * Matches text against a rule
   */
  private matchRule(text: string, rule: UrgencyRule): boolean {
    const pattern = rule.keywordOrPhrase;
    const message = rule.isCaseSensitive ? text : text.toLowerCase();
    const keyword = rule.isCaseSensitive ? pattern : pattern.toLowerCase();

    switch (rule.matchType) {
      case 'exact':
        return message === keyword;
      case 'contains':
        return message.includes(keyword);
      case 'starts_with':
        return message.startsWith(keyword);
      case 'ends_with':
        return message.endsWith(keyword);
      case 'regex':
        try {
          const regex = new RegExp(pattern, rule.isCaseSensitive ? '' : 'i');
          return regex.test(text);
        } catch (error) {
          this.logger.warn({
            message: 'Invalid regex pattern',
            pattern,
            error: error.message,
          });
          return false;
        }
      default:
        return message.includes(keyword);
    }
  }

  /**
   * Handles a fast-path match result
   */
  private async handleFastPathResult(
    result: FastPathResult,
    message: Message,
    thread: Thread,
    contact: Contact,
    phoneNumberId: string,
    accessToken: string,
    startTime: number,
  ): Promise<TriageResult> {
    try {
      // If VIP override or urgency rule matched as urgent/important
      if (result.classification === 'urgent' || result.classification === 'important') {
        // Send notification
        await this.notificationsService.sendUrgentNotification(
          thread.userId,
          thread.id,
          message.id,
          result.classification,
          message.rawText || '',
          contact,
        );

        // Check if we should send an acknowledgement
        if (result.classification === 'urgent') {
          // For urgent messages, only send acknowledgement template
          const ackTemplate = await this.getUrgentAcknowledgementTemplate(thread.userId);
          if (ackTemplate) {
            await this.webhookService.sendMessage(
              phoneNumberId,
              contact.phoneNumber,
              ackTemplate.replyText,
              accessToken,
            );

            // Update message
            await this.messageRepo.update(message.id, {
              classification: result.classification,
              confidence: 1.0,
              actionTaken: 'auto_replied',
              templateId: ackTemplate.id,
              fastPathHit: true,
              fastPathType: result.type,
              processingTimeMs: Date.now() - startTime,
            });

            return {
              messageId: message.id,
              classification: result.classification,
              confidence: 1.0,
              action: 'auto_replied',
              replyText: ackTemplate.replyText,
              templateId: ackTemplate.id,
              fastPathHit: true,
              fastPathType: result.type,
              processingTimeMs: Date.now() - startTime,
            };
          }
        }

        // For important messages, just send notification
        await this.messageRepo.update(message.id, {
          classification: result.classification,
          confidence: 1.0,
          actionTaken: 'notification_sent',
          fastPathHit: true,
          fastPathType: result.type,
          processingTimeMs: Date.now() - startTime,
        });

        return {
          messageId: message.id,
          classification: result.classification,
          confidence: 1.0,
          action: 'notification_sent',
          fastPathHit: true,
          fastPathType: result.type,
          processingTimeMs: Date.now() - startTime,
        };
      }

      // If template matched (routine)
      if (result.template) {
        // Send the template reply
        await this.webhookService.sendMessage(
          phoneNumberId,
          contact.phoneNumber,
          result.template.replyText,
          accessToken,
        );

        // Update message
        await this.messageRepo.update(message.id, {
          classification: 'routine',
          confidence: 1.0,
          actionTaken: 'auto_replied',
          templateId: result.template.id,
          fastPathHit: true,
          fastPathType: result.type,
          processingTimeMs: Date.now() - startTime,
        });

        return {
          messageId: message.id,
          classification: 'routine',
          confidence: 1.0,
          action: 'auto_replied',
          replyText: result.template.replyText,
          templateId: result.template.id,
          fastPathHit: true,
          fastPathType: result.type,
          processingTimeMs: Date.now() - startTime,
        };
      }

      // Should not reach here, but handle gracefully
      await this.messageRepo.update(message.id, {
        classification: 'ambiguous',
        confidence: 0.5,
        actionTaken: 'queued',
        fastPathHit: true,
        fastPathType: result.type,
        processingTimeMs: Date.now() - startTime,
      });

      return {
        messageId: message.id,
        classification: 'ambiguous',
        confidence: 0.5,
        action: 'queued',
        fastPathHit: true,
        fastPathType: result.type,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error({
        message: 'Failed to handle fast-path result',
        error: error.message,
        stack: error.stack,
        messageId: message.id,
      });
      throw error;
    }
  }

  /**
   * Classifies a message using Mistral
   */
  private async classifyWithMistral(
    text: string,
    thread: Thread,
    userId: string,
  ): Promise<{
    classification: 'urgent' | 'important' | 'routine' | 'spam' | 'ambiguous';
    classificationConfidence: number;
    reply: string;
    replyConfidence: number;
    reasoning: string;
    tokensUsed: number;
  }> {
    // Get context (last N messages from thread)
    const context = await this.getThreadContext(thread.id, userId);
    
    // Get persona if configured
    const persona = await this.getUserPersona(userId);

    // Use combined classification + reply generation
    const result = await this.mistralService.classifyAndReply(
      text,
      context,
      persona,
      userId,
    );

    return result;
  }

  /**
   * Handles the Mistral classification result
   */
  private async handleMistralResult(
    result: {
      classification: 'urgent' | 'important' | 'routine' | 'spam' | 'ambiguous';
      classificationConfidence: number;
      reply: string;
      replyConfidence: number;
      reasoning: string;
      tokensUsed: number;
    },
    message: Message,
    thread: Thread,
    contact: Contact,
    phoneNumberId: string,
    accessToken: string,
    startTime: number,
  ): Promise<TriageResult> {
    try {
      const { classification, classificationConfidence, reply, replyConfidence, reasoning, tokensUsed } = result;

      // Update message with classification
      await this.messageRepo.update(message.id, {
        classification,
        confidence: classificationConfidence,
        fastPathHit: false,
        processingTimeMs: Date.now() - startTime,
      });

      // Handle based on classification
      switch (classification) {
        case 'urgent':
          // Send notification
          await this.notificationsService.sendUrgentNotification(
            thread.userId,
            thread.id,
            message.id,
            classification,
            message.rawText || '',
            contact,
          );

          // Send acknowledgement template (NOT the AI-generated reply)
          const ackTemplate = await this.getUrgentAcknowledgementTemplate(thread.userId);
          if (ackTemplate) {
            await this.webhookService.sendMessage(
              phoneNumberId,
              contact.phoneNumber,
              ackTemplate.replyText,
              accessToken,
            );

            await this.messageRepo.update(message.id, {
              actionTaken: 'auto_replied',
              templateId: ackTemplate.id,
              mistralPrompt: `Classification: ${classification}, Confidence: ${classificationConfidence}`,
              mistralResponse: reply,
              mistralTokensUsed: tokensUsed,
            });

            return {
              messageId: message.id,
              classification,
              confidence: classificationConfidence,
              action: 'auto_replied',
              replyText: ackTemplate.replyText,
              templateId: ackTemplate.id,
              fastPathHit: false,
              processingTimeMs: Date.now() - startTime,
              mistralPrompt: `Classification: ${classification}`,
              mistralResponse: reply,
              mistralTokensUsed: tokensUsed,
            };
          } else {
            // No acknowledgement template, just send notification
            await this.messageRepo.update(message.id, {
              actionTaken: 'notification_sent',
              mistralPrompt: `Classification: ${classification}`,
              mistralResponse: reply,
              mistralTokensUsed: tokensUsed,
            });

            return {
              messageId: message.id,
              classification,
              confidence: classificationConfidence,
              action: 'notification_sent',
              fastPathHit: false,
              processingTimeMs: Date.now() - startTime,
              mistralPrompt: `Classification: ${classification}`,
              mistralResponse: reply,
              mistralTokensUsed: tokensUsed,
            };
          }

        case 'important':
          // Send notification
          await this.notificationsService.sendUrgentNotification(
            thread.userId,
            thread.id,
            message.id,
            classification,
            message.rawText || '',
            contact,
          );

          await this.messageRepo.update(message.id, {
            actionTaken: 'notification_sent',
            mistralPrompt: `Classification: ${classification}`,
            mistralResponse: reply,
            mistralTokensUsed: tokensUsed,
          });

          return {
            messageId: message.id,
            classification,
            confidence: classificationConfidence,
            action: 'notification_sent',
            fastPathHit: false,
            processingTimeMs: Date.now() - startTime,
            mistralPrompt: `Classification: ${classification}`,
            mistralResponse: reply,
            mistralTokensUsed: tokensUsed,
          };

        case 'routine':
          // Send AI-generated reply
          await this.webhookService.sendMessage(
            phoneNumberId,
            contact.phoneNumber,
            reply,
            accessToken,
          );

          await this.messageRepo.update(message.id, {
            actionTaken: 'auto_replied',
            mistralPrompt: `Classification: ${classification}`,
            mistralResponse: reply,
            mistralTokensUsed: tokensUsed,
          });

          return {
            messageId: message.id,
            classification,
            confidence: classificationConfidence,
            action: 'auto_replied',
            replyText: reply,
            fastPathHit: false,
            processingTimeMs: Date.now() - startTime,
            mistralPrompt: `Classification: ${classification}`,
            mistralResponse: reply,
            mistralTokensUsed: tokensUsed,
          };

        case 'spam':
          // Ignore spam messages
          await this.messageRepo.update(message.id, {
            actionTaken: 'ignored',
            mistralPrompt: `Classification: ${classification}`,
            mistralResponse: reply,
            mistralTokensUsed: tokensUsed,
          });

          return {
            messageId: message.id,
            classification,
            confidence: classificationConfidence,
            action: 'ignored',
            fastPathHit: false,
            processingTimeMs: Date.now() - startTime,
            mistralPrompt: `Classification: ${classification}`,
            mistralResponse: reply,
            mistralTokensUsed: tokensUsed,
          };

        case 'ambiguous':
        default:
          // Queue for human review
          await this.messageRepo.update(message.id, {
            actionTaken: 'queued',
            mistralPrompt: `Classification: ${classification}`,
            mistralResponse: reply,
            mistralTokensUsed: tokensUsed,
          });

          return {
            messageId: message.id,
            classification,
            confidence: classificationConfidence,
            action: 'queued',
            fastPathHit: false,
            processingTimeMs: Date.now() - startTime,
            mistralPrompt: `Classification: ${classification}`,
            mistralResponse: reply,
            mistralTokensUsed: tokensUsed,
          };
      }
    } catch (error) {
      this.logger.error({
        message: 'Failed to handle Mistral result',
        error: error.message,
        stack: error.stack,
        messageId: message.id,
      });
      throw error;
    }
  }

  /**
   * Gets the thread context (previous messages)
   */
  private async getThreadContext(threadId: string, userId: string): Promise<string[]> {
    try {
      const messages = await this.messageRepo.find({
        where: { threadId, userId },
        order: { createdAt: 'DESC' },
        take: 8, // Last 8 messages
      });

      // Filter out the current message (if it's in the list) and get text
      return messages
        .filter((m) => m.rawText)
        .map((m) => m.rawText!)
        .reverse(); // Oldest first
    } catch (error) {
      this.logger.warn({
        message: 'Failed to get thread context',
        error: error.message,
        threadId,
      });
      return [];
    }
  }

  /**
   * Gets the user's configured persona
   */
  private async getUserPersona(userId: string): Promise<string | undefined> {
    // In a real implementation, this would come from user settings
    // For now, return a default persona
    return 'You are a helpful, professional business assistant. Be concise and polite.';
  }

  /**
   * Gets the urgent acknowledgement template for a user
   */
  private async getUrgentAcknowledgementTemplate(userId: string): Promise<Template | null> {
    return this.templateRepo.findOne({
      where: { userId, isUrgentAcknowledgement: true, active: true },
      order: { priority: 'DESC' },
    });
  }

  /**
   * Gets the embedding threshold for a user
   */
  private getEmbeddingThreshold(userId: string): number {
    // In a real implementation, this would be configurable per user
    // For now, use the default
    return this.DEFAULT_EMBEDDING_THRESHOLD;
  }

  /**
   * Schedules a follow-up check for a thread
   */
  async scheduleFollowUp(threadId: string, userId: string): Promise<void> {
    try {
      const thread = await this.threadRepo.findOne({ where: { id: threadId, userId } });
      if (!thread) {
        throw new Error(`Thread not found: ${threadId}`);
      }

      // Calculate SLA deadline (default 2 hours from now)
      const slaHours = this.DEFAULT_SLA_HOURS;
      const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

      // Update thread
      await this.threadRepo.update(threadId, {
        slaDeadline,
        followUpSent: false,
      });

      // Schedule follow-up job
      // This would be handled by the TriageProcessor
    } catch (error) {
      this.logger.error({
        message: 'Failed to schedule follow-up',
        error: error.message,
        threadId,
        userId,
      });
    }
  }

  /**
   * Checks if a thread needs follow-up and sends holding message if SLA breached
   */
  async checkFollowUp(threadId: string): Promise<boolean> {
    try {
      const thread = await this.threadRepo.findOne({
        where: { id: threadId },
        relations: ['contact'],
      });

      if (!thread) {
        return false;
      }

      // Check if SLA deadline has passed and no human reply
      if (thread.slaDeadline && thread.slaDeadline < new Date() && !thread.lastHumanReplyAt) {
        // Check if follow-up already sent
        if (thread.followUpSent) {
          return false;
        }

        // Get the connection for this user
        const connection = await this.webhookService.getConnection(thread.userId);
        if (!connection) {
          return false;
        }

        // Get access token
        const accessToken = await this.webhookService.getAccessToken(connection);

        // Send holding message
        const holdingMessage = 'We are still reviewing your request. We will get back to you as soon as possible.';
        
        await this.webhookService.sendMessage(
          connection.phoneNumberId,
          thread.contact.phoneNumber,
          holdingMessage,
          accessToken,
        );

        // Update thread
        await this.threadRepo.update(threadId, {
          followUpSent: true,
          followUpCount: thread.followUpCount + 1,
        });

        // Create notification
        await this.notificationRepo.save({
          userId: thread.userId,
          threadId: thread.id,
          notificationType: 'follow_up',
          title: 'SLA Breach - Follow-up Sent',
          body: `Follow-up message sent for thread with ${thread.contact.displayName || thread.contact.phoneNumber}`,
          channel: 'push',
          sentAt: new Date(),
          delivered: false,
        });

        return true;
      }

      return false;
    } catch (error) {
      this.logger.error({
        message: 'Failed to check follow-up',
        error: error.message,
        threadId,
      });
      return false;
    }
  }

  /**
   * Gets fast-path hit rate statistics for a user
   */
  async getFastPathStats(userId: string, days: number = 7): Promise<{
    totalMessages: number;
    fastPathHits: number;
    hitRate: number;
    byType: Record<string, number>;
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const messages = await this.messageRepo.find({
      where: {
        userId,
        createdAt: MoreThan(startDate),
      },
    });

    const total = messages.length;
    const fastPathHits = messages.filter((m) => m.fastPathHit).length;
    const hitRate = total > 0 ? (fastPathHits / total) * 100 : 0;

    const byType: Record<string, number> = {};
    messages.forEach((m) => {
      if (m.fastPathHit && m.fastPathType) {
        byType[m.fastPathType] = (byType[m.fastPathType] || 0) + 1;
      }
    });

    return {
      totalMessages: total,
      fastPathHits,
      hitRate,
      byType,
    };
  }
}
