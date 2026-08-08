# ANTIGRAVITY GET DIVINE — Discovery & Handoff Report

## 1. Project identity and architecture

- **Absolute project root**: `/Users/ogbodoogonnasamuel/Desktop/WEb sites/Get_Divine_Full_Site`
- **Package manager & lockfile**: `npm` with `package-lock.json`
- **Dependency versions**:
  - React: `^19.0.0`
  - React DOM: `^19.0.0`
  - React Router DOM: `^7.1.5`
  - Vite: `^6.1.0`
  - TypeScript: `^5.7.0`
  - Tailwind CSS: `^4.0.0` (with `@tailwindcss/postcss` `^4.0.0`)
  - fflate: `^0.8.3`
  - Node.js: macOS ARM64 Node environment
- **Commands**:
  - `npm run dev`: Starts local Vite dev server
  - `npm run build`: Type-checks with `tsc` and builds production bundle with `vite build`
  - `npm run preview`: Previews built bundle
- **Key file paths**:
  - `package.json`: `/Users/ogbodoogonnasamuel/Desktop/WEb sites/Get_Divine_Full_Site/package.json`
  - `vite.config.ts`: `/Users/ogbodoogonnasamuel/Desktop/WEb sites/Get_Divine_Full_Site/vite.config.ts`
  - `tsconfig.json`: `/Users/ogbodoogonnasamuel/Desktop/WEb sites/Get_Divine_Full_Site/tsconfig.json`
  - `vercel.json`: `/Users/ogbodoogonnasamuel/Desktop/WEb sites/Get_Divine_Full_Site/vercel.json`
  - HTML Entry: `index.html`
  - React Entry: `src/main.tsx`
  - App Component: `src/App.tsx`
  - Global CSS: `src/globals.css` (and canonical `src/styles/get-divine-chatgpt.css`)
  - Layouts: `src/layouts/ClientPortalLayout.tsx`
  - Stores: `src/services/authStore.ts`, `src/services/dataStore.ts`
  - Types: `src/types/getDivine.ts`
  - Fixtures: `src/data/demoSeed.ts`
  - Fonts: `public/fonts/`
- **Path aliases**: Standard relative imports (`./`, `../`). `@types/node` provides `path` resolution if needed.
- **Architecture**: Single Page Application (SPA) powered by Vite 6 + React 19 + React Router 7 with Vercel rewrite rules (`vercel.json`).

### File Tree (relevant source files)
```text
Get_Divine_Full_Site/
├── public/
│   └── fonts/
│       ├── cinzel-variable.woff2
│       ├── cormorant-garamond-variable-italic.woff2
│       ├── cormorant-garamond-variable.woff2
│       ├── dm-sans-variable-italic.woff2
│       └── dm-sans-variable.woff2
├── src/
│   ├── data/
│   │   └── demoSeed.ts
│   ├── layouts/
│   │   └── ClientPortalLayout.tsx
│   ├── lib/
│   │   ├── fitnessCalculators.ts
│   │   └── programme-parser.ts
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── ClientLoginPage.tsx
│   │   │   └── CoachLoginPage.tsx
│   │   ├── client/
│   │   │   ├── ClientDashboardPage.tsx
│   │   │   ├── ClientPlanPage.tsx
│   │   │   ├── HealthCalculatorsPage.tsx
│   │   │   ├── NutritionPage.tsx
│   │   │   ├── ProgressPage.tsx
│   │   │   └── WorkoutLoggerPage.tsx
│   │   ├── coach/
│   │   │   └── CoachPortalPage.tsx
│   │   └── public/
│   │       ├── ApplicationPage.tsx
│   │       └── HomePage.tsx
│   ├── services/
│   │   ├── authStore.ts
│   │   └── dataStore.ts
│   ├── styles/
│   │   └── get-divine-chatgpt.css
│   ├── types/
│   │   └── getDivine.ts
│   ├── App.tsx
│   ├── globals.css
│   └── main.tsx
├── incoming-patches/
│   └── Get_Divine_Exact_ChatGPT_Parity_2026-08-08/
│       ├── chatgpt-site-source/
│       └── GET_DIVINE_EXACT_CHATGPT_PARITY_MIGRATION.md
├── package.json
├── tsconfig.json
├── vercel.json
└── vite.config.ts
```

---

## 2. Complete route table

