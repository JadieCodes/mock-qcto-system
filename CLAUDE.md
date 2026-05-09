# CLAUDE.md

## Project Overview

SETA (Sector Education and Training Authority) management platform for South Africa's sector training system. A multi-domain workflow tool that digitizes and manages the full certification lifecycle — from certificate issuance and accreditation of training organizations, through to qualification design, assessment, research, and quality assurance.

The app has two top-level user flows:
- **Profiles flow** (`/profiles/*`) — individual learners/applicants submitting for certificates
- **Departments flow** (`/departments/*`) — internal staff working across 6 specialized domains

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 19.2.0 |
| Language | TypeScript (strict mode) | ~5.9.3 |
| Build tool | Vite | ^7.2.4 |
| Styling | Tailwind CSS | ^3.4.18 |
| Component library | Radix UI (shadcn-style, in `src/components/ui/`) | various |
| Routing | React Router DOM | ^7.9.6 |
| Forms | React Hook Form | ^7.66.1 |
| Server state | TanStack React Query | ^5.90.11 |
| Global state | React Context (`AppContext`) + localStorage | — |
| Icons | Lucide React | ^0.554.0 |
| Animations | Framer Motion | ^12.23.24 |
| Charts | Recharts | ^3.5.0 |
| Toasts | Sonner | ^2.0.7 |
| Linting | ESLint + typescript-eslint | ^9.39.1 / ^8.46.4 |

**Path alias:** `@/` maps to `src/` (configured in `tsconfig.json` and Vite).

**Build command:** `tsc -b && vite build`  
**Dev server:** `npm run dev` (Vite HMR)

---

## Application Domains

### 1. Certification (`/profiles/*`)
Certificate processing for individual learners. Three process types:
- **CERT-01 (Issue)** — new certificates (Occupational, Skills, Legacy pathways)
- **CERT-02 (Re-Issue)** — replace lost/damaged certificates
- **CERT-03 (Replace)** — replace incorrectly issued certificates

Key pages: `Dashboard`, `Intake`, `Batches`, `Integrations`, `Printing`, `InternalCorrections`

### 2. Qualifications (`/departments/qualifications/*`)
Qualification design, development, and multi-stage approval workflows.

Routes: `dashboard` → `applications` → `evaluations` → `workspace` → `public-input` → `approval` → `reporting`

Layout: `InternalQualificationsLayout`

### 3. Assessment (`/departments/assessment/*`)
Standards framework management — FISA (trades) and EISA (non-trades) assessments, site visits, assessor/candidate/center management.

Routes: `qasa-management`, `fisa/standards`, `fisa/validation`, `eisa/trades`, `eisa/non-trades`, `site-visits/*`

Layout: `AssessmentLayout`

### 4. Accreditation (`/departments/accreditation/*`)
9-step accreditation workflow for training organizations: form submission → AI review → document upload → final review → payment → proof of payment → site visit scheduling → site visit execution → outcome letter.

Routes: `applications`, `site-visits`, `outcome-letters`  
Additional standalone routes: `/qp-dashboard` (Quality Partner), `/verifier-dashboard`

Layout: `AccreditationLayout`

### 5. Research (`/departments/research/*`)
Research agenda, project, and milestone management with evidence submission and audit trails.

Routes: `dashboard`, `requests`, `appointments`, `reporting`, `bulletin`, `external`, `agenda-management`, `project-archive`, `audit-trail`

Layout: `InternalSideMenuBar`

### 6. Quality Assurance (`/departments/quality-assurance/*`)
Learner enrolment and curriculum implementation monitoring. Allocation to Quality Partners.

Routes: `learner-enrolment`, `curriculum-implementation`, `skills-programmes`, `historical-qualifications`

Layout: `QAInternalSideBar`

---

## Project Structure

```
src/
├── App.tsx                    # All routing lives here
├── main.tsx                   # Entry point
├── contexts/AppContext.tsx    # Global state (40+ vars, localStorage persistence)
├── types/index.ts             # All shared TypeScript types (100+ exports)
├── pages/                     # Route-level page components
│   ├── assessment/
│   ├── accreditation/
│   ├── qualifications/
│   ├── research/
│   └── QA/
├── components/
│   ├── ui/                    # 50+ reusable components (shadcn-style)
│   ├── *Layout.tsx            # Domain layout wrappers
│   └── *Selector.tsx          # Role-switcher components
├── users/                     # Profiles flow pages + dashboard tabs
├── departments/               # DepartmentsLanding + department login
├── hooks/                     # Custom React hooks
├── lib/                       # Utility functions, localStorage helpers
└── services/                  # Data service layer
```

