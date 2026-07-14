# WhatsApp Triage & Auto-Reply Agent - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the WhatsApp Triage & Auto-Reply Agent in development and production environments.

## Prerequisites

### Required Tools
- Node.js 18+ (LTS recommended)
- npm 9+ or yarn 1.22+
- Docker 20+
- Docker Compose 2.0+
- PostgreSQL 15+
- Redis 7+

### Required Accounts
- [Meta WhatsApp Business Platform](https://developers.facebook.com/docs/whatsapp/cloud-api/) - For WhatsApp Cloud API access
- [Mistral AI](https://mistral.ai/) - For AI classification and reply generation
- [OneSignal](https://onesignal.com/) - For push notifications (optional for Phase 1)
- [Razorpay](https://razorpay.com/) - For billing (Phase 3)

---

## Quick Start (Development)

### 1. Clone the Repository

```bash
cd /workspace/jjssmyhaks-dev__whatsapp
git clone https://github.com/jjssmyhaks-dev/whatsapp.git
cd whatsapp
```

### 2. Configure Environment Variables

#### Backend Configuration

Copy the example environment file and update with your settings:

```bash
# Backend
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your configuration:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=whatsapp_triage

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# WhatsApp
WHATSAPP_APP_SECRET=your_whatsapp_app_secret
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token
WHATSAPP_API_VERSION=v18.0

# Encryption (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=your_64_character_hex_key

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# Mistral AI
MISTRAL_API_KEY=your_mistral_api_key

# OneSignal (optional for Phase 1)
ONESIGNAL_APP_ID=your_app_id
ONESIGNAL_API_KEY=your_api_key

# Application
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

#### Frontend Configuration

```bash
# Frontend
cp frontend/.env.example frontend/.env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ONESIGNAL_APP_ID=your_onesignal_app_id
```

### 3. Start Infrastructure Services

#### Using Docker Compose (Recommended)

```bash
# Start PostgreSQL and Redis
docker compose up -d postgres redis

# Wait for services to be ready
docker compose logs -f postgres redis
```

#### Manual Setup

**PostgreSQL:**
```bash
# Install PostgreSQL 15+
sudo apt-get install postgresql-15

# Create database and user
sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -c "CREATE DATABASE whatsapp_triage OWNER postgres;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE whatsapp_triage TO postgres;"
```

**Redis:**
```bash
# Install Redis 7+
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
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

### 7. Verify Services

- Backend: http://localhost:3001/api/docs (Swagger UI)
- Frontend: http://localhost:3000
- Health check: http://localhost:3001/api/webhook/health

---

## Production Deployment

### 1. Build Docker Images

```bash
# Build backend
docker build -t whatsapp-triage-backend:latest -f backend/Dockerfile ./backend

# Build frontend
docker build -t whatsapp-triage-frontend:latest -f frontend/Dockerfile ./frontend
```

### 2. Configure Production Environment

Create production environment files:

**backend/.env.production:**
```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=whatsapp_user
DB_PASSWORD=secure_password_here
DB_DATABASE=whatsapp_triage_prod
DB_SSL=true

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_password_here

# WhatsApp
WHATSAPP_APP_SECRET=your_production_app_secret
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_production_verify_token
WHATSAPP_API_VERSION=v18.0

# Encryption
ENCRYPTION_KEY=your_64_character_hex_key

# JWT
JWT_SECRET=your_production_jwt_secret
JWT_EXPIRES_IN=24h

# Mistral AI
MISTRAL_API_KEY=your_production_mistral_key

# OneSignal
ONESIGNAL_APP_ID=your_production_app_id
ONESIGNAL_API_KEY=your_production_api_key

# Application
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

# Logging
LOG_LEVEL=info
```

**frontend/.env.production:**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_ONESIGNAL_APP_ID=your_production_app_id
NODE_ENV=production
```

### 3. Deploy with Docker Compose

Create a production docker-compose file:

**docker-compose.prod.yml:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: whatsapp-triage-postgres
    environment:
      POSTGRES_USER: whatsapp_user
      POSTGRES_PASSWORD: secure_password_here
      POSTGRES_DB: whatsapp_triage_prod
    ports:
      - "5432:5432"
    volumes:
      - postgres_data_prod:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - whatsapp-network

  redis:
    image: redis:7-alpine
    container_name: whatsapp-triage-redis
    command: redis-server --requirepass redis_password_here
    ports:
      - "6379:6379"
    volumes:
      - redis_data_prod:/data
    restart: unless-stopped
    networks:
      - whatsapp-network

  backend:
    image: whatsapp-triage-backend:latest
    container_name: whatsapp-triage-backend
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USERNAME: whatsapp_user
      DB_PASSWORD: secure_password_here
      DB_DATABASE: whatsapp_triage_prod
      DB_SSL: "false"
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: redis_password_here
      PORT: 3001
      FRONTEND_URL: https://yourdomain.com
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - whatsapp-network

  frontend:
    image: whatsapp-triage-frontend:latest
    container_name: whatsapp-triage-frontend
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: https://api.yourdomain.com
    ports:
      - "3000:3000"
    restart: unless-stopped
    networks:
      - whatsapp-network

volumes:
  postgres_data_prod:
  redis_data_prod:

networks:
  whatsapp-network:
    driver: bridge
```

Start production services:

```bash
docker compose -f docker-compose.prod.yml up -d
```

### 4. Run Migrations in Production

```bash
# Run migrations against production database
docker exec -it whatsapp-triage-backend npx typeorm migration:run -d ormconfig.js
```

### 5. Set Up Reverse Proxy (Nginx)

**nginx.conf:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## WhatsApp Cloud API Setup

### 1. Create a Meta Developer Account

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app
3. Add WhatsApp Business Platform to your app

### 2. Create a WhatsApp Business Account

1. In your Meta App Dashboard, navigate to "WhatsApp > API Setup"
2. Create a new WhatsApp Business Account
3. Add a phone number to your WABA

### 3. Configure Webhook

1. In your Meta App Dashboard, go to "WhatsApp > Configuration"
2. Add your webhook URL: `https://yourdomain.com/api/webhook`
3. Subscribe to the following events:
   - `messages`
   - `message_reads`
   - `message_deliveries`
4. Set your verify token (must match `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in your .env)

### 4. Get Access Token

1. In "WhatsApp > API Setup", generate a permanent access token
2. Copy the access token and encrypt it using the encryption service
3. Store the encrypted token in your database via the API or directly in the database

### 5. Verify Webhook

Meta will send a GET request to your webhook URL with the verify token. Your backend should respond with the challenge token.

---

## Testing Phase 1

### 1. Test Webhook Verification

```bash
# Send a test verification request
curl -X GET \
  "http://localhost:3001/api/webhook?hub.mode=subscribe&hub.challenge=test_challenge_123&hub.verify_token=your_verify_token"
```

Expected response: `test_challenge_123`

### 2. Test Message Processing

Send a test webhook payload:

```bash
curl -X POST \
  http://localhost:3001/api/webhook \
  -H 'Content-Type: application/json' \
  -H 'X-Hub-Signature-256: sha256=...' \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "102345678901234",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "1234567890",
            "phone_number_id": "123456789012345"
          },
          "contacts": [{
            "profile": {
              "name": "Test User"
            },
            "wa_id": "919876543210"
          }],
          "messages": [{
            "from": "919876543210",
            "id": "wamid.ABCDEF...",
            "timestamp": "1700000000000",
            "type": "text",
            "text": {
              "body": "Hello, I need urgent help!"
            }
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

### 3. Test Triage Pipeline

The system should:
1. Receive and validate the webhook signature
2. Create or update contact and thread
3. Queue the message for processing
4. Process the message through triage:
   - Check VIP override
   - Check urgency keywords
   - Check template embeddings
   - Fall back to Mistral classification
5. Send notification for urgent messages
6. Auto-reply for routine messages

### 4. Test Cases for 20+ Messages

Create test messages covering:

**Urgent Messages (should trigger notification):**
- "Urgent: Server is down!"
- "Emergency: Need immediate help"
- "CRITICAL: Payment failed"
- "Help me now!"
- "This is an emergency"

**Important Messages (should trigger notification):**
- "Can you review this contract?"
- "Meeting at 3pm tomorrow"
- "Please check the invoice"
- "Important update on project"
- "Need your approval"

**Routine Messages (should auto-reply):**
- "What are your business hours?"
- "How can I contact you?"
- "What services do you offer?"
- "Thank you!"
- "Hello!"

**Spam Messages (should be ignored or flagged):**
- "Win a free iPhone!"
- "Click this link to claim your prize"
- "You have won a lottery"
- "URGENT: Your account will be closed"
- "Make money fast!"

**Ambiguous Messages (should use Mistral fallback):**
- "What do you think about this?"
- "Can we discuss?"
- "I have a question"
- "Let me know"
- "Please advise"

---

## Monitoring and Logging

### Backend Logs

```bash
# Development
npm run start:dev

# Production
docker logs -f whatsapp-triage-backend
```

### Database Queries

```bash
# Connect to PostgreSQL
docker exec -it whatsapp-triage-postgres psql -U postgres -d whatsapp_triage

# Check tables
\dt

# Check RLS policies
SELECT * FROM pg_policies;
```

### Redis Monitoring

```bash
# Connect to Redis
docker exec -it whatsapp-triage-redis redis-cli

# Check BullMQ queues
127.0.0.1:6379> KEYS *
127.0.0.1:6379> LLEN bull:message-processing:wait
```

---

## Troubleshooting

### Common Issues

**1. Database connection failed**
- Verify PostgreSQL is running
- Check connection string in .env
- Ensure database user has permissions

**2. Redis connection failed**
- Verify Redis is running
- Check host and port in .env
- Verify password if configured

**3. Webhook verification failed**
- Ensure `WHATSAPP_WEBHOOK_VERIFY_TOKEN` matches Meta configuration
- Check that the verify token is being passed correctly

**4. Signature validation failed**
- Ensure `WHATSAPP_APP_SECRET` is correct
- Verify the signature is being computed correctly
- Check that the raw body is being used (not parsed JSON)

**5. Mistral API errors**
- Verify `MISTRAL_API_KEY` is valid
- Check API rate limits
- Ensure the model name is correct

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
DB_LOGGING=true
```

---

## Security Considerations

### 1. Encryption
- All access tokens are encrypted at rest using AES-256-GCM
- Tenant-specific key derivation ensures isolation
- Never log encrypted or decrypted tokens

### 2. Row-Level Security (RLS)
- All multi-tenant tables have RLS policies enabled
- Users can only access their own data
- Test RLS policies thoroughly before production

### 3. Authentication
- JWT tokens with 24-hour expiry
- Secure password hashing with bcrypt
- CSRF protection for web forms

### 4. Rate Limiting
- Implement rate limiting for API endpoints
- Use Redis for rate limiting storage
- Protect against brute force attacks

### 5. Input Validation
- All inputs are validated using class-validator
- Sanitize all user inputs
- Prevent SQL injection with parameterized queries

---

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.scale.yml
services:
  backend:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
```

### Queue Workers

```yaml
# Separate worker service
services:
  backend-worker:
    image: whatsapp-triage-backend:latest
    command: npm run start:worker
    environment:
      NODE_ENV: production
      # ... other env vars
    deploy:
      replicas: 5
```

### Database Scaling

- Use PostgreSQL read replicas for reporting
- Implement connection pooling
- Consider using a managed PostgreSQL service

---

## Backup and Recovery

### Database Backup

```bash
# Daily backup
docker exec whatsapp-triage-postgres pg_dump -U postgres whatsapp_triage > backup_$(date +%Y%m%d).sql

# Automated backup
0 2 * * * docker exec whatsapp-triage-postgres pg_dump -U postgres whatsapp_triage > /backups/whatsapp_$(date +%Y%m%d_%H%M).sql
```

### Redis Backup

```bash
# Save Redis data
docker exec whatsapp-triage-redis redis-cli SAVE

# Backup RDB file
docker cp whatsapp-triage-redis:/data/dump.rdb ./backups/redis_dump_$(date +%Y%m%d).rdb
```

---

## API Documentation

Swagger UI is available at:
- Development: http://localhost:3001/api/docs
- Production: https://api.yourdomain.com/api/docs

---

## Support

For issues and questions:
- Check the DECISIONS.md file for architectural decisions
- Review the logs for error details
- Consult the Meta WhatsApp Business Platform documentation
- Check Mistral AI API documentation

---

## License

MIT License
