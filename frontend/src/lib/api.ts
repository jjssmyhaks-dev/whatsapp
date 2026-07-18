import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Create API client
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token (skip auth endpoints)
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Never attach token to auth endpoints — they don't need it and a stale
    // token can confuse some auth middleware
    const isAuthRoute = config.url?.startsWith('/auth/');
    if (!isAuthRoute) {
      const token = localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const isAuthRoute = error.config?.url?.startsWith('/auth/');
      // Only redirect on non-auth routes (login/register return 401 on bad creds — don't redirect)
      if (!isAuthRoute) {
        localStorage.removeItem('accessToken');
        // Don't redirect if already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

// Auth endpoints
export const authApi = {
  register: (data: { email: string; password: string; orgName: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  
  profile: () => api.get('/auth/profile'),
  
  updateProfile: (data: { orgName?: string; email?: string }) =>
    api.put('/auth/profile', data),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
  
  forgotPassword: (data: { email: string }) =>
    api.post('/auth/forgot-password', data),
  
  resetPassword: (data: { token: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),
  
  refreshToken: (data: { refreshToken: string }) =>
    api.post('/auth/refresh', data),
};

// Templates endpoints
export const templatesApi = {
  list: (params?: { active?: boolean; limit?: number; offset?: number }) =>
    api.get('/templates', { params }),
  
  get: (id: string) => api.get(`/templates/${id}`),
  
  create: (data: {
    name: string;
    triggerIntent: string;
    replyText: string;
    active?: boolean;
    isUrgentAcknowledgement?: boolean;
    responseType?: 'text' | 'template' | 'interactive';
    metadata?: Record<string, any>;
    priority?: number;
  }) => api.post('/templates', data),
  
  update: (id: string, data: {
    name?: string;
    triggerIntent?: string;
    replyText?: string;
    active?: boolean;
    isUrgentAcknowledgement?: boolean;
    responseType?: 'text' | 'template' | 'interactive';
    metadata?: Record<string, any>;
    priority?: number;
  }) => api.put(`/templates/${id}`, data),
  
  delete: (id: string) => api.delete(`/templates/${id}`),
  
  toggle: (id: string) => api.post(`/templates/${id}/toggle`),
  
  search: (query: string, limit?: number) =>
    api.get('/templates/search', { params: { q: query, limit } }),
  
  mostUsed: (limit?: number) =>
    api.get('/templates/most-used', { params: { limit } }),
  
  regenerateEmbeddings: () => api.post('/templates/regenerate-embeddings'),
};

// Notifications endpoints
export const notificationsApi = {
  list: (params?: { limit?: number; offset?: number; read?: boolean }) =>
    api.get('/notifications', { params }),
  
  markAsRead: (id: string) => api.post(`/notifications/${id}/read`),
  
  markAllAsRead: () => api.post('/notifications/mark-all-read'),
  
  unreadCount: () => api.get('/notifications/unread-count'),
  
  test: () => api.post('/notifications/test'),
};

// Threads endpoints
export const threadsApi = {
  list: (params?: { status?: string; limit?: number; offset?: number }) =>
    api.get('/threads', { params }),
  
  get: (id: string) => api.get(`/threads/${id}`),
  
  update: (id: string, data: {
    status?: 'open' | 'closed' | 'archived' | 'waiting_human';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    assigneeId?: string | null;
  }) => api.put(`/threads/${id}`, data),
  
  stats: () => api.get('/threads/stats'),
};

// Messages endpoints
export const messagesApi = {
  list: (threadId: string, params?: { limit?: number; offset?: number }) =>
    api.get(`/threads/${threadId}/messages`, { params }),
  
  send: (threadId: string, data: { text: string }) =>
    api.post(`/threads/${threadId}/messages`, data),
};

// Contacts endpoints
export const contactsApi = {
  list: (params?: { limit?: number; offset?: number; vip?: boolean }) =>
    api.get('/contacts', { params }),
  
  get: (id: string) => api.get(`/contacts/${id}`),
  
  update: (id: string, data: {
    displayName?: string;
    isVip?: boolean;
    tags?: string[];
  }) => api.put(`/contacts/${id}`, data),
};

// Urgency Rules endpoints
export const urgencyRulesApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    api.get('/urgency-rules', { params }),
  
  get: (id: string) => api.get(`/urgency-rules/${id}`),
  
  create: (data: {
    keywordOrPhrase: string;
    urgencyLevel: 'urgent' | 'important' | 'routine';
    matchType?: 'contains' | 'exact' | 'regex' | 'starts_with' | 'ends_with';
    isCaseSensitive?: boolean;
    isActive?: boolean;
    priority?: number;
  }) => api.post('/urgency-rules', data),
  
  update: (id: string, data: {
    keywordOrPhrase?: string;
    urgencyLevel?: 'urgent' | 'important' | 'routine';
    matchType?: 'contains' | 'exact' | 'regex' | 'starts_with' | 'ends_with';
    isCaseSensitive?: boolean;
    isActive?: boolean;
    priority?: number;
  }) => api.put(`/urgency-rules/${id}`, data),
  
  delete: (id: string) => api.delete(`/urgency-rules/${id}`),
  
  toggle: (id: string) => api.post(`/urgency-rules/${id}/toggle`),
};

// Stats endpoints
export const statsApi = {
  fastPath: (days?: number) => api.get('/stats/fast-path', { params: { days } }),
  dashboard: () => api.get('/stats/dashboard'),
};

// WhatsApp Connection endpoints
export const whatsappApi = {
  list: () => api.get('/whatsapp-connections'),
  
  get: (id: string) => api.get(`/whatsapp-connections/${id}`),
  
  create: (data: {
    phoneNumberId: string;
    businessPhoneNumber: string;
    accessToken: string;
    webhookVerifyToken?: string;
  }) => api.post('/whatsapp-connections', data),
  
  update: (id: string, data: {
    webhookUrl?: string;
    status?: 'pending' | 'active' | 'inactive' | 'error';
  }) => api.put(`/whatsapp-connections/${id}`, data),
  
  delete: (id: string) => api.delete(`/whatsapp-connections/${id}`),
  
  test: (id: string, data: { to: string; text: string }) =>
    api.post(`/whatsapp-connections/${id}/test`, data),
};

// Billing endpoints (Phase 3)
export const billingApi = {
  subscription: () => api.get('/billing/subscription'),
  
  plans: () => api.get('/billing/plans'),
  
  createSubscription: (data: { plan: string; paymentMethod: string }) =>
    api.post('/billing/subscription', data),
  
  cancelSubscription: () => api.post('/billing/subscription/cancel'),
  
  usage: () => api.get('/billing/usage'),
};

export default api;
