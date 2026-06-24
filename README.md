# Puzzle Mastermind

Puzzle Mastermind is a web-based puzzle game built with React, TypeScript, TanStack Router/Start, and Supabase. Players can sign in, progress through puzzle levels, and track scores on a leaderboard.

## Features

- Authenticated gameplay flow with sign-in and sign-up
- Multiple puzzle levels with a progressive experience
- Leaderboard and score submission support
- Modern UI built with Tailwind CSS and shadcn-style components

## Tech Stack

- React 19
- TypeScript
- Vite
- TanStack Router and TanStack Start
- Supabase for authentication and data storage
- Tailwind CSS

## Getting Started

1. Install dependencies:
   ```bash
   bun install
   ```

2. Configure Supabase environment variables. The app expects at least:
   ```bash
   VITE_SUPABASE_URL
   VITE_SUPABASE_PUBLISHABLE_KEY
   ```

   Server-side functions also use:
   ```bash
   SUPABASE_URL
   SUPABASE_PUBLISHABLE_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ```

3. Start the development server:
   ```bash
   bun dev
   ```

4. Open the local app in your browser at the Vite URL shown in the terminal.

## Available Scripts

- `bun dev` — start the development server
- `bun run build` — create a production build
- `bun run preview` — preview the production build
- `bun run lint` — run ESLint

## Project Structure

- `src/routes` — page and route definitions
- `src/components` — reusable UI and game components
- `src/lib` — game logic and score helpers
- `src/integrations/supabase` — Supabase client and auth middleware
- `supabase/migrations` — database migration files
