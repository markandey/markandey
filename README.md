# Markandey Apps

Multi-app platform built with React + Vite + Supabase.

## Setup

1. Copy env file: `cp apps/web/.env.example apps/web/.env.local`
2. Add your Supabase credentials to `.env.local`
3. Run the migration in `supabase/migrations/001_camping.sql` in your Supabase SQL editor
4. `pnpm install && pnpm dev`

## Structure

- `apps/web` — Main shell (routing, layout, auth)
- `apps/camping` — Group camping collaboration app
- `packages/ui` — Shared components
- `packages/db` — Supabase client
- `packages/auth` — Auth context & hooks