---

## Coding Conventions

### TypeScript
- **Strict mode is on** — never disable it, never add `// @ts-ignore`
- **No `as any` casts** — use proper type guards, discriminated unions, or narrow the type correctly
- **No `as unknown as T`** either — fix the underlying type instead
- Prefer `type` over `interface` for union types; use `interface` for object shapes that may be extended
- Use optional chaining (`?.`) and nullish coalescing (`??`) consistently — never assume nested properties exist

### React
- Functional components only — no class components
- Co-locate state as close to where it's used as possible; only lift to AppContext when genuinely global
- Use React Hook Form for all forms — no controlled `useState` inputs for form fields
- Avoid recreating objects/functions on every render inside JSX; extract them or use `useMemo`/`useCallback`
- `queryClient` must be instantiated outside the component (it's currently inside `App` — this is a known issue)

### Styling
- Tailwind utility classes only — no inline `style={{}}` unless absolutely necessary
- Use `cn()` from `@/lib/utils` to merge conditional classes
- Follow the existing HSL CSS variable system for colors — don't hardcode hex/rgb values

### Code Quality
- **No `console.log` in production code** — remove before committing
- **No `alert()` for errors** — use the Sonner toast (`import { toast } from 'sonner'`) or a proper error UI
- Comments only when the *why* is non-obvious — no explaining what the code does
- No unused variables or imports (`noUnusedLocals` and `noUnusedParameters` are on)

### State & Persistence
- localStorage keys must be defined as constants — no bare string literals scattered across files
- All AppContext state mutations go through the context's provided functions — don't write to localStorage directly from components
- Data migrations in AppContext need idempotency guards so they can't run multiple times

---

## Known Issues & WIP (as of 2026-05-09)

### High priority
- **Duplicate `ApplicationStatus` interface** in `src/types/index.ts` — defined at ~line 550 and ~line 687 with conflicting fields. One needs to be removed.
- **40+ `as any` casts** — concentrated in `AccreditationDomain.tsx`, `OutcomeLettersPage.tsx`, `QPDashboard.tsx`, `ProfileIntake.tsx`. These mask real type errors and need to be replaced with proper types.
- **`queryClient` instantiated inside `App` component** (`App.tsx:101`) — this recreates the client on every render. Move it outside the component.

### Medium priority
- **WIP data migration** in `AppContext.tsx` lines ~1365–1390: converts `'Allocated'` → `'Allocated to QA'` status. Incomplete idempotency guard — could run multiple times and corrupt data.
- **Debug `console.log` statements** left in: `AppContext.tsx`, `DepartmentLogin.tsx`, `ProfileIntake.tsx`
- **Config file duplicates**: `vite.config.ts` + `vite.config.js` (JS takes precedence), `tailwind.config.ts` + `tailwind.config.js`. The `.ts` versions should be removed.

### Low priority / incomplete features
- AI Recommendation system: types defined in `types/index.ts` but minimal implementation
- Pre-intake validation: fields exist on `Submission` type but UI is not fully built out
- No centralized file for localStorage key constants — keys are bare strings scattered across files
- Missing `alert()` → toast migration in several older pages

---

## Session Context

- **All routing** is in `src/App.tsx` — this is the single source of truth for what pages exist
- **All shared state** is in `src/contexts/AppContext.tsx` — read this before adding new global state
- **All shared types** are in `src/types/index.ts` — check here before defining a new type
- **Protected routes** use `ProtectedDepartmentRoute` component — department access is checked at this boundary
- The `@/` path alias resolves to `src/` — always use it for imports, never use relative `../../` paths from deep files
- Cert domain (profiles flow) and department domains are intentionally separate user journeys with separate layouts
- The assessment domain reuses `InternalSiteVisitsAndMonitoringPage` for multiple site-visit sub-routes — it reads the current URL path to determine which view to show
