// User types
export interface User {
  id: string;
  email: string;
  orgName: string;
  subscriptionTier: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// WhatsApp Connection types
export interface WhatsAppConnection {
  id: string;
  userId: string;
  wabaId: string | null;
  phoneNumberId: string;
  businessPhoneNumber: string;
  accessTokenEncrypted: string;
  webhookVerifyToken: string | null;
  status: 'pending' | 'active' | 'inactive' | 'error';
  webhookUrl: string | null;
  metaApiVersion: string;
  createdAt: string;
  updatedAt: string;
}

// Contact types
export interface Contact {
  id: string;
  userId: string;
  phoneNumber: string;
  displayName: string | null;
  whatsappName: string | null;
  isVip: boolean;
  tags: string[];
  profileImageUrl: string | null;
  lastMessageAt: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

// Thread types
export interface Thread {
  id: string;
  userId: string;
  contactId: string;
  threadKey: string | null;
  lastMessageId: string | null;
  lastHumanReplyAt: string | null;
  slaDeadline: string | null;
  followUpSent: boolean;
  followUpCount: number;
  status: 'open' | 'closed' | 'archived' | 'waiting_human';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigneeId: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  contact?: Contact;
}

// Message types
export interface Message {
  id: string;
  threadId: string;
  userId: string;
  direction: 'inbound' | 'outbound';
  rawText: string | null;
  payload: Record<string, any> | null;
  classification: 'urgent' | 'important' | 'routine' | 'spam' | 'ambiguous' | null;
  confidence: number | null;
  actionTaken: 'auto_replied' | 'notification_sent' | 'queued' | 'ignored' | 'human_replied' | null;
  templateId: string | null;
  mistralPrompt: string | null;
  mistralResponse: string | null;
  mistralModel: string | null;
  mistralTokensUsed: number | null;
  fastPathHit: boolean;
  fastPathType: 'keyword' | 'embedding' | 'regex' | null;
  processingTimeMs: number | null;
  whatsappMessageId: string | null;
  whatsappStatus: string | null;
  errorMessage: string | null;
  createdAt: string;
}

// Template types
export interface Template {
  id: string;
  userId: string;
  name: string;
  triggerIntent: string;
  triggerEmbedding: string | null;
  replyText: string;
  active: boolean;
  isUrgentAcknowledgement: boolean;
  responseType: 'text' | 'template' | 'interactive';
  metadata: Record<string, any>;
  usageCount: number;
  lastUsedAt: string | null;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

// Urgency Rule types
export interface UrgencyRule {
  id: string;
  userId: string;
  keywordOrPhrase: string;
  urgencyLevel: 'urgent' | 'important' | 'routine';
  matchType: 'contains' | 'exact' | 'regex' | 'starts_with' | 'ends_with';
  isCaseSensitive: boolean;
  isActive: boolean;
  priority: number;
  usageCount: number;
  lastTriggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  threadId: string | null;
  messageId: string | null;
  notificationType: 'urgent' | 'important' | 'follow_up' | 'system';
  title: string | null;
  body: string | null;
  payload: Record<string, any> | null;
  channel: 'push' | 'email' | 'sms';
  recipientToken: string | null;
  sentAt: string | null;
  delivered: boolean;
  deliveredAt: string | null;
  read: boolean;
  readAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

// Subscription types
export interface Subscription {
  id: string;
  userId: string;
  plan: string;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'unpaid';
  razorpayCustomerId: string | null;
  razorpaySubscriptionId: string | null;
  razorpayPlanId: string | null;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  usageCurrentPeriod: number;
  usageLimit: number;
  messageCount: number;
  lastBilledAt: string | null;
  nextBillingAt: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  success?: boolean;
}

// Auth types
export interface LoginResponse {
  user: User;
  accessToken: string;
}

// Stats types
export interface FastPathStats {
  totalMessages: number;
  fastPathHits: number;
  hitRate: number;
  byType: Record<string, number>;
}

// Thread with messages
export interface ThreadWithMessages extends Thread {
  messages: Message[];
}

// Dashboard stats
export interface DashboardStats {
  totalThreads: number;
  totalMessages: number;
  urgentCount: number;
  importantCount: number;
  routineCount: number;
  unreadNotifications: number;
  fastPathHitRate: number;
}
