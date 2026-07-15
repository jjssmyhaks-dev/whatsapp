import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';

// Types for Mistral API responses
interface MistralClassificationResult {
  classification: 'urgent' | 'important' | 'routine' | 'spam' | 'ambiguous';
  confidence: number;
  reasoning: string;
}

interface MistralReplyResult {
  reply: string;
  confidence: number;
  reasoning: string;
}

interface MistralCombinedResult {
  classification: 'urgent' | 'important' | 'routine' | 'spam' | 'ambiguous';
  classificationConfidence: number;
  reply: string;
  replyConfidence: number;
  reasoning: string;
  tokensUsed: number;
}

interface MistralApiResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage: {
    total_tokens: number;
  };
}

@Injectable()
export class MistralService {
  private readonly logger = new Logger(MistralService.name);
  private readonly apiKey: string;
  private readonly defaultModel = 'mistral-tiny';
  private readonly apiUrl = 'https://api.mistral.ai/v1';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('MISTRAL_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn('MISTRAL_API_KEY not configured. Mistral API calls will fail.');
    }
  }

  /**
   * Makes a request to Mistral API
   */
  private async makeApiRequest(prompt: string, model: string = this.defaultModel): Promise<MistralApiResponse> {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 500,
      });

      const options = {
        hostname: 'api.mistral.ai',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'Authorization': `Bearer ${this.apiKey}`,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Classifies a message into urgency categories
   * @param message The message text to classify
   * @param context Optional context (previous messages)
   * @returns Classification result
   */
  async classifyMessage(
    message: string,
    context?: string[],
    userId?: string,
  ): Promise<MistralClassificationResult> {
    const startTime = Date.now();
    
    try {
      const prompt = this.buildClassificationPrompt(message, context);
      
      const response = await this.makeApiRequest(prompt, this.defaultModel);

      const result = this.parseClassificationResponse(response.choices[0].message.content);
      
      this.logger.debug({
        message: 'Mistral classification completed',
        userId,
        messageLength: message.length,
        processingTime: Date.now() - startTime,
        classification: result.classification,
        confidence: result.confidence,
      });

      return result;
    } catch (error) {
      this.logger.error({
        message: 'Mistral classification failed',
        error: error.message,
        stack: error.stack,
        userId,
      });
      
      // Return a safe default on error
      return {
        classification: 'ambiguous',
        confidence: 0.5,
        reasoning: `Classification failed: ${error.message}`,
      };
    }
  }

  /**
   * Generates a reply for a message
   * @param message The message to reply to
   * @param context Previous messages in the thread
   * @param persona Optional persona/tone configuration
   * @returns Generated reply
   */
  async generateReply(
    message: string,
    context: string[] = [],
    persona?: string,
    userId?: string,
  ): Promise<MistralReplyResult> {
    const startTime = Date.now();
    
    try {
      const prompt = this.buildReplyPrompt(message, context, persona);
      
      const response = await this.makeApiRequest(prompt, this.defaultModel);

      const result = this.parseReplyResponse(response.choices[0].message.content);
      
      this.logger.debug({
        message: 'Mistral reply generation completed',
        userId,
        messageLength: message.length,
        contextLength: context.length,
        processingTime: Date.now() - startTime,
        replyLength: result.reply.length,
      });

      return result;
    } catch (error) {
      this.logger.error({
        message: 'Mistral reply generation failed',
        error: error.message,
        stack: error.stack,
        userId,
      });
      
      // Return a safe default on error
      return {
        reply: 'Sorry, I encountered an error generating a response. A human will review this shortly.',
        confidence: 0.5,
        reasoning: `Reply generation failed: ${error.message}`,
      };
    }
  }

  /**
   * Classifies and generates a reply in a single call (more cost-effective)
   * @param message The message to process
   * @param context Previous messages
   * @param persona Optional persona configuration
   * @returns Combined classification and reply
   */
  async classifyAndReply(
    message: string,
    context: string[] = [],
    persona?: string,
    userId?: string,
  ): Promise<MistralCombinedResult> {
    const startTime = Date.now();
    
    try {
      const prompt = this.buildCombinedPrompt(message, context, persona);
      
      const response = await this.makeApiRequest(prompt, this.defaultModel);

      const result = this.parseCombinedResponse(response.choices[0].message.content);
      
      // Estimate tokens used (approximate)
      const inputTokens = Math.ceil((prompt.length + message.length + (context?.join(' ')?.length || 0)) / 4);
      const outputTokens = Math.ceil(response.choices[0].message.content.length / 4);
      
      this.logger.debug({
        message: 'Mistral combined classification+reply completed',
        userId,
        processingTime: Date.now() - startTime,
        classification: result.classification,
        classificationConfidence: result.classificationConfidence,
        replyLength: result.reply.length,
        tokensUsed: inputTokens + outputTokens,
      });

      return {
        ...result,
        tokensUsed: inputTokens + outputTokens,
      };
    } catch (error) {
      this.logger.error({
        message: 'Mistral combined call failed',
        error: error.message,
        stack: error.stack,
        userId,
      });
      
      // Return safe defaults
      return {
        classification: 'ambiguous',
        classificationConfidence: 0.5,
        reply: 'Sorry, I encountered an error. A human will review this shortly.',
        replyConfidence: 0.5,
        reasoning: `Combined call failed: ${error.message}`,
        tokensUsed: 0,
      };
    }
  }

  /**
   * Checks if the Mistral API is available
   * @returns True if API is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Make a minimal API call to check connectivity
      await this.makeApiRequest('Say "ok"', this.defaultModel);
      return true;
    } catch (error) {
      this.logger.warn(`Mistral API health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Gets available models from Mistral
   * @returns List of available models
   */
  async getAvailableModels(): Promise<string[]> {
    // For now, return default model since we're using direct API
    // In a real implementation, you could fetch from /v1/models endpoint
    return [this.defaultModel, 'mistral-small', 'mistral-medium'];
  }

  // ============================================
  // PROMPT BUILDERS
  // ============================================

  private buildClassificationPrompt(message: string, context?: string[]): string {
    const contextText = context?.length
      ? `\n\nPrevious conversation:\n${context.map((c, i) => `[${i + 1}] ${c}`).join('\n')}`
      : '';

    return `You are a message classification assistant. Classify the following message into one of these categories: urgent, important, routine, spam, ambiguous.

Message: "${message}"${contextText}

Respond with a JSON object containing:
- classification: one of "urgent", "important", "routine", "spam", "ambiguous"
- confidence: a number between 0 and 1 representing your confidence
- reasoning: a brief explanation of your classification

Respond ONLY with the JSON object, no other text.`;
  }

  private buildReplyPrompt(message: string, context: string[] = [], persona?: string): string {
    const contextText = context?.length
      ? `\n\nPrevious conversation:\n${context.map((c, i) => `[${i + 1}] ${c}`).join('\n')}`
      : '';

    const personaText = persona
      ? `\n\nYour persona: ${persona}`
      : '';

    return `You are an AI assistant helping a business respond to WhatsApp messages. Generate a helpful, professional reply to the following message.${personaText}

Message: "${message}"${contextText}

Respond with a JSON object containing:
- reply: the reply text (keep it concise, under 500 characters)
- confidence: a number between 0 and 1 representing your confidence
- reasoning: brief explanation of why this reply is appropriate

Respond ONLY with the JSON object, no other text.`;
  }

  private buildCombinedPrompt(message: string, context: string[] = [], persona?: string): string {
    const contextText = context?.length
      ? `\n\nPrevious conversation:\n${context.map((c, i) => `[${i + 1}] ${c}`).join('\n')}`
      : '';

    const personaText = persona
      ? `\n\nYour persona: ${persona}`
      : '';

    return `You are an AI assistant helping a business triage and respond to WhatsApp messages. For the following message, first classify it, then generate an appropriate reply.${personaText}

Message: "${message}"${contextText}

Respond with a JSON object containing:
- classification: one of "urgent", "important", "routine", "spam", "ambiguous"
- classificationConfidence: a number between 0 and 1
- reply: the reply text (keep it concise, under 500 characters)
- replyConfidence: a number between 0 and 1
- reasoning: brief explanation

IMPORTANT: If the message is classified as "urgent", the reply MUST be a simple acknowledgement only (e.g., "Thank you for your message. We will respond shortly."). Do NOT generate substantive content for urgent messages.

Respond ONLY with the JSON object, no other text.`;
  }

  // ============================================
  // RESPONSE PARSERS
  // ============================================

  private parseClassificationResponse(response: string): MistralClassificationResult {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          classification: this.validateClassification(parsed.classification),
          confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
          reasoning: parsed.reasoning || '',
        };
      }
      
      // Fallback: try to parse the whole response as JSON
      const parsed = JSON.parse(response);
      return {
        classification: this.validateClassification(parsed.classification),
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
        reasoning: parsed.reasoning || '',
      };
    } catch (error) {
      this.logger.warn(`Failed to parse classification response: ${response}`);
      
      // Default to ambiguous if parsing fails
      return {
        classification: 'ambiguous',
        confidence: 0.5,
        reasoning: 'Failed to parse response',
      };
    }
  }

  private parseReplyResponse(response: string): MistralReplyResult {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          reply: parsed.reply || '',
          confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
          reasoning: parsed.reasoning || '',
        };
      }
      
      const parsed = JSON.parse(response);
      return {
        reply: parsed.reply || '',
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
        reasoning: parsed.reasoning || '',
      };
    } catch (error) {
      this.logger.warn(`Failed to parse reply response: ${response}`);
      return {
        reply: 'Sorry, I encountered an error generating a response.',
        confidence: 0.5,
        reasoning: 'Failed to parse response',
      };
    }
  }

  private parseCombinedResponse(response: string): Omit<MistralCombinedResult, 'tokensUsed'> {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : response;
      const parsed = JSON.parse(jsonStr);

      // Validate classification
      const classification = this.validateClassification(parsed.classification);
      
      // If urgent, ensure reply is acknowledgement-only
      let reply = parsed.reply || '';
      if (classification === 'urgent' && !this.isAcknowledgementOnly(reply)) {
        reply = 'Thank you for your message. We will respond shortly.';
      }

      return {
        classification,
        classificationConfidence: Math.min(1, Math.max(0, parsed.classificationConfidence || 0.5)),
        reply,
        replyConfidence: Math.min(1, Math.max(0, parsed.replyConfidence || 0.5)),
        reasoning: parsed.reasoning || '',
      };
    } catch (error) {
      this.logger.warn(`Failed to parse combined response: ${response}`);
      return {
        classification: 'ambiguous',
        classificationConfidence: 0.5,
        reply: 'Sorry, I encountered an error.',
        replyConfidence: 0.5,
        reasoning: 'Failed to parse response',
      };
    }
  }

  private validateClassification(classification: string): 'urgent' | 'important' | 'routine' | 'spam' | 'ambiguous' {
    const valid = ['urgent', 'important', 'routine', 'spam', 'ambiguous'];
    if (valid.includes(classification?.toLowerCase())) {
      return classification.toLowerCase() as any;
    }
    return 'ambiguous';
  }

  private isAcknowledgementOnly(reply: string): boolean {
    const lower = reply.toLowerCase();
    const acknowledgementKeywords = [
      'thank you',
      'thanks',
      'we will respond',
      'we will get back',
      'we will reply',
      'acknowledged',
      'received',
      'noted',
    ];
    
    return acknowledgementKeywords.some((kw) => lower.includes(kw));
  }
}
