# Authentication — Setup & Maintenance

## Overview

WhatsApp Copilot uses **Neon PostgreSQL** (serverless Postgres) + **NestJS Auth Module** with **bcrypt** password hashing and **JWT** (JSON Web Token) based authentication.

| Layer | Technology |
|---|---|
| Database | Neon (PostgreSQL) — `users` table |
| Password Hashing | bcrypt (10 salt rounds) |
| Token | JWT — `jsonwebtoken` via NestJS `@nestjs/jwt` |
| Transport | Bearer token in `Authorization` header |
| Storage | Client-side `localStorage` (`accessToken`) |

---

## Environment Variables

The backend requires these in `.env`:

```env
# Neon Database
DB_HOST=ep-rough-breeze-aztyxau1.c-3.ap-southeast-1.aws.neon.tech
DB_PORT=5432
DB_USERNAME=neondb_owner
DB_PASSWORD=***
DB_DATABASE=neondb
DB_SSL=true
DB_SYNC=true

# JWT
JWT_SECRET=your-secret-here
JWT_EXPIRES_IN=24h

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

The frontend needs:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**Critical**: The `NEXT_PUBLIC_API_URL` MUST include `/api`. Without it, auth requests go to `localhost:3001/auth/login` instead of `localhost:3001/api/auth/login`.

---

## Database Schema

The `users` table (Neon, managed by TypeORM `synchronize: true`):

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Auto-generated |
| `email` | varchar | Unique, indexed |
| `password_hash` | varchar | bcrypt hash, never plain text |
| `orgName` | varchar | Organization name |
| `subscriptionTier` | varchar | `free` by default |
| `isActive` | boolean | `true` by default |
| `isVerified` | boolean | `false` by default |
| `lastLogin` | timestamp | Updated on each login |
| `createdAt` | timestamp | Auto |
| `updatedAt` | timestamp | Auto |

---

## API Endpoints

| Method | Path | Auth? | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account. Body: `{email, password, orgName}` |
| POST | `/api/auth/login` | No | Login. Body: `{email, password}` |
| GET | `/api/auth/profile` | Yes | Get user profile |
| PUT | `/api/auth/profile` | Yes | Update profile |
| POST | `/api/auth/change-password` | Yes | Change password |
| POST | `/api/auth/forgot-password` | No | Initiate reset |
| POST | `/api/auth/reset-password` | No | Reset with token |
| POST | `/api/auth/refresh` | Yes | Refresh JWT |

### Register Response (201)
```json
{
  "user": { "id": "uuid", "email": "...", "orgName": "...", "password_hash": "$2b$10$..." },
  "accessToken": "eyJhbG..."
}
```

### Login Response (200)
```json
{
  "user": { "id": "uuid", ... },
  "accessToken": "eyJhbG..."
}
```

### Error Responses

| Status | Message | When |
|---|---|---|
| 401 | `Invalid credentials` | Wrong email or password |
| 409 | `User with this email already exists` | Duplicate signup |
| 401 | `Account is deactivated` | `isActive: false` |
| 400 | Validation errors | Missing fields |

---

## Security Properties

- **Passwords**: bcrypt hashed with 10 salt rounds. Plain text never stored or logged.
- **JWT expiry**: 24 hours (`JWT_EXPIRES_IN=24h`)
- **Refresh token**: 7 days (separate endpoint `/api/auth/refresh`)
- **Duplicate prevention**: Unique constraint on `email` + application-level check
- **Non-revealing errors**: Login failure always returns `"Invalid credentials"` — never reveals whether the email exists
- **Active check**: Deactivated users (`isActive: false`) cannot log in

### Future Hardening (Not Yet Implemented)
- HttpOnly cookies instead of localStorage
- SameSite=Strict, Secure flags
- Rate limiting on login attempts
- Email verification flow
- OAuth 2.0 / social login

---

## How to Test

### From command line
```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"***","orgName":"Test"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"***"}'

# Profile (replace TOKEN)
curl http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer TOKEN"
```

### From browser
1. Open `http://localhost:3000/register`
2. Fill in organization name, email, password
3. Submit — redirects to onboarding wizard

---

## Key Source Files

| File | Purpose |
|---|---|
| `backend/src/auth/auth.controller.ts` | Route handlers (register, login, etc.) |
| `backend/src/auth/auth.service.ts` | Business logic (bcrypt, JWT, validation) |
| `backend/src/auth/auth.module.ts` | NestJS module wiring |
| `backend/src/auth/jwt-auth.guard.ts` | JWT guard for protected routes |
| `backend/src/auth/jwt.strategy.ts` | JWT extraction strategy |
| `backend/src/common/database/entities/user.entity.ts` | User entity schema |
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL` — **must include /api** |
| `frontend/src/lib/api.ts` | Axios client with auth interceptor |
| `frontend/src/app/login/page.tsx` | Login page |
| `frontend/src/app/register/page.tsx` | Register page |

---

## Troubleshooting

### "Cannot POST /auth/register" or "Cannot POST /auth/login"
The `NEXT_PUBLIC_API_URL` in `frontend/.env.local` is missing `/api`.  
Fix: `NEXT_PUBLIC_API_URL=http://localhost:3001/api`

### "Invalid credentials" on correct login
1. Check backend is running on port 3001: `curl http://localhost:3001/api/health`
2. Verify Neon database is accessible (check backend logs for connection errors)
3. User might have been created with a different password — re-register or reset

### Neon connection issues
Check `DB_HOST`, `DB_PASSWORD` in `backend/.env` are correct.  
The connection string uses `ssl=true` with `rejectUnauthorized: false`.
