# Hostinger Node.js Backend Deployment

Use this guide to migrate only the backend API from Render to Hostinger Node.js.

## Hostinger Build Settings

Keep the GitHub import pointed at the repository root:

```txt
Repository: abusazid46-tech/The_Wings_Group
Branch: main
Framework preset: Other
Root directory: ./
Node version: 22.x
Package manager: pnpm
```

Use these build/output fields:

```txt
Build command:
corepack prepare pnpm@9.12.3 --activate && pnpm run hostinger:build

Output directory:
apps/api/dist

Entry file:
server.js
```

If Hostinger expects the entry file from the repository root instead of the output directory, use:

```txt
Entry file:
apps/api/dist/server.js
```

## Environment Variables

Add these in Hostinger before deploying:

```env
NODE_ENV=production
DATABASE_URL=your_supabase_postgres_url
JWT_SECRET=your_long_random_secret_at_least_24_characters
CORS_ORIGIN=https://www.thewingsgroup.online,https://thewingsgroup.online,https://the-wings-group1.vercel.app,https://the-wings-group-admin.vercel.app
LOG_LEVEL=info
GOOGLE_CLIENT_ID=your_google_client_id
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_GRAPH_VERSION=v20.0
WHATSAPP_ADMIN_PHONE=9774887803
```

Do not set `PORT` unless Hostinger asks for it. The API reads `process.env.PORT`, and most Node hosts inject the correct port automatically.

## After Deploy

Test the API health endpoint:

```txt
https://your-hostinger-app-domain/health
```

Then update Vercel environment variables for both frontend and admin:

```env
NEXT_PUBLIC_API_URL=https://your-hostinger-app-domain
```

Redeploy both Vercel projects after changing `NEXT_PUBLIC_API_URL`.

## Custom API Domain

After the Hostinger app works, point:

```txt
api.thewingsgroup.online
```

to the Hostinger Node.js app using the DNS target Hostinger gives you. Then change Vercel to:

```env
NEXT_PUBLIC_API_URL=https://api.thewingsgroup.online
```

## Useful Local Verification

Run this locally before pushing deployment changes:

```bash
pnpm run hostinger:build
```
