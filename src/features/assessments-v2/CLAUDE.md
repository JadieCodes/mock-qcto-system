# Assessments v2 — rules for Claude Code

You are building a brand-new **QCTO Assessments Domain** (v2) inside this project, on the git branch `assessments-v2`.
It replaces the old Assessments screens (`src/pages/assessment/`), which have the wrong flow. The old screens stay untouched until QCTO signs off the new ones.

This is a **frontend-only mock**: there is no backend. Everything runs on simulated data.

The developer is a junior/intermediate developer. After each piece of work, explain in plain language what you built, where it lives, and how to try it. Prefer simple, readable code over clever code.

## Read these first (every session)

1. `docs/assessments-v2/progress.md` — where we are, what is done, what is open.
2. `docs/assessments-v2/01-process-flow.md` — the CORRECT flow (the process maps, corrected). Wins over everything else.
3. `docs/assessments-v2/02-change-register.md` — every change request (CR-001 to CR-060) plus PM- items. Nothing in it may be skipped.
4. `docs/assessments-v2/05-build-prompts.md` — the phase you are on.
5. `docs/assessments-v2/04-old-user-manual-REFERENCE-ONLY.md` — the OLD flow, for labels/fields/roles only. **Do not copy its flow.**
6. `docs/assessments-v2/03-change-request-source.md` — the original client change request document.

## Hard rules (never break these)

1. **Stay inside the box.** Only create/edit files in `src/features/assessments-v2/` and `docs/assessments-v2/`. The ONLY file outside those that may be edited is the router, and only to add the one v2 route in Phase 0 (after the developer approves the exact change).
2. **Never edit other domains** (`src/pages/accreditation`, `QA`, `qualifications`, `research`, the loose files in `src/pages/`), **nor `src/components/ui/`**, nor the OLD `src/pages/assessment/`. If something there needs changing, stop and tell the developer.
3. **Never import from other domains or from the old assessment folder.** You may READ old code to learn its labels, checklist wording and form fields, and copy that *text* into v2 mock data. Allowed imports from outside the folder: `src/components/ui/*` (shadcn), `src/lib/utils`, and installed npm packages.
4. **No new npm packages** without asking. Use what is already installed: React 19, TypeScript, Vite, Tailwind CSS **3.4** (not v4), shadcn/Radix components, react-router-dom v7, @tanstack/react-query, react-hook-form, sonner (toasts), lucide-react (icons), react-day-picker, recharts, framer-motion (sparingly).
5. **Package manager is npm** (the project has a `package-lock.json`). Use `npm run dev`, `npm run build` and `npm run lint`. Never run `pnpm install` or `yarn` (they would create a second lock file), and never run `npm install <package>` — no new packages without asking.
6. **Do not run git commands that change history or branches.** `git status`, `git diff`, `git add`, `git commit` on the `assessments-v2` branch are fine (ask before committing). Never push, force, rebase, reset or switch branches without asking.

## Architecture (follow this)

```
src/features/assessments-v2/
  CLAUDE.md                  <- this file
  index.tsx                  <- exports <AssessmentsV2Routes/>; the ONLY thing the router imports
  config/                    <- roles, teams, nav per portal, labels, constants, feature flags
  shared/                    <- reusable pieces used by several modules
    workflow/                <- workflow engine (see below)
    checklist/               <- ONE evaluation-checklist component (comment on every line)
    letters/                 <- letter templates + generator + view/print
    audit/                   <- audit trail
    notifications/           <- in-app notifications / banners
    ui/                      <- small v2-only wrappers/badges (never edit src/components/ui)
  mock/
    api/                     <- the mock "backend": async functions used by React Query
    data/                    <- seed data
    integrations/            <- typed stubs for backend-only items (SAQA, Home Affairs, AI checks...)
  modules/                   <- ONE FOLDER PER PROCESS — everything about a process lives together
    qsa-addendum/            { external/ internal/ components/ workflow.ts types.ts }
    instrument-validation/
    eisa-calendar/
    eisa-registration/
    eisa-confirmation/
    site-visits/
    approval-of-results/
    fisa/
    rpl-toolkit/
  types/                     <- shared TypeScript types
```

**Module-first, not role-first.** Each process owns its external (QP/SDP) and internal (QCTO officials) screens in one folder. This is the opposite of the old project, where things were scattered.

### Data
- Components never import seed data directly. They call hooks that use React Query on top of `mock/api`.
- `mock/api` keeps state in memory and persists it to `localStorage` under keys prefixed `assessmentsV2:`. Wrap every storage read/write in try/catch and fall back to the seed data. Provide a "Reset demo data" action.
- Cross-domain data (QA learner enrolment, SDP compliance status, SAQA registry, Certification) is simulated in `mock/api` behind functions named after what the real domain would do, so it can be swapped for real calls later. Backend-only items (see CR-001, 002, 009, 010, 020, 022, 037, 039) get a typed stub in `mock/integrations/` and NO screen.

