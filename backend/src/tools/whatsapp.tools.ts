/**
 * Shared WhatsApp tools available to all specialist agents.
 * These are the tool layer that every agent (triage, sales, outreach, internal-ops)
 * calls through Mastra's tool interface.
 */

export const whatsappTools = {
  /**
   * Send a free-form WhatsApp message (within 24h window)
   */
  sendWhatsAppMessage: {
    description: 'Send a text message to a WhatsApp contact',
    parameters: {
      type: 'object',
      properties: {
        phoneNumber: { type: 'string', description: 'Recipient phone number in E.164 format' },
        text: { type: 'string', description: 'Message text to send' },
        phoneNumberId: { type: 'string', description: 'WhatsApp Business Phone Number ID' },
        accessToken: { type: 'string', description: 'WhatsApp access token' },
      },
      required: ['phoneNumber', 'text', 'phoneNumberId', 'accessToken'],
    },
  },

  /**
   * Send an approved WhatsApp template message
   */
  sendTemplate: {
    description: 'Send a pre-approved WhatsApp template message',
    parameters: {
      type: 'object',
      properties: {
        phoneNumber: { type: 'string' },
        templateName: { type: 'string' },
        parameters: { type: 'array', items: { type: 'string' } },
        phoneNumberId: { type: 'string' },
        accessToken: { type: 'string' },
      },
      required: ['phoneNumber', 'templateName', 'phoneNumberId', 'accessToken'],
    },
  },

  /**
   * Look up contact details
   */
  lookupContact: {
    description: 'Retrieve contact details by phone number',
    parameters: {
      type: 'object',
      properties: {
        phoneNumber: { type: 'string' },
        userId: { type: 'string' },
      },
      required: ['phoneNumber', 'userId'],
    },
  },

  /**
   * Update lead stage in the pipeline
   */
  updateLeadStage: {
    description: 'Update the stage of a lead in the sales pipeline',
    parameters: {
      type: 'object',
      properties: {
        leadId: { type: 'string' },
        stage: { type: 'string', enum: ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] },
        nextAction: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['leadId', 'stage'],
    },
  },

  /**
   * Log agent action for audit
   */
  logAgentRun: {
    description: 'Record an agent action for audit and quality review',
    parameters: {
      type: 'object',
      properties: {
        agentName: { type: 'string' },
        action: { type: 'string' },
        input: { type: 'string' },
        output: { type: 'string' },
        outcome: { type: 'string' },
        conversationId: { type: 'string' },
        threadId: { type: 'string' },
        tokensUsed: { type: 'number' },
      },
      required: ['agentName', 'action'],
    },
  },

  /**
   * Search knowledge base via embedding similarity
   */
  searchKnowledgeBase: {
    description: 'Search the business knowledge base for relevant context',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        category: { type: 'string' },
        userId: { type: 'string' },
        limit: { type: 'number', default: 5 },
      },
      required: ['query', 'userId'],
    },
  },

  /**
   * Check if contact is an authorised team member
   */
  isTeamMember: {
    description: 'Check if a WhatsApp number belongs to a team member',
    parameters: {
      type: 'object',
      properties: {
        phoneNumber: { type: 'string' },
        userId: { type: 'string' },
      },
      required: ['phoneNumber', 'userId'],
    },
  },
};
