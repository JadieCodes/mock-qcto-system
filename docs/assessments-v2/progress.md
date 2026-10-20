# Assessments v2 — progress

Updated by Claude at the end of every phase. Read this first in every session.

## Phase status

| Phase | Scope | Status |
|---|---|---|
| 0 | Foundation (skeleton, route, roles, mock API, workflow engine, checklist, letters, audit, notifications, stubs) | Done — router change to App.tsx pending developer approval (see "Items partial") |
| 1 | QSA Addendum | Not started |
| 2 | EISA Instrument Validation | Not started |
| 3 | EISA Calendar | Not started |
| 4 | EISA Registration & EISA Confirmation | Not started |
| 5 | Site Visits & Monitoring hub | Not started |
| 6 | Approval of Results | Not started |
| 7 | FISA (+ RPL Toolkit if confirmed) | Not started |
| 8 | Hardening, register check-off, new user manual, swap prep | Not started |

## Items done

_(CR/PM number → where it lives, e.g. `CR-003 → modules/qsa-addendum/external/NewApplicationForm.tsx`)_

- **CR-006** (AQP → QP rename) → `config/labels.ts`; applied when copying old checklist/form text into `mock/data/*` (QSA checklist items 1.1.4–1.1.7, site-visit items 2.3, 2.4, 5.4).
- **CR-015** (process-stage teams, not QP portfolio) → `config/teams.ts` (`PROCESS_STAGE_TEAMS`), `config/roles.ts` (`ROLE_DESCRIPTORS[].teams`).
- **CR-011** (mandatory comment per checklist line) → `shared/checklist/types.ts` (`isChecklistComplete`), `shared/checklist/Checklist.tsx`, gated by `config/featureFlags.ts` (`CHECKLIST_REQUIRE_COMMENT_PER_LINE`, true for this domain only).
- **PM-04** (three distinct names instead of "EISA Notification") → placeholders in `config/labels.ts` (`eisaReadinessNoticePlaceholder`, `markingModerationVisitRequestPlaceholder`); `eisaConfirmation` already has its real CR-043 name.
- **CR-001, CR-002, CR-009, CR-010, CR-020, CR-022, CR-037, CR-039** (backend stubs, no screen) → `mock/integrations/{qualificationsDevelopment,dataQualityGate,aiValidation,itemBank,qualificationsModules,homeAffairs}.ts`.
- Foundation scaffolding (not individually numbered): workflow engine (`shared/workflow/{types,engine}.ts` — stage/role gating, CR-053 no-self-approval, CR-056 send-back/reject, CR-055 audited manual re-route); letters (`shared/letters/*` — CR-005/CR-013 template generation + view/print); audit trail (`shared/audit/*`); in-app notifications (`shared/notifications/*`); mock persistence (`mock/api/storage.ts`, `assessmentsV2:` prefix, try/catch with seed fallback, `resetDemoData()`); v2-local role switcher independent of the app-wide `AppContext` (`shared/ui/RoleContext.tsx`, `RoleSwitcher.tsx`); demo banner (`shared/ui/DemoBanner.tsx`); layout (`shared/ui/AssessmentsV2Layout.tsx`); entry point with its own `QueryClientProvider` (`index.tsx`); module folder skeleton created per the CLAUDE.md architecture (`modules/*/index.ts`, each a placeholder noting its build phase).
- Checklist/form wording copied verbatim (AQP→QP renamed) from the old build into `mock/data/`: `qsaChecklistItems.ts` (44 items), `instrumentValidationChecklistItems.ts` (33 items + 6 required-document labels), `siteVisitFormSections.ts` (36 items across 6 sections + 2 free-text sections + completion fields).

## Items partial

- **Router mount** (`/assessments-v2/*` in `src/App.tsx`) — proposed, not yet applied. Per the module's hard rule 1, this is the one file outside the box that may be edited, and only after the developer approves the exact diff.

## Swap-time dependents (carry forward before 06-swap-plan.md work begins)

Found during Phase 0 discovery — files outside `src/pages/assessment` that import from it and will need re-pointing or removal when v2 replaces the old domain:

- `src/users/dashboardTabs/AssessmentDomain.tsx` — Profiles-portal "Assessment Domain" tab, imports 5 old `External/*` pages directly.
- `src/services/WorkflowBridgeService.ts` — type-only import of `QasaSubmission` from the old external QSA submission page.

(`src/App.tsx` also imports 11 old assessment page components to build `/departments/assessment/*` — expected, that route stays until swap time.)

## Assumptions made

- The v2 role switcher is fully self-contained (`shared/ui/RoleContext.tsx`), independent of the app-wide `AppContext.currentRole`. The old build's role selector mutates one global role shared by every domain; v2's hard rule 3 forbids importing `AppContext` anyway, so this was a forced — and, since it stops a v2 role switch from leaking into other open domains, desirable — design choice. Confirmed with the developer before Phase 0B build began.
- React Query cache is never the source of truth for workflow/domain state — `mock/api` (memory + localStorage) always is. The query client is scoped to `index.tsx` only, instantiated once at module scope, and never touches `App.tsx`'s client (which root `CLAUDE.md` already flags as recreated-every-render — a pre-existing issue outside this module's remit to fix).
- `/assessments-v2` is reachable directly by URL with no department-login gate (matching `06-swap-plan.md`), so a persistent "Demo — mock data only" banner is shown in the v2 header at all times.

## Open questions for QCTO (carry over from 01-process-flow.md §9, plus new ones)

- Who signs the approval letter, now that the CEO only signs the outcome letter? (default in v2: DD — one constant to change)
- Where is the approved number of EISA sittings per year captured (CR-030)?
- Lead-time figure and public-holiday source for EISA date validation (CR-032)?
- Is EISA Readiness still a required visit, and how does QA take part?
- Post-EISA Monitoring trigger: low competency rate? What threshold?
- FISA Instrument Validation: confirm no DD step.
- RPL Toolkit Evaluation: needs a change request.
- Names for the readiness notification and the marking/moderation visit request (PM-04).
- Official on-screen name for the addendum: QSA or QAS/QASA?
- Report visibility rules between units (CR-054); visit-type templates (CR-048).
- Differences between the Trades and Non-Trades registration paths.

## Backend-dependent items (stub only)

CR-001, CR-002, CR-009, CR-010, CR-020, CR-022, CR-037, CR-039 — typed stubs in `mock/integrations/`, no screens.

## Change log

- **2026-10-20** — Phase 0 foundation built: skeleton, config (roles/teams/nav/labels/flags), v2-local role switcher, workflow engine, shared checklist component, letters, audit trail, in-app notifications, mock persistence layer, backend-dependent stubs, old checklist/form wording copied into mock data, module folder skeleton, entry point with its own QueryClientProvider. Router mount proposed but not yet applied — awaiting developer approval of the exact `App.tsx` diff.