### Workflows are data, not scattered `if` statements
Each module declares its workflow in `workflow.ts`: stages, which role may act in each stage, the actions available, and where each action leads. `shared/workflow` enforces:
- a role can only act in its stage;
- **nobody approves their own submission** (the approver must be a different user from the submitter) — CR-053;
- every action writes an audit entry (who, role, action, time, note);
- "send back for clarification" and "reject" are available on every approval stage — CR-056;
- a manual re-route is possible only with a mandatory audit note — CR-055.

Changing a routing rule later must mean editing a workflow definition, not hunting through screens.

### The active-role switcher
The old build uses a dropdown to pretend to be different users. Keep that idea: a role switcher in the v2 header lets the demo user act as any role. The role decides which nav items, tabs and actions are visible.

## Roles in v2

External portal: **Quality Partner (QP)**, **SDP**.
Internal portal: **ASD**, **Assistant Director**, **Deputy Director (DD)**, **Director**, **Domain Director**, **Chief Director**, **IAC** (committee), **CEO**, **Sub Domain Admin**, **Director & Team** and **Qualifications Development** (FISA only).

Do NOT recreate the old combined role "Deputy & Assistant Director" (it caused the self-approval bug) or the duplicate "AIC" (it is the IAC). Work is assigned by **process-stage team** (QSA evaluation, instrument validation, registration, site visits…), not by QP portfolio (CR-015).

## Business rules that must hold everywhere

- The **CEO only signs the outcome letter**. The CEO never ticks evaluation checklists and nothing routes DD → CEO directly (CR-007, 008).
- The **acknowledgement letter stops at DD level**.
- Corrections route **DD → ASD → QP**. The DD never returns work straight to the QP (CR-012).
- The SAQA **gate check only decides where documents come from** (auto-pulled vs uploaded). It never decides EISA vs FISA (CR-004). **FISA is a fully separate process** (CR-026).
- **SDPs never see EISA Instrument Validation** (CR-018).
- **Stages are not auto-triggered.** Finishing instrument validation does NOT start registration (CR-024). Registration does NOT create site visits — the only automatic site-visit trigger is an **RPL/ARPL flag** on a registration (CR-042, 044).
- Every checklist line has a **mandatory comment** (CR-011). (This is the opposite of the Accreditation domain — keep it configurable per domain.)
- Letters (acknowledgement, outcome, approval) are **generated from templates** with a view/print step. Digital signatures are NOT built (deferred).
- Email/SMS are NOT built — **in-app notifications only**.
- File uploads are **UI-only** (pick a file, show its name, store the name/size in mock data). No scanning or AI validation.

## Naming rules (use exactly these labels)

| Use | Never use |
|---|---|
| QP | AQP |
| QAS Addendum (QASA) for the module's main menu entry and page title; QASA everywhere else (QCTO feedback 3.1) | QSA, QSA Addendum (code identifiers and folder names such as `qsa-addendum` stay as they are) |
| EISA Instrument Validation | EISA Validation, Validation of EISA |
| FISA Instrument Validation / FISA Validation Report | Validation of FISA, "EISA Validation Report" on a FISA screen |
| EISA Confirmation | EISA Notification (for the learner-list step) |
| IAC | AIC |
| Reports Received | Results Received, Schedules Received |
| Approval of Results | anything else for this module name |

Keep all user-facing labels in `config/labels.ts` so a rename is a one-line change. The readiness-visit notification and the marking/moderation visit request need their own distinct names (open question PM-04 — use placeholders `EISA Readiness Notice` and `Marking & Moderation Visit Request`, and flag them in `progress.md`).

## Code style

- TypeScript strict. No `any` unless commented why. Small files, descriptive names.
- Use the existing shadcn components. Match the look of the existing app (rounded cards, Inter, blue primary, status badges).
- Comment business rules with the CR number, e.g. `// CR-053: approver must differ from submitter`.
- Accessible by default: labels on inputs, buttons for actions, keyboard-friendly dialogs.
- Where the register says **Open item**, build the most reasonable reading, make it easy to change (a constant in `config/`), and add the question to the "Open questions" list in `progress.md`.

## Definition of done (for every phase)

1. `npm run build` passes (it runs `tsc -b`).
2. `npm run lint` shows no new errors in `src/features/assessments-v2/`.
3. Every CR/PM item for the phase works end to end for every role involved — walk through it in the browser.
4. `docs/assessments-v2/progress.md` is updated: items done (with the file where each lives), items partial, open questions, assumptions.
5. You have told the developer, in plain language, what to click to see it working.
6. Nothing outside `src/features/assessments-v2/` and `docs/assessments-v2/` changed (check `git status`).

## Working style

- Work **one phase at a time**. Start by restating the phase's CR list and writing a short plan. For Phase 0 and anything unclear, use plan mode and wait for approval.
- If the documents disagree, or something is missing, **ask** — do not guess silently. If you must assume, record the assumption in `progress.md`.
- Do not add features that are not in the register. Do not skip any that are.
