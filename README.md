# The Wings Group Platform

Full-stack monorepo for The Wings Group cleaning and facility-services platform.

## Apps

- `apps/web` - Next.js customer website built with native React components.
- `apps/admin` - Next.js admin CRM/dashboard shell for bookings, services, customers, leads, and payments.
- `apps/api` - Express + Prisma backend foundation.
- `apps/mobile` - Expo React Native mobile app foundation.

## Shared Packages

- `packages/types` - shared TypeScript domain types.
- `packages/validation` - shared Zod validation schemas.
- `packages/api-client` - shared typed API client.
- `packages/ui` - shared design tokens.

## Milestone 1 Status

Completed foundation:

- Monorepo structure with pnpm workspaces and Turborepo.
- Customer website converted to native Next.js/React components while preserving the approved UI direction.
- Admin dashboard UI shell.
- Expo mobile app shell.
- Backend API app with health, services, and bookings routes.
- PostgreSQL Prisma schema for users, services, bookings, payments, staff, CRM notes, leads, and WhatsApp message logs.
- Shared types, validation, API client, and design tokens.

## Local Setup

Install dependencies:

```bash
pnpm install
```

Copy environment variables:

```bash
cp .env.example .env
```

Generate Prisma client:

```bash
pnpm db:generate
```

Run database migration:

```bash
pnpm db:migrate
```

Run all apps:

```bash
pnpm dev
```

Useful app URLs:

- Customer website: `http://localhost:3000`
- Admin panel: `http://localhost:3001`
- API health: `http://localhost:4000/health`

## Next Milestone

Milestone 2 should turn the foundations into working product flows:

- Firebase OTP and Google login.
- Dynamic services loaded from backend.
- Admin service CRUD.
- Booking creation from website to API.
- Razorpay order creation and webhook verification.
- WhatsApp Cloud API booking confirmation.