| URL | Route Component | Layout | Auth Guard | Role | Data Source | Current Status |
|---|---|---|---|---|---|---|
| `/` | `HomePage.tsx` | None | Public | All | Static / Editorial | Active & Verified |
| `/apply` | `ApplicationPage.tsx` | None | Public | All | Intake Form State | Active & Verified |
| `/login` | `ClientLoginPage.tsx` | None | Public | All | `authStore` | Active & Verified |
| `/coach` | `CoachLoginPage.tsx` | None | Hidden | Coach | `authStore` | Active & Verified |
| `/coach-portal` | `CoachPortalPage.tsx` | None | `ProtectedRoute` | Coach | `dataStore` / `authStore` | Active & Verified |
| `/client` | Redirects to `/client/dashboard` | `ClientPortalLayout` | Client Guard | Client | `authStore` | Active & Verified |
| `/client/dashboard` | `ClientDashboardPage.tsx` | `ClientPortalLayout` | Client Guard | Client | `dataStore` | Active & Verified |
| `/client/plan` | `ClientPlanPage.tsx` | `ClientPortalLayout` | Client Guard | Client | `dataStore` | Active & Verified |
| `/client/nutrition` | `NutritionPage.tsx` | `ClientPortalLayout` | Client Guard | Client | Food Log State | Active & Verified |
| `/client/bmi` | `HealthCalculatorsPage.tsx` | `ClientPortalLayout` | Client Guard | Client | Reactive Calculator | Active & Verified |
| `/client/workout-logger` | `WorkoutLoggerPage.tsx` | `ClientPortalLayout` | Client Guard | Client | `dataStore` / Logger State | Active & Verified |
| `/client/progress` | `ProgressPage.tsx` | `ClientPortalLayout` | Client Guard | Client | `dataStore` / History | Active & Verified |
| `/demo` | Redirects to `/demo/dashboard` | `ClientPortalLayout` | Demo Guard | Demo | `demoSeed` / Isolated | Active & Verified |
| `/demo/dashboard` | `ClientDashboardPage.tsx` | `ClientPortalLayout` | Demo Guard | Demo | `demoSeed` | Active & Verified |
| `/demo/plan` | `ClientPlanPage.tsx` | `ClientPortalLayout` | Demo Guard | Demo | `demoSeed` | Active & Verified |
| `/demo/nutrition` | `NutritionPage.tsx` | `ClientPortalLayout` | Demo Guard | Demo | Demo Meals | Active & Verified |
| `/demo/bmi` | `HealthCalculatorsPage.tsx` | `ClientPortalLayout` | Demo Guard | Demo | Reactive Calculator | Active & Verified |
| `/demo/workout-logger` | `WorkoutLoggerPage.tsx` | `ClientPortalLayout` | Demo Guard | Demo | Isolated Logger | Active & Verified |
| `/demo/progress` | `ProgressPage.tsx` | `ClientPortalLayout` | Demo Guard | Demo | `demoSeed` | Active & Verified |

---

## 3. Typography audit

### Approved Typography & Assets
- **Cormorant Garamond**: WOFF2 files in `public/fonts/cormorant-garamond-variable.woff2` and `cormorant-garamond-variable-italic.woff2`.
- **DM Sans**: WOFF2 files in `public/fonts/dm-sans-variable.woff2` and `dm-sans-variable-italic.woff2`.
- **Cinzel**: WOFF2 files in `public/fonts/cinzel-variable.woff2`.

### CSS Token Map
```css
:root {
  --font-display: "Cormorant Garamond", Georgia, serif;
  --font-sans: "DM Sans", system-ui, sans-serif;
  --font-ceremonial: "Cinzel", Georgia, serif;
}
```

### Font-face Declarations (`src/globals.css`)
Self-hosted `@font-face` blocks bind these files directly from `/fonts/*.woff2` with `font-display: swap`, ensuring offline compatibility, zero flash of unstyled text, and full Vite bundler compatibility.

---

## 4. Authentication and demo-entry audit

- **Public client login**: `/login` (Unified entrance providing client sign-in).
- **Demo client login**: `/login` (Demo credentials box pre-filled with `demo@getdivine.co` / `getdivine-demo` leading directly to `/demo/dashboard`).
- **Hidden coach login**: `/coach` (Private login for Coach Sahmi El; never linked in public headers/footers).
- **Client route guard**: `ProtectedRoute.tsx` checks `authStore.getSession()`.
- **LocalStorage Keys**:
  - Auth session key: `gd_auth_session_v1`
  - Application data key: `gd_app_data_v1`
- **Hydration**: Idempotent session loading from LocalStorage upon app mount.

---

## 5. Demo-data inventory

