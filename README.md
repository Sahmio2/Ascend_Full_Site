# ASCEND — Coaching Platform & Client Workspace

A high-performance coaching platform and client workspace for **ASCEND by Sahmi El**. Built with React 19, TypeScript 5.7, Tailwind CSS 4, and reactive typed state stores, configured as a Single Page Application (SPA) ready for Vercel deployment.

---

## Tech Stack & Architecture

- **Frontend Runtime**: [React 19](https://react.dev/) (`react` 19.0.0, `react-dom` 19.0.0)
- **Language**: [TypeScript 5.7](https://www.typescriptlang.org/) with strict type safety
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) (`@tailwindcss/postcss` 4.0.0) + self-hosted variable typography (Cinzel, Cormorant Garamond, DM Sans)
- **Routing**: [React Router 7](https://reactrouter.com/) client-side SPA routing
- **Deployment**: [Vercel SPA](https://vercel.com/) via `vercel.json` rewrite configuration
- **State Management**: Reactive typed stores (`authStore.ts`, `dataStore.ts`, `clientPortalAdapter.ts`) with LocalStorage persistence and clean repository abstractions (`DraftRepository`, `ApplicationRepository`)
- **Database Schema**: [Prisma ORM](https://www.prisma.io/) with **MySQL** datasource (`prisma/schema.prisma`) modeling core athletes, check-ins, workouts, and programs

---

## Route Overview

| Path | Description | Access Guard |
|---|---|---|
| `/` | Editorial landing page & brand narrative | Public |
| `/apply` | 4-step comprehensive coaching intake assessment | Public (Auto-saving draft) |
| `/login` | Unified client & demo entrance | Public |
| `/coach` | Hidden coach command access | Coach passcode / credentials |
| `/coach-portal/*` | Coach command centre, athlete management & programme reviews | Coach only (`ProtectedRoute`) |
| `/demo/*` | Sandboxed client workspace demo with preloaded athlete data | Demo session |
| `/client/*` | Live client workspace: plans, nutrition, workouts, check-ins | Authenticated client |

---

## Getting Started

### Prerequisites
- Node.js `>= 20.0.0`
- npm `>= 10.0.0`

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
Starts the Vite development server at `http://localhost:3000`.

### Typecheck & Production Build
```bash
# Typecheck TypeScript source
npm run typecheck

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## Database & Prisma (MySQL)

A complete Prisma schema is provided in `prisma/schema.prisma` configured for MySQL:

- **`Person`**: Athlete and lead records, intake assessments, phase status, coach notes
- **`CheckIn`**: Weekly recovery, bodyweight, compliance tracking, and coach feedback
- **`ProgramAssignment`**: Periodized blocks, training instructions, and workout schedules
- **`WorkoutSession`**: Logged workouts, sets, reps, loads, and athlete notes
- **`Activity`**: Audit trail of athlete and coach interactions
- **`PlanDocument`**: Training and nutrition documents

To generate the Prisma client or run migrations against your MySQL database:
```bash
# Set your DATABASE_URL in .env
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"

# Generate client
npx prisma generate

# Push schema to MySQL
npx prisma db push
```

---

## Project Structure

```text
├── public/                 # Static assets and self-hosted WOFF2 fonts
│   └── fonts/
├── prisma/
│   └── schema.prisma       # MySQL schema for core domain entities
├── src/
│   ├── components/         # Shared global components (AscendIcon, SpecularButton, ProtectedRoute)
│   ├── features/
│   │   └── ascend/         # Core ASCEND feature tree
│   │       ├── coach/      # Coach command dashboard, review workflows, adapters
│   │       ├── portal/     # Client workspace (today, plan, nutrition, workout logger, progress)
│   │       └── public-apply/ # Landing page and 4-step intake assessment
│   ├── pages/              # Top-level page wrappers and auth routing
│   │   ├── auth/           # Client and Coach login
│   │   ├── coach/          # Coach portal entry
│   │   └── public/         # Home and Apply entry
│   ├── repositories/       # Abstraction layer for drafts and applications
│   ├── services/           # Typed reactive state stores (authStore, dataStore)
│   ├── storage/            # Schema migration and storage key constants
│   ├── styles/             # Global CSS and typography stylesheets
│   ├── App.tsx             # Root router configuration
│   ├── globals.css         # Tailwind 4 and brand root tokens
│   └── main.tsx            # Application entry point
├── package.json
├── tsconfig.json
├── vercel.json             # Vercel SPA rewrites
└── vite.config.ts          # Vite configuration
```
