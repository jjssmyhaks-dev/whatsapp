# Architectural Decisions

## Core Technology Stack

### 1. LLM Provider: Mistral API Only
**Decision**: Use Mistral API exclusively for all LLM calls.
**Rationale**: Non-negotiable constraint. Mistral provides cost-effective, high-quality models suitable for classification and reply generation tasks.
**Implementation**: All LLM calls route through a dedicated Mistral service module with strict usage tracking.

### 2. WhatsApp Integration: Meta WhatsApp Business Platform (Cloud API)
**Decision**: Use official Meta WhatsApp Cloud API.
**Rationale**: Non-negotiable constraint. Official integration ensures reliability, compliance with Meta policies, and access to full WhatsApp Business features.
**Implementation**: Webhook receiver validates all inbound payloads using Meta's signature validation mechanism.

### 3. Backend: Node.js + NestJS
**Decision**: Use NestJS as the backend framework.
**Rationale**: NestJS provides:
- Strong TypeScript support
- Modular architecture (aligns with "modular monolith" requirement)
- Built-in dependency injection
- Extensive ecosystem for APIs, queues, and databases
- Production-ready structure

### 4. Frontend: Next.js
**Decision**: Use Next.js for the dashboard.
**Rationale**: Next.js provides:
- React-based UI development
- Server-side rendering for better SEO and initial load
- API routes for backend-for-frontend patterns
- Easy deployment (Vercel, Netlify, or standalone)
- Strong TypeScript support

### 5. Database: PostgreSQL with Row-Level Security
**Decision**: PostgreSQL with RLS enforced on all multi-tenant tables.
**Rationale**: Non-negotiable constraint. RLS provides:
- Data isolation at the database level
- Prevention of cross-tenant data leaks
- Fine-grained access control
- Auditability

**Implementation**: Every multi-tenant table has RLS policies that enforce `user_id` filtering.

### 6. Queue: BullMQ on Redis
**Decision**: Use BullMQ with Redis for async work queues.
**Rationale**: BullMQ provides:
- Robust job queue system
- Delayed jobs (for follow-up scheduler)
- Retry mechanisms
- Rate limiting
- Priority queues
- Redis persistence

### 7. Push Notifications: OneSignal
**Decision**: Use OneSignal as the unified push notification layer.
**Rationale**: OneSignal provides:
- Unified API for FCM (Android) and APNs (iOS)
- Web push notifications
- Email notifications as fallback
- Free tier suitable for startup phase
- Easy integration with Next.js frontend
- Built-in analytics

**Alternatives Considered**: 
- Direct FCM/APNs integration: More complex, requires separate implementations
- Firebase Cloud Messaging only: No iOS support without additional setup
- AWS SNS: Overkill for current scale, higher cost

## Architecture Decisions

### 8. Modular Monolith Structure
**Decision**: Build as a modular monolith, not microservices.
**Rationale**: 
- Premature optimization to split into microservices
- Single deployable unit simplifies DevOps
- Modular structure allows future extraction if needed
- Shared database reduces complexity

**Module Structure**:
```
backend/
  src/
    webhook/          # WhatsApp webhook receiver
    triage/           # Message triage worker
    templates/        # Template management
    notifications/    # Push notification service
    threads/          # Thread management
    billing/          # Razorpay integration
    auth/             # Authentication
    common/           # Shared utilities
```

### 9. Fast-Path Cost Control Layer
**Decision**: Implement three-tier triage:
1. Regex/keyword matching (urgency detection)
2. Local embedding similarity (template matching)
3. Mistral API (classification + reply generation)

**Rationale**: Cost control is critical. This hierarchy ensures:
- Minimal LLM calls (target: <40% of messages reach Mistral)
- Fast response times for common cases
- Template matching without LLM cost
- Urgency detection without LLM cost

**Thresholds**:
- Embedding similarity: 0.85 cosine (tunable per tenant)
- Fast-path hit rate target: >60%

### 10. Local Embedding Model
**Decision**: Use `all-MiniLM-L6-v2` from Sentence Transformers (384-dimensional).
**Rationale**:
- Lightweight (can run locally or on cheap endpoint)
- Good performance for intent matching
- Open source, no licensing costs
- Compatible with cosine similarity

**Implementation**: Use `@xenova/transformers` or a hosted inference endpoint.

### 11. AI Behavior Guardrails
**Decision**: Hard-coded enforcement, not prompt-based.
**Rationale**: Prompts can be bypassed; code branches cannot.

**Implementation**:
```typescript
if (classification === 'urgent') {
  // Only use pre-approved acknowledgement templates
  // Never send AI-generated substantive content
  return useTemplateOnly('urgent_acknowledgement');
}
```

### 12. Encryption at Rest
**Decision**: Use AES-256-GCM for encrypting WhatsApp access tokens.
**Rationale**: 
- Access tokens are sensitive credentials
- Database-level encryption may not be sufficient
- Application-level encryption provides defense in depth

**Implementation**: Use Node.js `crypto` module with tenant-specific encryption keys.

### 13. Audit Logging
**Decision**: Log all AI-generated replies with full context for 30 days.
**Rationale**: 
- Compliance requirement
- Debugging and improvement
- Misclassification analysis

**Retention**: 30 days (configurable, default to meet legal requirements)

## Phase-Specific Decisions