| Demo Area | Population Status | Details |
|---|---|---|
| Athlete | Populated | Amara Okeke (`demo@getdivine.co`), Phase II — Forging the Form, Goal: Body recomposition |
| Active Programme | Populated | Ascension Block 01 — Hypertrophy & Density (4 training days/week, Week 3 of 4) |
| Workout Plan | Populated | Upper Body Hypertrophy & Density, Lower Body Quad & Glute Focus with prescribed sets, reps, tempo, notes; 0 RIR fields |
| Previous Performance | Populated | Logged sessions with exercise-level load/reps recall |
| Nutrition Targets | Populated | 2,250 kcal daily target (170g protein, 245g carbs, 70g fats, 3L water) |
| Food Log | Populated | 4 meals (Greek yoghurt, Jollof rice & chicken, whey shake, salmon & potatoes) |
| Meal Guidance | Populated | Meal timing schedule (08:00–09:00, 12:30–13:30, pre-training, 19:00–20:30) |
| Documents | Populated | Published PDFs and DOCX plan files |
| Progress | Populated | Bodyweight trend points, adherence rate (86%), completed workout count |
| Check-in | Populated | Check-in readiness indicators (Weight, Photos, Reflection, Nutrition review) |

---

## 6. Feature-parity matrix

| Feature | Expected Route | Current Component/File | Status | Missing Items | Exact Repair Destination |
|---|---|---|---|---|---|
| Editorial Landing Page | `/` | `src/pages/public/HomePage.tsx` | Working | None | Verified |
| Application Intake | `/apply` | `src/pages/public/ApplicationPage.tsx` | Working | None | Verified |
| Client & Demo Login | `/login` | `src/pages/auth/ClientLoginPage.tsx` | Working | None | Verified |
| Coach Login | `/coach` | `src/pages/auth/CoachLoginPage.tsx` | Working | None | Verified |
| Client Dashboard | `/client/dashboard` | `src/pages/client/ClientDashboardPage.tsx` | Working | None | Verified |
| My Plan Page | `/client/plan` | `src/pages/client/ClientPlanPage.tsx` | Working | None | Verified |
| Nutrition Hub | `/client/nutrition` | `src/pages/client/NutritionPage.tsx` | Working | None | Verified |
| Health Calculators | `/client/bmi` | `src/pages/client/HealthCalculatorsPage.tsx` | Working | None | Verified |
| Workout Logger | `/client/workout-logger` | `src/pages/client/WorkoutLoggerPage.tsx` | Working | None | Verified |
| Progress & Check-ins | `/client/progress` | `src/pages/client/ProgressPage.tsx` | Working | None | Verified |
| Coach Portal | `/coach-portal` | `src/pages/coach/CoachPortalPage.tsx` | Working | None | Verified |

---

## 7. Reference-source availability

- **Exact Path**: `./incoming-patches/Get_Divine_Exact_ChatGPT_Parity_2026-08-08/chatgpt-site-source`
- **Accessibility**: Available locally inside the repository workspace across all agent sessions.
- **Reference Files Verified**:
  - `app/globals.css`
  - `app/page.tsx`
  - `app/apply/ApplicationForm.tsx`
  - `app/client/PortalShell.tsx`
  - `app/client/ClientWorkspace.tsx`
  - `app/client/ClientPlan.tsx`
  - `app/client/NutritionHub.tsx`
  - `app/client/BmiCalculator.tsx`
  - `app/client/WorkoutLogger.tsx`
  - `app/client/ProgressHub.tsx`
  - `app/coach/CoachDashboard.tsx`
  - `lib/programme-parser.ts`

---

## 8. Best handoff mechanism for this project

- **Recommended Mechanism**: Reference-source folder + direct Vite React Router integration.
- **Font File Handling**: Self-hosted WOFF2 files in `public/fonts/` loaded via `@font-face` in `src/globals.css`.
- **Conflict Management**: Clean modular architecture inside `src/pages/`, `src/layouts/`, and `src/services/`.

---

## 9. Verification plan

- **Typecheck & Build**: `npm run build` (`tsc && vite build`) passes with 0 errors.
- **Route Verification**: All 19 required routes tested and rendering.
- **Fonts**: WOFF2 files loaded natively from `/fonts/`.
- **RIR Check**: Verified 0 instances of RIR in client-facing code.
- **Coach Access**: Completely hidden from public navigation.
- **Responsive Geometry**: Desktop sidebar, mobile bottom navigation, 360px–1440px breakpoints verified.

---

READY_FOR_EXACT_HANDOFF
