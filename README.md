# WhatsApp Triage & Auto-Reply Agent

> **An AI layer between WhatsApp and business owners that triages every inbound message, alerts instantly on urgent matters, and auto-replies to routine messages — so nothing important gets missed and nothing routine wastes human time.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10+-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7+-red.svg)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-20+-blue.svg)](https://www.docker.com/)

---

## 🚀 Features

### ✅ Core Capabilities
- **WhatsApp Cloud API Integration** - Official Meta WhatsApp Business Platform integration
- **Smart Triage Pipeline** - Multi-layer classification (VIP → Keywords → Embeddings → AI)
- **Cost-Control Fast-Path** - Minimizes LLM calls with intelligent routing
- **Push Notifications** - Instant alerts via OneSignal for urgent messages
- **Auto-Replies** - Automatic responses to routine inquiries
- **Multi-Tenant Security** - PostgreSQL Row-Level Security (RLS) on all tables
- **Encryption at Rest** - AES-256-GCM encryption for all access tokens

### ✅ Message Classification
- **Urgent** - Immediate notification (server down, emergency, critical issues)
- **Important** - Notification required (contracts, approvals, meetings)
- **Routine** - Auto-reply (business hours, contact info, services)
- **Spam** - Ignored (scams, phishing, promotional)
- **Ambiguous** - Mistral AI fallback for unclear messages

### ✅ Fast-Path Layers (0% LLM Cost)
1. **VIP Override** - VIP contacts bypass all checks, get immediate notification
2. **Urgency Keywords** - Regex/keyword matching for urgent/important detection
3. **Template Embeddings** - Cosine similarity matching against saved templates
4. **Mistral AI** - Only used for ambiguous messages (<5% of total)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        WhatsApp Cloud API                          │
└─────────────────────────────┬───────────────────────────────────┘
                              │ (Webhook POST with HMAC-SHA256)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (NestJS)                              │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  Webhook Module                                            │  │  │
│  │  - Signature Validation (HMAC-SHA256)                       │  │  │
│  │  - Message Queuing (BullMQ)                                 │  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  Triage Module                                             │  │  │
│  │  - Fast-Path Checks (VIP, Keywords, Embeddings)              │  │  │
│  │  - Mistral AI Fallback                                     │  │  │
│  │  - Notification Dispatch                                   │  │  │
│  │  - Auto-Reply Generation                                   │  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  Common Modules                                            │  │  │
│  │  - Encryption (AES-256-GCM)                                │  │  │
│  │  - Mistral API Client                                     │  │  │
│  │  - Embeddings (all-MiniLM-L6-v2)                           │  │  │
│  │  - Database (TypeORM + PostgreSQL RLS)                     │  │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
    ┌─────────────────────────┴─────────────────────────┐
    │                   BullMQ Queue                     │
    │  (Redis) message-processing, follow-up-scheduler   │
    └─────────────────────────┬─────────────────────────┘
                              │
┌─────────────────────────────┼─────────────────────────┐
│  PostgreSQL                  │         Redis             │
│  - Users, Contacts, Threads  │  - Queue Storage          │
│  - Messages, Templates       │  - Session Cache          │
│  - Urgency Rules, Notifications│                         │
│  - Subscriptions             │                         │
└─────────────────────────────┴─────────────────────────┘
```

---

## 📦 Project Structure

```
whatsapp-triage-agent/
├── backend/                          # NestJS Backend
│   ├── src/
│   │   ├── webhook/                  # WhatsApp webhook receiver
│   │   │   ├── webhook.controller.ts # Webhook endpoints
│   │   │   ├── webhook.service.ts    # Signature validation, message queuing
│   │   │   └── webhook.module.ts     # Module configuration
│   │   │
│   │   ├── triage/                   # Message triage system
│   │   │   ├── triage.service.ts     # Fast-path + Mistral classification
│   │   │   ├── triage.processor.ts    # BullMQ worker
│   │   │   └── triage.module.ts      # Module configuration
│   │   │
│   │   ├── templates/                # Auto-reply templates
│   │   │   ├── templates.controller.ts
│   │   │   ├── templates.service.ts
│   │   │   └── templates.module.ts
│   │   │
│   │   ├── notifications/            # Push notifications
│   │   │   ├── notifications.service.ts
│   │   │   └── notifications.module.ts
│   │   │
│   │   ├── auth/                     # Authentication
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── threads/                  # Conversation threads (Phase 2)
│   │   ├── billing/                  # Billing integration (Phase 3)
│   │   │
│   │   └── common/
│   │       ├── database/            # TypeORM entities & migrations
│   │       │   ├── entities/        # All database entities
│   │       │   └── migrations/      # RLS migration
│   │       ├── encryption/          # AES-256-GCM encryption
│   │       ├── mistral/             # Mistral API client
│   │       └── embeddings/          # Local embedding model
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── ormconfig.js
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/                         # Next.js Frontend
│   ├── src/
│   │   ├── app/                     # Next.js App Router
│   │   │   ├── page.tsx            # Dashboard
│   │   │   ├── login/page.tsx      # Login page
│   │   │   ├── register/page.tsx   # Registration page
│   │   │   ├── inbox/page.tsx      # Thread inbox
│   │   │   ├── templates/page.tsx # Template management
│   │   │   ├── urgency-rules/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   └── settings/page.tsx  # User settings
│   │   │
│   │   ├── components/             # React components
│   │   │   ├── ui/                 # UI component library
│   │   │   └── theme-provider.tsx
│   │   │
│   │   ├── lib/                    # Utilities
│   │   │   ├── api.ts             # API client
│   │   │   └── utils.ts
│   │   │
│   │   └── types/                  # TypeScript types
│   │       └── index.ts
│   │
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── next.config.js
│   └── Dockerfile
│
├── test/                           # Test files
│   ├── test-payloads.json          # 25 test messages
│   └── send-test-payloads.js       # Automated test script
│
├── docker-compose.yml              # Docker Compose configuration
├── DECISIONS.md                    # Architectural decisions
├── DEPLOYMENT.md                   # Deployment guide
├── PHASE1_COMPLETE.md              # Phase 1 summary
└── README.md                       # This file
```

---

## 🚀 Quick Start

### Prerequisites

- [Node.js 18+](https://nodejs.org/) (LTS recommended)
- [npm 9+](https://www.npmjs.com/) or [yarn 1.22+](https://yarnpkg.com/)
- [Docker 20+](https://www.docker.com/)
- [Git](https://git-scm.com/)
- [PostgreSQL 15+](https://www.postgresql.org/) (or use Docker)
- [Redis 7+](https://redis.io/) (or use Docker)

### Required Accounts

- [Meta WhatsApp Business Platform](https://developers.facebook.com/docs/whatsapp/cloud-api/) - For WhatsApp Cloud API
- [Mistral AI](https://mistral.ai/) - For AI classification (free tier available)
- [OneSignal](https://onesignal.com/) - For push notifications (optional for Phase 1)

---

## 📥 Installation

### 1. Clone the Repository

```bash
# Clone to your local machine
git clone https://github.com/jjssmyhaks-dev/whatsapp.git
cd whatsapp

# Or clone to a specific directory
mkdir C:\whatsapp-triage && cd C:\whatsapp-triage
git clone https://github.com/jjssmyhaks-dev/whatsapp.git .
```

### 2. Configure Environment Variables

#### Backend Configuration

```bash
# Copy example environment file
cp backend/.env.example backend/.env

# Edit backend/.env with your settings
# Required variables:
# - DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
# - REDIS_HOST, REDIS_PORT
# - WHATSAPP_APP_SECRET, WHATSAPP_WEBHOOK_VERIFY_TOKEN
# - ENCRYPTION_KEY (64-character hex)
# - JWT_SECRET
# - MISTRAL_API_KEY
# - ONESIGNAL_APP_ID, ONESIGNAL_API_KEY (optional)
```

#### Frontend Configuration

```bash
# Copy example environment file
cp frontend/.env.example frontend/.env.local

# Edit frontend/.env.local
# Required variables:
# - NEXT_PUBLIC_API_URL=http://localhost:3001
# - NEXT_PUBLIC_ONESIGNAL_APP_ID (optional)
```

### 3. Start Infrastructure Services

#### Using Docker (Recommended)

```bash
# Start PostgreSQL and Redis
docker run -d --name whatsapp-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=whatsapp_triage \
  -p 5432:5432 \
  postgres:15-alpine

docker run -d --name whatsapp-redis \
  -p 6379:6379 \
  redis:7-alpine

# Wait for services to start (10-15 seconds)
sleep 10
```

#### Using Docker Compose

```bash
# Start all services
docker compose up -d postgres redis

# View logs
docker compose logs -f postgres redis
```

### 4. Install Dependencies

```bash
# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

### 5. Run Database Migrations

```bash
cd backend
npx typeorm migration:run -d ormconfig.js
cd ..
```

### 6. Start Development Servers

**In separate terminals:**

```bash
# Terminal 1: Backend
cd backend
npm run start:dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

## 🧪 Testing

### Run Test Payloads

```bash
# Navigate to test directory
cd test

# Install axios (if not already installed)
npm install axios

# Run the test script
node send-test-payloads.js
```

This will send 25 test messages across 5 categories:
- 5 urgent messages (should trigger notifications)
- 5 important messages (should trigger notifications)
- 5 routine messages (should auto-reply)
- 5 spam messages (should be ignored)
- 5 ambiguous messages (should use Mistral fallback)

### Expected Output

```
================================================================================
WhatsApp Triage & Auto-Reply Agent - Phase 1 Test Suite
================================================================================
Total payloads: 25
Webhook URL: http://localhost:3001/api/webhook

[ 1] ✓ urgent     | Urgent: Server is down! Need immediate help!           | 120ms
       Expected: urgent -> notification_sent

[ 2] ✓ urgent     | Emergency: Payment gateway failed, customers can't... | 85ms
       Expected: urgent -> notification_sent
...
================================================================================
Test Results Summary
================================================================================
Total: 25
Success: 25 (100.0%)
Failed: 0 (0.0%)

By Category:
  urgent    : 5/5 (100.0%)
  important : 5/5 (100.0%)
  routine   : 5/5 (100.0%)
  spam      : 5/5 (100.0%)
  ambiguous : 5/5 (100.0%)
================================================================================
```

---

## 🌐 Access the Application

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Next.js Frontend Dashboard |
| http://localhost:3001/api/docs | Swagger API Documentation |
| http://localhost:3001/api/webhook/health | Health Check Endpoint |

---

## 📚 Documentation

- **[DECISIONS.md](DECISIONS.md)** - Architectural decisions and rationale
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Comprehensive deployment guide (dev + production)
- **[PHASE1_COMPLETE.md](PHASE1_COMPLETE.md)** - Phase 1 implementation summary

---

## 🔐 Security Features

### Encryption
- All WhatsApp access tokens encrypted at rest using **AES-256-GCM**
- Tenant-specific key derivation using **HKDF**
- Never log encrypted or decrypted tokens

### Row-Level Security (RLS)
- All multi-tenant tables have RLS policies enabled
- Users can only access their own data
- Policies enforced at the database level

### Authentication
- JWT tokens with 24-hour expiry
- Secure password hashing with **bcrypt**
- CSRF protection for web forms

### Input Validation
- All inputs validated using **class-validator**
- Sanitization of all user inputs
- Parameterized queries to prevent SQL injection

---

## 💰 Cost Control

The fast-path layer ensures minimal LLM costs:

| Path | LLM Usage | Action |
|------|-----------|--------|
| VIP Override | 0% | Immediate notification |
| Urgency Keywords | 0% | Immediate notification |
| Template Embeddings | 0% | Auto-reply |
| Mistral AI | 100% | Classification + Reply |

**Expected LLM usage: <5% of total messages** (with good template coverage)

---

## 📊 Technology Stack

### Backend
- **Framework**: [NestJS 10+](https://nestjs.com/)
- **Database**: [PostgreSQL 15+](https://www.postgresql.org/) with [TypeORM](https://typeorm.io/)
- **Queue**: [BullMQ](https://docs.bullmq.io/) on [Redis 7+](https://redis.io/)
- **AI**: [Mistral AI](https://mistral.ai/) API
- **Embeddings**: [@xenova/transformers](https://www.npmjs.com/package/@xenova/transformers) (all-MiniLM-L6-v2)
- **Encryption**: Node.js `crypto` module (AES-256-GCM)
- **Validation**: [class-validator](https://github.com/typestack/class-validator)

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **UI**: [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/)
- **State Management**: [TanStack Query](https://tanstack.com/query/latest) + React Context
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Styling**: CSS Variables + Tailwind

### Infrastructure
- **Containerization**: [Docker](https://www.docker.com/)
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx (for production)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Next.js](https://nextjs.org/) - React framework
- [Mistral AI](https://mistral.ai/) - Large language models
- [Meta WhatsApp Business Platform](https://developers.facebook.com/docs/whatsapp/cloud-api/) - WhatsApp Cloud API
- [OneSignal](https://onesignal.com/) - Push notifications
- [BullMQ](https://docs.bullmq.io/) - Redis-based queue
- [TypeORM](https://typeorm.io/) - ORM for TypeScript

---

## 📞 Support

For issues and questions:
1. Check the [DECISIONS.md](DECISIONS.md) file for architectural context
2. Review the [DEPLOYMENT.md](DEPLOYMENT.md) file for deployment guidance
3. Check the logs for error details
4. Consult the [Meta WhatsApp Business Platform documentation](https://developers.facebook.com/docs/whatsapp/cloud-api/)
5. Check the [Mistral AI API documentation](https://docs.mistral.ai/)

---

**Built with ❤️ for efficient WhatsApp message triage**

*Never miss an important message. Never waste time on routine ones.*
