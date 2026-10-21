# Assessments v2 — progress

Updated by Claude at the end of every phase. Read this first in every session.

## Phase status

| Phase | Scope | Status |
|---|---|---|
| 0 | Foundation (skeleton, route, roles, mock API, workflow engine, checklist, letters, audit, notifications, stubs) | Done — router change to App.tsx pending developer approval (see "Items partial") |
| 1 | QSA Addendum | Done — `modules/qsa-addendum/` (external QP side + internal QCTO side) |
| 2 | EISA Instrument Validation | Not started |
| 3 | EISA Calendar | Done — `modules/eisa-calendar/` (external QP/SDP side + internal QCTO side) |
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

### Phase 1 — QSA Addendum (`modules/qsa-addendum/`)

- **CR-003** (no "Proposed EISA Date" on submission) → `external/NewApplicationForm.tsx` has no such field; dates are deferred to the future EISA Calendar module.
- **CR-004** (gate check only decides where documents come from, no EISA/FISA split) → `mock/api/saqaRegistry.ts` (`checkSaqaRegistration`, simulated — see "Assumptions made") called from `external/NewApplicationForm.tsx`; both outcomes feed the same `evalState` workflow in `api.ts`/`workflow.ts`. No path-split code exists anywhere.
- **CR-005** (acknowledgement letter generated from template, reviewer "view" step kept) → `shared/letters/templates.ts` (`acknowledgement` template, built in Phase 0) rendered via `internal/ApplicationWorkspace.tsx` and `external/ApplicationDetail.tsx`'s Acknowledgement tab/section.
- **CR-006** applied again here (QP label throughout the new module, no "AQP").
- **CR-007** (no DD → CEO route for the acknowledgement letter; stops at DD) → `workflow.ts` `ACK_WORKFLOW` stages are `asd-preview → dd-review → acknowledged`; no CEO stage exists.
- **CR-008** (CEO only signs the outcome letter, no checklist) → `workflow.ts` `OUTCOME_WORKFLOW` is the only place the CEO role appears in this module; its one action is "Sign outcome letter" — no checklist, no approve/decline.
- **CR-011** applied again here: `qsaChecklist` and the new `ddReviewChecklist` (`mock/data/ddReviewChecklistItems.ts`, 5 items copied from the old build's `ddItems`) both go through the shared `Checklist` component with mandatory per-line comments.
- **CR-012** (DD can only return to ASD, never straight to QP) → `workflow.ts` `EVAL_WORKFLOW` has `eval-dd-return-to-asd` (dd-review → asd-evaluation) and a separate `eval-return-to-qp` action that only the ASD stage owns. There is no DD → QP action anywhere in the code.
- **CR-013** (outcome + approval letters generated from template, view/print, no upload) → both use the Phase 0 `shared/letters` templates/`LetterView`; `internal/ApplicationWorkspace.tsx` Outcome/Approval tabs.
- **CR-013 note** (digital signatures deferred) → untouched; `LetterView` only offers Print.
- **CR-007/CR-008 follow-up** (who signs the approval letter) → answered with an assumption: `modules/qsa-addendum/config.ts` (`APPROVAL_LETTER_SIGNER_ROLE`, default `'Deputy Director'`) drives `APPROVAL_LETTER_WORKFLOW`'s allowed role. One constant to change — see "Open questions".
- **CR-014** (two separate flows: evaluation approval vs. outcome letter) → `workflow.ts` defines `EVAL_WORKFLOW` (ASD → DD → IAC) and `OUTCOME_WORKFLOW` (CEO signature) as two independent `WorkflowDefinition`s with separate `WorkflowRecordState`s (`evalState`, `outcomeState`) on `QsaAddendumApplication`.
- **CR-016** (IAC can approve, decline, or send for remediation back down the chain) → `EVAL_WORKFLOW` `iac-review` stage has three actions: `eval-iac-approve`, `eval-iac-decline` (→ `declined`, terminal), `eval-iac-remediation` (→ back to `asd-evaluation`). All three require the IAC to have uploaded the simulated summary presentation first (`api.ts` `performEvaluationAction` guard).
- **CR-030 assumption** (where the approved EISA sittings per year is captured) → on the ASD's evaluation report, `evaluationReport.approvedEisaSittingsPerYear` (`internal/ApplicationWorkspace.tsx` Evaluation tab). Exposed via `api.ts` `listApprovedQsaAddenda()` for the future EISA Calendar/Instrument Validation modules to read once an addendum reaches `approvalState.stageId === 'signed'`.
- Workflow-engine rules (no self-approval, mandatory notes on send-back/reject) applied throughout `EVAL_WORKFLOW`/`ACK_WORKFLOW` via `requiresDifferentActor`/`requiresNote` on the relevant actions.

### Phase 3 — EISA Calendar (`modules/eisa-calendar/`)

- **CR-027** (standalone, QCTO-managed add/edit/delete at any time) → `api.ts` (`addSitting`, `editSitting`, `deleteSitting`), `internal/AddEditSittingDialog.tsx`, `internal/InternalCalendarView.tsx`'s "Add Sitting" button and List View row actions. Built as its own nav item (`config/nav.ts`), not a tab inside QSA Addendum or Registration.
- **CR-028** (QP proposes → QCTO validates/approves → published to calendar) → `workflow.ts` `BATCH_WORKFLOW` (`qcto-review → approved → published`, plus `rejected`), `api.ts` `performBatchAction`, `internal/BatchReviewPanel.tsx`. Built as three distinct actions (Approve, Reject, Publish) rather than one combined "approve & publish" step — see "Assumptions made".
- **CR-029** (in-system QP date-submission form) → `external/ProposeDatesForm.tsx`, reachable from the external portal's new "EISA Calendar" nav item (`config/nav.ts` — this nav item did not exist on the external side before this phase).
- **CR-030** (submitted date count must match the qualification's approved EISA frequency) → `api.ts` `proposeSittingBatch` reads `approvedEisaSittingsPerYear` via `listEligibleQualifications()` (which calls the QSA Addendum module's `listApprovedQsaAddenda()`); blocked (not just warned) both in the form (`ProposeDatesForm.tsx` disables submit) and again server-side in `api.ts`.
- **CR-031** (several sittings per qualification per year) → `types.ts` `EisaSitting`/`EisaSittingBatch` — one qualification can have many `EisaSitting` rows across any number of years; nothing in the data model caps this.
- **CR-032** (automatic rejection of holidays/weekends/lead-time, plus formal QCTO review with mandatory rejection reason) → `dateChecks.ts` `checkSittingDate` (uses `config/holidays.ts` and `shared/dates/workingDays.ts`), enforced as a hard block on the QP's proposal (`api.ts`, `external/ProposeDatesForm.tsx`) and shown as a non-blocking override-able warning on QCTO's own direct add/edit (`internal/AddEditSittingDialog.tsx`) — see "Assumptions made". The formal review (approve / reject with mandatory reason) is `BATCH_WORKFLOW`'s `batch-approve` / `batch-reject` actions, reason captured via the new `shared/ui/ReasonDialog.tsx`.
- **CR-033** (visual calendar — month + list view — with status colours, plus in-app deadline banners) → `components/SittingMonthView.tsx`, `components/SittingListView.tsx`, `components/StatusBadge.tsx`/`statusStyles.ts` (6 status colours), `components/UpcomingDeadlinesBanner.tsx` (derived, not a stored notification — shows published sittings within `config.ts`'s `UPCOMING_DEADLINE_WINDOW_DAYS`).
- **CR-033 note** (real email/SMS) → untouched; in-app only, per the module `CLAUDE.md`.
- **CR-034** (QCTO-only cancel/postpone, mandatory reason, SDP notifications, audit trail) → `workflow.ts` `SITTING_LIFECYCLE_WORKFLOW`, `api.ts` `performSittingLifecycleAction`, `internal/InternalCalendarView.tsx` (List View's Postpone/Cancel buttons + `ReasonDialog`). Notifies both `SDP` and `QP` (see "Assumptions made"). Audit entries land under `eisa-calendar-sitting`, visible on the new "Audit Trail" tab via `shared/audit/AuditTrailView.tsx`.
- **Cross-module exposure** (for registration, confirmation, site visits, in later phases) → `modules/eisa-calendar/index.ts` re-exports `listPublishedSittings` from `api.ts` plus the `EisaSitting`/`EisaSittingStatus` types.
- **Shared working-days helper** (needed again by Phase 6's 21-working-day results SLA) → `shared/dates/workingDays.ts` (`isWorkingDay`, `addWorkingDays`, `workingDaysBetween`), built against `config/holidays.ts`'s holiday list — one definition of "working day" for the whole domain.
- New shared pieces built in this phase, reusable by later phases: `shared/ui/ReasonDialog.tsx` (mandatory-reason dialog — CR-056's later send-back/reject actions will likely reuse this), `shared/audit/AuditTrailView.tsx` (module-wide or per-record audit feed), `shared/notifications/useNotifications.ts` (first real wiring of the Phase 0 notification store into a screen — Phase 0's `NotificationBanner`/`store.ts` existed but nothing consumed them until now).

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
- **SAQA registry check lives in `mock/api/saqaRegistry.ts`, not `mock/integrations/`.** The module `CLAUDE.md`'s "Data" section explicitly lists "SAQA registry" as cross-domain data simulated in `mock/api`, while `mock/integrations/` is reserved for the backend-only CRs with no screen (CR-001, 002, 009, 010, 020, 022, 037, 039). Since the gate check has a screen (the New Application form), it follows the `mock/api` convention. There is no real SAQA API, so the QP simulates the outcome with "Registered"/"Not Registered" buttons, same UX as the old build.
- **"A different actor" means a different role, not a different individual.** This build has no per-user login — only a role switcher (`RoleContext`) — so `requiresDifferentActor` (CR-053) compares the role label stored as `submittedBy` against the current role's label. Within a single role this is indistinguishable from a real per-user check because the workflow already prevents the same role from acting twice in a row (the stage moves on); it only becomes a real gap if QCTO later wants to stop e.g. two different ASDs approving each other's work, which needs real individual logins.
- **The external dashboard shows every application, not just one QP's.** "My QSA Addendum applications" has no QP identity to filter by — the QP name on an application is a free-text form field, not a login. Revisit if/when the app gains real QP accounts.
- **IAC decline vs. remediation are different terminal directions.** A decline moves straight to the outcome-letter flow (the CEO signs a letter saying "Declined" — confirming the process was followed, per CR-008's intent). "Send for remediation" instead loops back to the ASD so the application can be reworked and re-evaluated. Process-flow.md's wording ("a decline sends it back for remediation") reads as if these are the same thing, but CR-016 lists them as separate actions ("decline or send for remediation") — built as two distinct buttons so both are directly testable.
- **Approval letter signer defaults to the Deputy Director.** Open question (CR-007/CR-008 follow-up) answered with the simplest reading — one constant, `modules/qsa-addendum/config.ts` → `APPROVAL_LETTER_SIGNER_ROLE`, to change if QCTO names someone else.
- **Approved EISA sittings per year is captured on the QSA Addendum evaluation.** Open question (CR-030) answered with the simplest reading — a field on the ASD's evaluation report (`evaluationReport.approvedEisaSittingsPerYear`), not a separate screen. Move it if QCTO confirms a different home for this value.
- **IAC remediation goes to the ASD, who can then return it to the QP.** "Remediation goes back down the chain" (CR-016) is built as IAC → `asd-evaluation` directly — the same stage the ASD already works from, which still has its own "Return to QP for corrections" action if the ASD decides the QP needs to make changes. There is no separate remediation-only stage.

- **No specific role is named for the EISA Calendar, so the ASD reviews/publishes/postpones/cancels.** The register and process-flow.md both say only "QCTO officials" (CR-027/CR-032). Implemented as `modules/eisa-calendar/config.ts` → `CALENDAR_REVIEWER_ROLE` (`'ASD'`) and added to the ASD's teams in `config/roles.ts` (`eisa-calendar`, alongside the ASD's existing `qsa-evaluation`/`instrument-validation` teams either side of it on the highway) — one constant to change if QCTO names a different role.
- **The minimum lead time is expressed in working days (21), using the same shared helper Phase 6 needs for its 21-working-day results SLA.** Neither the figure nor the unit (calendar vs working days) is in the register (CR-032 open question). `config/holidays.ts` → `MIN_LEAD_TIME_WORKING_DAYS`.
- **The SA public holiday list is a best-effort 2026–2027 list, not from a QCTO-confirmed source.** `config/holidays.ts` → `SA_PUBLIC_HOLIDAYS`. Confirm the real source (CR-032 open question) before relying on it past the demo.
- **"Approve" and "publish" are two separate QCTO actions, not one combined step.** CR-028's prose reads sequentially ("QCTO validates and approves them, then they are published"), and the developer's own requested click-through script lists them as three separate steps (approve / reject with reason / publish) — built that way in `BATCH_WORKFLOW` (`qcto-review → approved → published`).
- **The automatic date checks (CR-032) hard-block a QP's proposal, but only warn (non-blocking) when QCTO adds or edits a sitting directly.** CR-027 gives QCTO unrestricted add/edit/delete ("at any time"), while CR-032's "reject dates automatically" reads as being about the QP-facing submission path. QCTO can override; `internal/AddEditSittingDialog.tsx` shows the same `checkSittingDate` result as a dismissible warning instead of a block.
- **Postponing a sitting does not auto-create a replacement date.** The register doesn't ask for this, and "stages are not auto-triggered" is a running theme in this build (CR-024, CR-044) — QCTO adds a new date separately (CR-027) if the sitting needs to be rescheduled.
- **The external "EISA Calendar" screens show every QP's/SDP's submissions and sittings, not filtered to "my own".** Same reason as the QSA Addendum module's existing assumption: there is no QP/SDP login, only the role switcher, so there is no identity to filter by.
- **Cancellation/postponement notifications go to both the SDP (explicitly required by CR-034) and the QP** (their qualification's sitting changed) — `api.ts` `performSittingLifecycleAction` calls `addNotification` twice, once per recipient role.
- **SDPs see only `published`, `postponed` and `cancelled` sittings** (`external/SdpCalendarView.tsx`) — the earlier internal-only stages (`proposed`, `approved`, `rejected`) are a QP ↔ QCTO matter, mirroring CR-018's "SDPs never see EISA Instrument Validation".

## Open questions for QCTO (carry over from 01-process-flow.md §9, plus new ones)

- Who signs the approval letter, now that the CEO only signs the outcome letter? (default in v2: DD, implemented as `modules/qsa-addendum/config.ts` → `APPROVAL_LETTER_SIGNER_ROLE` — one constant to change)
- Where is the approved number of EISA sittings per year captured (CR-030)? (default in v2: a field on the ASD's QSA Addendum evaluation report — one field to move if QCTO says otherwise)
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
- **2026-10-21** — Phase 1 (QSA Addendum, CR-003 to CR-016 per the Phase 1 map) built end to end, external and internal: `modules/qsa-addendum/` — `types.ts`, `config.ts`, `workflow.ts` (four `WorkflowDefinition`s: acknowledgement, evaluation, outcome letter, approval letter), `api.ts` (mock backend + completeness guards), `hooks.ts` (React Query), `components/` (`StatusBadge`, `DocumentsList`, `CorrectionsPanel`), `external/` (`ExternalDashboard`, `NewApplicationForm`, `ApplicationDetail`), `internal/` (`InternalDashboard`, `ApplicationWorkspace`). New Phase-0-adjacent files: `mock/api/saqaRegistry.ts`, `mock/data/ddReviewChecklistItems.ts`. Wired into `index.tsx`/`config/nav.ts` (nav item no longer shows "Phase 1"). `npx eslint src/features/assessments-v2` and a scoped `tsc --noEmit` pass clean (see "Assumptions made" for why a temporary tsconfig was used instead of the root build).
- **2026-10-21** — Phase 3 (EISA Calendar, CR-027 to CR-034) built end to end, standalone (its own nav item on both portals), external and internal: `modules/eisa-calendar/` — `types.ts`, `config.ts`, `workflow.ts` (`BATCH_WORKFLOW`, `SITTING_LIFECYCLE_WORKFLOW`), `dateChecks.ts` (CR-032), `api.ts`, `hooks.ts`, `components/` (`StatusBadge`/`statusStyles`, `SittingMonthView`, `SittingListView`, `UpcomingDeadlinesBanner`), `external/` (`ExternalCalendarView`, `QpCalendarView`, `SdpCalendarView`, `ProposeDatesForm`), `internal/` (`InternalCalendarView`, `BatchReviewPanel`, `AddEditSittingDialog`). New shared pieces: `config/holidays.ts`, `shared/dates/workingDays.ts`, `shared/ui/ReasonDialog.tsx`, `shared/audit/AuditTrailView.tsx`, `shared/notifications/useNotifications.ts` (first screen to actually wire up Phase 0's notification store). Config changes: `config/nav.ts` (added "EISA Calendar" to the external nav — it did not exist there before — and dropped the "Phase 3" tag internally), `config/roles.ts` (ASD gains the `eisa-calendar` team). Found and fixed a timezone bug while building `workingDays.ts`: constructing a `Date` from an ISO string without a "Z" suffix parses in the browser's local timezone, so calling the UTC getters/setters on it (as the original draft did) could shift the computed weekday by a day in any timezone ahead of UTC — fixed by parsing with an explicit "Z" and using UTC methods throughout. `npx eslint src/features/assessments-v2` and a scoped `tsc --noEmit` (temporary `tsconfig.check.json`, deleted afterwards) both pass clean.