### Phase 1 Decisions

#### 14. Webhook Signature Validation
**Decision**: Validate all inbound webhook requests using Meta's signature validation.
**Rationale**: Security requirement - reject unsigned/invalid requests.
**Implementation**: Use HMAC-SHA256 with the webhook secret.

#### 15. CLI for Log Inspection
**Decision**: Build a simple CLI tool for Phase 1 log inspection.
**Rationale**: Dashboard not available in Phase 1; need a way to verify functionality.
**Implementation**: NestJS CLI command or simple Node.js script.

### Phase 2 Decisions

#### 16. Context Window for Mistral
**Decision**: Use last 5-10 messages from thread as context.
**Rationale**: 
- Provides sufficient context for coherent replies
- Keeps prompt size manageable (cost control)
- Configurable per tenant

**Default**: 8 messages (configurable 5-10)

#### 17. Tone/Persona Configuration
**Decision**: User-configurable tone/persona settings.
**Rationale**: Different businesses need different voices.
**Implementation**: Store persona templates in database, inject into Mistral prompts.

### Phase 3 Decisions

#### 18. Billing Model: Tiered by Message Volume
**Decision**: Implement tiered pricing by message volume as default.
**Rationale**: 
- Simple to understand and implement
- Aligns with usage patterns
- Can be extended to usage-based with config change

**Structure**:
- Free tier: 100 messages/month
- Starter: 1000 messages/month
- Growth: 10000 messages/month
- Enterprise: Custom

#### 19. Razorpay Integration
**Decision**: Use Razorpay for Indian market.
**Rationale**: 
- India-first product
- Razorpay is market leader in India
- Supports subscriptions and one-time payments
- Good developer experience

#### 20. RLS Penetration Testing
**Decision**: Write automated test suite that attempts cross-tenant access.
**Rationale**: Non-negotiable security requirement.
**Implementation**: 
- Test every table with RLS
- Attempt to read Tenant A data with Tenant B credentials
- Verify all queries are properly scoped

### Phase 4 Decisions

#### 21. Load Testing Target
**Decision**: Design for 500+ inbound messages/day per user at launch.
**Rationale**: Realistic peak volume assumption.
**Implementation**: 
- Use Artillery or k6 for load testing
- Test queue processing under load
- Test database performance
- Test API response times

#### 22. Multi-Language Support Priority
**Decision**: Hindi and major Indian regional languages first.
**Rationale**: India-first market focus.
**Languages**: Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati
**Implementation**: 
- Mistral supports these languages
- Template translation system
- Language detection for incoming messages

## Security Decisions

### 23. WhatsApp Business Policy Compliance
**Decision**: Implement automated-message disclosure checks.
**Rationale**: Meta requires disclosure of automated messages.
**Implementation**: 
- Default: Bot discloses it's an AI assistant
- Configurable option to not disclose (with policy warning)
- Audit trail of disclosure settings

### 24. DPDP Act 2023 Compliance
**Decision**: Implement explicit consent flow for chat history calibration.
**Rationale**: Legal requirement for Indian market.
**Implementation**:
- Consent screen before accessing chat history
- Audit log of consent grants
- Right to withdraw consent
- Data deletion on consent withdrawal

### 25. Rate Limiting
**Decision**: Implement rate limiting on all public endpoints.
**Rationale**: Prevent abuse and ensure fair usage.
**Implementation**: 
- Webhook endpoint: Rate limit by IP
- API endpoints: Rate limit by user
- Queue processing: Rate limit by tenant

## Operational Decisions

### 26. Logging Strategy
**Decision**: Structured logging with log levels.
**Rationale**: Production debugging and monitoring.
**Implementation**: 
- Use `pino` or `winston` for structured logs
- Log levels: error, warn, info, debug
- Include request IDs for correlation
- Log to stdout (for container logging)

### 27. Monitoring
**Decision**: Basic health checks and metrics.
**Rationale**: Production readiness.
**Implementation**:
- Health check endpoints
- Queue length monitoring
- Processing time metrics
- Error rate tracking

### 28. Configuration Management
**Decision**: Environment variables with validation.
**Rationale**: Security and flexibility.
**Implementation**: 
- Use `dotenv` for development
- Environment variable validation on startup
- Required variables fail fast
- Sensitive variables never logged

## Deployment Decisions

### 29. Containerization
**Decision**: Docker containers for all components.
**Rationale**: 
- Consistent development and production environments
- Easy deployment
- Scalability

### 30. Environment Separation
**Decision**: Separate environments for development, staging, production.
**Rationale**: Safety and testing.
**Implementation**: 
- Different database instances
- Different API keys
- Environment-specific configuration

## Future Considerations

### 31. Microservices Migration Path
**Decision**: Design modules for future extraction.
**Rationale**: While current architecture is monolithic, design with extraction in mind.
**Implementation**:
- Clear module boundaries
- Minimal cross-module dependencies
- Well-defined interfaces
- Separate database schemas per module where possible

### 32. Multi-Region Support
**Decision**: Not implemented in initial phases.
**Rationale**: Premature for current scale.
**Future**: Consider when serving multiple geographic regions.

### 33. Advanced Analytics
**Decision**: Not in initial scope.
**Rationale**: Focus on core functionality first.
**Future**: Add dashboards for fast-path hit rates, classification accuracy, etc.
