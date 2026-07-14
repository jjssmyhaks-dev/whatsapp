import { Controller, Post, Body, Headers, Get, Query, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { WebhookService } from './webhook.service';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiQuery } from '@nestjs/swagger';

@ApiTags('webhook')
@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  /**
   * Webhook verification endpoint for Meta
   * GET /webhook
   * 
   * Meta calls this endpoint to verify the webhook URL.
   * It sends a challenge token that must be echoed back.
   */
  @Get()
  @ApiOperation({
    summary: 'Verify webhook URL',
    description: 'Meta calls this endpoint to verify the webhook URL. Returns the challenge token.',
  })
  @ApiQuery({ name: 'hub.mode', required: true, description: 'The mode (subscribe/unsubscribe)' })
  @ApiQuery({ name: 'hub.challenge', required: true, description: 'The challenge token to echo back' })
  @ApiQuery({ name: 'hub.verify_token', required: true, description: 'The verify token configured in Meta' })
  @ApiResponse({ status: 200, description: 'Challenge token echoed back' })
  @ApiResponse({ status: 400, description: 'Verification failed' })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.verify_token') verifyToken: string,
    @Res() res: Response,
  ): void {
    try {
      const result = this.webhookService.verifyWebhook(mode, challenge, verifyToken);
      res.status(HttpStatus.OK).send(result);
    } catch (error) {
      res.status(HttpStatus.BAD_REQUEST).send('Verification failed');
    }
  }

  /**
   * Webhook endpoint for receiving WhatsApp messages
   * POST /webhook
   * 
   * Meta sends inbound messages to this endpoint.
   * All requests must be signed with HMAC-SHA256.
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive WhatsApp messages',
    description: 'Meta sends inbound WhatsApp messages to this endpoint. Requires signature validation.',
  })
  @ApiHeader({
    name: 'X-Hub-Signature-256',
    required: true,
    description: 'HMAC-SHA256 signature of the request body',
  })
  @ApiResponse({ status: 200, description: 'Message received and queued for processing' })
  @ApiResponse({ status: 400, description: 'Invalid signature or malformed request' })
  async receiveWebhook(
    @Body() body: any,
    @Headers('X-Hub-Signature-256') signature: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Validate signature
      const rawBody = JSON.stringify(body);
      const isValid = this.webhookService.validateSignature(rawBody, signature);
      
      if (!isValid) {
        res.status(HttpStatus.BAD_REQUEST).send('Invalid signature');
        return;
      }

      // Process the webhook payload
      const result = await this.webhookService.processWebhook(body);
      
      if (result.success) {
        res.status(HttpStatus.OK).send({ status: 'ok' });
      } else {
        res.status(HttpStatus.BAD_REQUEST).send({ status: 'error', message: 'Processing failed' });
      }
    } catch (error) {
      res.status(HttpStatus.BAD_REQUEST).send({ status: 'error', message: error.message });
    }
  }

  /**
   * Health check endpoint
   * GET /webhook/health
   */
  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns the health status of the webhook service.',
  })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Test endpoint for sending a test message
   * POST /webhook/test
   * 
   * This is for testing purposes only.
   */
  @Post('test')
  @ApiOperation({
    summary: 'Send test message',
    description: 'Sends a test message via WhatsApp (for testing only).',
  })
  @ApiResponse({ status: 200, description: 'Test message sent' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async sendTestMessage(
    @Body() body: { phoneNumberId: string; to: string; text: string; accessToken: string },
  ): Promise<{ success: boolean; message?: any }> {
    try {
      const result = await this.webhookService.sendMessage(
        body.phoneNumberId,
        body.to,
        body.text,
        body.accessToken,
      );
      return { success: true, message: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
