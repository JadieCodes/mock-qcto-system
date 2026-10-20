# Assessments v2 — build prompts

Paste ONE prompt at a time into Claude Code (terminal `claude`, or the VS Code extension), in order.

**Before every phase**
1. Make sure you are on the `assessments-v2` branch (`git branch --show-current`) and `git status` is clean.
2. Start a fresh session (`/clear`), so Claude re-reads the rules and docs instead of relying on a long chat.
3. Phase 0A (and any time you want to review before it changes files): switch to **plan mode** (press Shift+Tab until it says plan mode).

**After every phase**
1. Run `npm run build` and `npm run lint`, open `http://localhost:5173/assessments-v2` and click through the flow for each role.
2. Read `progress.md` to see what Claude says is done / partial / assumed.
3. Commit: `git add -A` then `git commit -m "assessments-v2: phase N - <what>"`.
4. If something is wrong, tell Claude what you saw and let it fix it BEFORE starting the next phase.

Every prompt below begins with the same "read first" line so a fresh session is never missing context.

---

## Phase 0A — Discovery (plan mode, no file changes)

```
Read src/features/assessments-v2/CLAUDE.md, then docs/assessments-v2/00-README.md, progress.md, 01-process-flow.md and 02-change-register.md (Phase 0 items).

This is DISCOVERY ONLY. Do not create or change any file.

1. Find how the OLD assessment domain is wired into the app: the router file, the route paths, how the Departments portal (internal users) and Profiles portal (external users) reach it, how the domain password/login gate works, and how the "role dropdown" (user switcher) works.
2. Find which shared pieces I can reuse: src/components/ui (shadcn), src/lib, any layout/sidebar/header components, any existing toast/notification setup, how React Query is set up (QueryClientProvider location).
3. List every file OUTSIDE src/pages/assessment that imports from src/pages/assessment, so we know what depends on the old code.
4. Look at the old QA scheduling/diary code (src/pages/QA) — read only — and summarise the scheduling approach, because CR-017 reuses it.
5. Look at how the old assessment checklists are written (the 44-item QAS Addendum Preliminary Checklist, the Instrument Validation checklist, the Site Visit execution form). Tell me where the wording lives so we can copy the TEXT into v2 mock data.
6. Propose the exact minimal router change (file + the lines) to mount v2 at /assessments-v2 without touching the old route.

Report your findings and a plan for Phase 0B. Wait for my approval.
```

## Phase 0B — Foundation

```
Read src/features/assessments-v2/CLAUDE.md, then docs/assessments-v2/progress.md, 01-process-flow.md, 02-change-register.md (Phase 0 items). Phase 0A findings were approved.

Build the foundation for Assessments v2:

1. The folder skeleton exactly as in CLAUDE.md, with an index.tsx that exports <AssessmentsV2Routes/> and a simple home page per portal. Then make the ONE approved router change to mount it at /assessments-v2 (lazy-loaded). Show me the diff of that file.
2. config/: roles (external: QP, SDP; internal: ASD, Assistant Director, Deputy Director, Director, Domain Director, Chief Director, IAC, CEO, Sub Domain Admin, Director & Team, Qualifications Development), process-stage teams (CR-015), nav per portal and role, labels.ts with every user-facing name from the naming table in CLAUDE.md (CR-006, PM-04), feature flags, and one constant for the approval-letter signer (default DD).
3. A role switcher in the v2 header (internal and external portals) like the old user dropdown. The active role drives nav/tab/action visibility. Include a "Reset demo data" action.
4. mock/api: in-memory store persisted to localStorage (keys prefixed assessmentsV2:, try/catch around every access), async functions, React Query hooks. Seed data: a few QPs, SDPs, qualifications (some SAQA-registered, some not), an approved QSA Addendum, enrolled learners per SDP with SOR status, SDP compliance statuses (some non-compliant), SA public holidays 2026-2027, a handful of staff per internal role (so "approver differs from submitter" can be shown with two ASDs and two DDs).
5. shared/workflow: the workflow engine described in CLAUDE.md (stages, role-gated actions, no self-approval CR-053, send-back and reject CR-056, manual re-route with mandatory audit note CR-055, audit entry on every action).
6. shared/checklist: ONE reusable evaluation-checklist component — items grouped in sections, Yes/No (or tick) per line, a MANDATORY comment per line before the checklist can be saved/submitted (CR-011), progress indicator, read-only mode, and support for a "pre-filled value with Confirm / Recapture" row (CR-021).
7. shared/letters: template-based letter generator for acknowledgement, outcome and approval letters from captured data, with an in-app preview and print view (CR-005, CR-013). No upload, no digital signature (a "signed by <role> on <date>" stamp is enough).
8. shared/audit and shared/notifications: audit trail view (filter by record) and in-app notifications + dashboard banners. No email/SMS.
9. mock/integrations: typed stubs (interfaces + a fake implementation returning canned data) for the backend-only items CR-001, 002, 009, 010, 020, 022, 037, 039 — e.g. saqaRegistryLookup, homeAffairsIdCheck, sorModuleValidation, autoChecklistValidation, aidbItemBank. NO screens for them.
10. Update progress.md.

Do not build any process module yet. When done: npm run build, npm run lint, then tell me what to click to see the shell, role switcher and a demo of the checklist component.
```

---

## Phase 1 — QSA Addendum

```
Read src/features/assessments-v2/CLAUDE.md, then docs/assessments-v2/progress.md, 01-process-flow.md (map 1) and 02-change-register.md (all Phase 1 items). Phase 0 is done.

Build modules/qsa-addendum with BOTH the external (QP) and internal (QCTO) sides:

EXTERNAL (QP)
- Dashboard of my QSA Addendum applications with status cards and a table.
- "New QSA Addendum application" form: Name of QP, Qualification Title, SAQA ID, Date Registered with SAQA, NQF Level, Credits, Submission Date, Notes. NO "Proposed EISA Date" (CR-003).
- SAQA gate check (via mock/integrations): SAQA-registered -> documents auto-attached; not registered -> QP uploads the 3 documents (SAQA Qualification Document, Curriculum Document, QSA Addendum). The gate check ONLY decides where documents come from; both outcomes continue into the same evaluation (CR-004). Do not create any EISA/FISA split.
- Submit to QCTO. See status and letters; respond when corrections are requested.

INTERNAL
- Acknowledgement letter: generated from the template on submission, previewed by the ASD, then reviewed by the DD. It STOPS at DD level (CR-005, CR-007).
- Evaluation: ASD completes the 44-item QSA Addendum Preliminary Checklist (copy the item wording from the old build into mock data) with a mandatory comment on every line (CR-011), then the evaluation report with findings and recommendation. The ASD also records the "approved EISA sittings per year" for the qualification (assumption for CR-030 — flag it in progress.md).
- DD review checklist (comment on every line). Corrections: DD returns to ASD, ASD returns to QP. No direct DD -> QP action exists anywhere (CR-012).
- IAC: reviews a summary presentation (simulated upload), then Approve / Decline / Send for remediation (CR-016). Remediation goes back down the chain.
- Two separate flows (CR-014): Flow 1 = evaluation approval (ASD -> DD -> IAC). Flow 2 = outcome letter: generated from template, viewed/printed, then the CEO only signs it (CR-008, CR-013). The CEO has no checklist and no evaluation step.
- Approval letter generated from template; signer comes from the config constant (default DD). Record the open question in progress.md.
- When approved, the QSA Addendum record becomes "Approved" and available to EISA Instrument Validation and the EISA Calendar.

Use shared/workflow for every transition (no self-approval, send-back/reject, audit entries) and shared/checklist everywhere. Use label constants (QP, not AQP).

Update progress.md. Then: npm run build, npm run lint, and give me a click-through script covering: the QP submitting a SAQA-registered application, one that is NOT registered, a full approval, an IAC decline and remediation, and proof that the CEO has no checklist and the DD cannot send anything straight to the QP or CEO.
```

## Phase 2 — EISA Instrument Validation

```
Read src/features/assessments-v2/CLAUDE.md, then docs/assessments-v2/progress.md, 01-process-flow.md (map 2) and 02-change-register.md (all Phase 2 items). Phases 0-1 are done.

Build modules/instrument-validation — a section SEPARATE from registration (CR-019), named "EISA Instrument Validation" (CR-018). SDP role must not see it at all.

- Entry: a QP can start a validation only for a qualification whose QSA Addendum is Approved.
- Joint scheduling (CR-017): the QP cannot schedule alone. ASD and QP agree a date/time/venue through a propose -> accept / counter-propose flow (reuse the approach you found in the QA scheduling code — read only, re-implement inside v2). Both sides see the agreed slot.
- Instrument upload by the QP (UI-only).
- ASD validation using shared/checklist with a mandatory comment on every line (CR-011). Fields pre-filled from the QSA Addendum (QP name, address, contact, qualification title, SAQA ID, credits, NQF level, date of upcoming EISA if known) each have Confirm or Recapture (CR-021).
- Outcome: Approved / Approved with conditions / Not approved. The outcome goes STRAIGHT to the QP — no Deputy Director step anywhere (CR-023). If changes are required the QP fixes and resubmits, and the ASD re-validates (loop).
- Completing validation only marks the instrument "Validated" on the qualification's record. It must NOT create or open an EISA registration (CR-024).
- Status dashboard for internal officials: all QSA Addendums and instrument validations with stage, owner team, dates, filters (CR-025). Note your reading of "QSA agenda" in progress.md.

Use shared/workflow and audit trail. Update progress.md, then npm run build, npm run lint and give me a click-through script (including the resubmission loop and proof that no registration is created and the SDP cannot see this section).
```

## Phase 3 — EISA Date & Calendar

```
Read src/features/assessments-v2/CLAUDE.md, then docs/assessments-v2/progress.md, 01-process-flow.md (section 8, EISA Date & Calendar) and 02-change-register.md (all Phase 3 items). Phases 0-2 are done.

Build modules/eisa-calendar as a STANDALONE module (its own nav item), not part of any other screen.

- Data model: EisaSitting per qualification with several sittings per year (CR-031): id, qualification, year, date, status (proposed / approved / rejected / published / postponed / cancelled), reason fields, audit.
- QP date-submission form in the system (CR-029) for qualifications with an Approved QSA Addendum. The number of dates must match that qualification's approved EISA frequency per year (CR-030) — block or warn clearly.
- Automatic checks (CR-032): reject dates on SA public holidays and weekends, and dates inside the minimum lead time. Put the lead time and the holiday list in config/ (assumption — flag as open question). QCTO also has a formal review: approve, or reject WITH a mandatory reason that goes back to the QP.
- Approved dates are published to the calendar (CR-028). QCTO can add / edit / delete sittings at any time (CR-027).
- Visual calendar (month view + list view) with status colours (CR-033), and in-app notification banners/alerts for approaching deadlines (CR-033). No email/SMS.
- Cancellation / postponement (CR-034): QCTO-initiated only, reason required, in-app notifications to the affected SDPs, full audit trail.
- Expose a typed function for other modules: list published sittings (used by registration, confirmation, site visits).
- Build a shared working-days helper (excluding weekends and the holiday list) — Phase 6 needs it for the 21-working-day SLA.

Update progress.md, npm run build, npm run lint, and give me a click-through script (QP proposes the wrong number of dates, a holiday date, a good set; QCTO approves, rejects with reason, publishes; QCTO postpones one and an SDP sees the notification).
```

## Phase 4 — EISA Registration & EISA Confirmation

```
Read src/features/assessments-v2/CLAUDE.md, then docs/assessments-v2/progress.md, 01-process-flow.md (map 6 and EISA Confirmation) and 02-change-register.md (all Phase 4 items, including PM-08). Phases 0-3 are done.

Build modules/eisa-registration and modules/eisa-confirmation as their own sections, separate from instrument validation (CR-019, CR-035).

EISA REGISTRATION
- SDP starts a registration for a PUBLISHED sitting from the EISA Calendar (not triggered by validation — CR-024).
- Learners are picked from a simulated "already enrolled" list (mock data owned by the QA domain), NOT uploaded in a spreadsheet (CR-036). Each learner gets an SOR upload (UI-only) and an RPL/ARPL indicator (CR-042).
- SDP compliance indicator (simulated QA status). A non-compliant SDP is visually blocked from submitting (CR-041).
- Block a learner who already has an active or concurrent EISA registration, with a clear message (CR-040).
- Category split: Trades / Non-Trades. Assistant Director processes: validates documentation, can flag an individual SOR as non-compliant with a reason, which notifies the SDP to correct and resubmit (CR-038), then creates the registration number. Non-Trades path additionally prepares files for the QP and shares the SDP list with QA (simulated) — PM-08; flag open questions.
- A registration record shows its learners, each learner's SOR and the supporting documents, synced (CR-035).
- An RPL/ARPL-flagged registration automatically creates a monitoring item in the (Phase 5) site-visits store — implement the creation call now through mock/api. This is the ONLY automatic trigger into site visits (CR-042, CR-044).
- Backend-only checks CR-037 and CR-039: call the stubs, no screens.

EISA CONFIRMATION (CR-043)
- When registration for a sitting is complete, QCTO generates a consolidated learner list per assessment centre. The QP views it and acknowledges, then confirms assessment centres, learner counts and marking/moderation dates (dates within the sitting). Use the name "EISA Confirmation" everywhere — never "EISA Notification". Confirmation does NOT create site visits.

Update progress.md, npm run build, npm run lint, and give me a click-through script (a clean registration, a non-compliant SDP, a duplicate learner, a flagged SOR corrected by the SDP, an RPL learner creating a monitoring item, and a full confirmation).
```

## Phase 5 — Site Visits & Monitoring hub

```
Read src/features/assessments-v2/CLAUDE.md, then docs/assessments-v2/progress.md, 01-process-flow.md (maps 7, 8, 9 and the Site Visits hub) and 02-change-register.md (all Phase 5 items, including PM-05, PM-06, PM-07). Phases 0-4 are done.

Build modules/site-visits as a STANDALONE hub (CR-044) — officials see and schedule ANY visit type independently of registration.

- Visit types: EISA Readiness (to confirm — PM-05), Marking & Moderation, RPL/ARPL Monitoring, Post-EISA Monitoring. Monitoring items from RPL/ARPL registrations (Phase 4) appear automatically; everything else is created by an official.
- Dashboard: counts and recent activity; "Reports Received" (not "Results Received"); no "Schedules Received" metric (CR-045). Build clean — no leftover tabs (CR-046).
- Scheduling in its OWN tab (CR-047). QPs only see their own visits and schedules (CR-047). A visit can be linked to a published EISA sitting, and the date/details auto-populate (CR-050). Notification type flag: Notified / Unannounced, with configurable lead time for notified visits (CR-051).
- Planning approval: Assistant Director plans -> DD recommends -> Domain Director approves -> Sub Domain Admin books (as in the old flow, but with the Deputy Director and Assistant Director as SEPARATE roles).
- Execution: a dynamic, visit-type-driven form (CR-048) — read the old site-visit execution form and the QCTO templates in the old code for field names; QP + qualification selectors at the top of every form (CR-049).
- Report approval (CR-053): the ASD/official who conducts the visit SUBMITS the report; their direct manager (DD) APPROVES. The same user can never do both. Approvers can send back for clarification or reject with a reason (CR-056). Manual re-routing with a mandatory audit note for workload sharing (CR-055).
- Cross-unit report visibility (CR-054): implement as a configurable rule table (default: own unit + approvers + QPs for their own visits); flag as open item.
- Post-EISA Monitoring: Facilitator and Learner Questionnaires only on this visit type and only after the related results are approved (CR-057, gated with Phase 6 data). The outcome-sharing step is renamed — use "Share Visit Outcome" as a placeholder and flag it (CR-058). PEM report is shared with QA, QP, Accreditation, SDP (simulated notifications) — PM-06. The "low competency rate" trigger and threshold are unconfirmed (PM-05/PM-06): make them config values and flag them.

Update progress.md, npm run build, npm run lint, and give me a click-through script covering each visit type, the self-approval block, send-back, reject, re-route with note, and QP visibility.
```

## Phase 6 — Approval of Results

```
Read src/features/assessments-v2/CLAUDE.md, then docs/assessments-v2/progress.md, 01-process-flow.md (map 10) and 02-change-register.md (all Phase 6 items). Phases 0-5 are done.

Build modules/approval-of-results — a new module named exactly "Approval of Results" (CR-060: do not reuse any old tab label for it).

- QP submits a results batch for a sitting. Show a 21-WORKING-DAY deadline counting from the sitting date, using the Phase 3 working-days helper, with countdown, "due soon" and "overdue" states (CR-059).
- QCTO evaluation: Assistant Director compliance review -> evidence evaluation -> folder-by-folder compliance checks (shared/checklist, comment on every line) -> Deputy Director -> Director -> Chief Director final approval. QCTO can approve or decline (decline needs a reason; QP is notified and can resubmit).
- Show the linked Marking & Moderation monitoring status for the sitting on the review screen (CR-052).
- On Chief Director approval, create a recommendation to the Certification domain (simulated record + visible status "Recommended to Certification") (CR-059 hand-off). The Certification domain itself is out of scope.
- Show the batch competency rate. If it is below a config threshold, offer to create a Post-EISA Monitoring visit in the Site Visits hub (trigger and threshold are unconfirmed — config value, flagged).
- Approved results unlock the PEM questionnaires in Phase 5 (CR-057).

Update progress.md, npm run build, npm run lint, and give me a click-through script (on-time and overdue submissions, a decline and resubmission, a full approval to recommendation, a low-competency batch creating a PEM visit).
```

## Phase 7 — FISA (and RPL Toolkit)

```
Read src/features/assessments-v2/CLAUDE.md, then docs/assessments-v2/progress.md, 01-process-flow.md (maps 3, 4, 5) and 02-change-register.md (all Phase 7 items: CR-026 and PM-01, PM-02, PM-03, PM-09, PM-10, PM-11). Phases 0-6 are done.

Build modules/fisa as a FULLY INDEPENDENT process for Skills Programmes (CR-026). It is never triggered by the SAQA gate check and shares nothing with the EISA flow except shared components.

Stages:
1. FISA Standards — Qualifications Development supplies the source documents; ASD evaluates; Deputy Director reviews; IAC; final sign-off by the Qualifications Development Director & Team (NOT the Assessments CEO) (PM-10).
2. Instrument development — the SDP develops/uploads the instrument against the approved FISA Standard.
3. FISA Instrument Validation — the SDP submits (PM-11); Assistant Director allocates to an ASD; ASD validates (shared/checklist, comment per line); the outcome goes STRAIGHT back to the SDP with no Deputy Director step (PM-01); the SDP fixes and resubmits if needed. Name it "FISA Instrument Validation" and the output "FISA Validation Report" (PM-02, PM-03).
4. FISA registration — SDP registers learners for a FISA sitting (a simplified version of EISA registration; reuse shared pieces).

RPL TOOLKIT EVALUATION (map 5): it is NOT in the change request register yet. Before building it, STOP and ask me whether to build it now. If yes, build modules/rpl-toolkit with the shared workflow and checklist (QP submits -> Assistant Director -> ASD -> Director & Deputy Director + team -> IAC -> CEO signs the outcome letter only), behind a feature flag, and flag it in progress.md as "pending a QCTO change request".

Update progress.md, npm run build, npm run lint, and give me a click-through script for the whole FISA track.
```

## Phase 8 — Hardening, check-off and swap preparation

```
Read src/features/assessments-v2/CLAUDE.md, then docs/assessments-v2/progress.md, 02-change-register.md and 06-swap-plan.md. Phases 0-7 are done.

1. REGISTER CHECK-OFF: go through EVERY item in 02-change-register.md (CR-001 to CR-060, the notes rows, and PM-01 to PM-11) and, in progress.md, mark each one Done / Partial / Stubbed / Not done with the file where it lives and a one-line proof of how to see it. Fix anything Partial or Not done that is in scope.
2. NAMING SWEEP: search src/features/assessments-v2 for banned labels (AQP, AIC, "EISA Notification" for the learner-list step, "Validation of EISA", "Validation of FISA", "Deputy & Assistant Director", "Results Received", "Schedules Received") and fix every one.
3. RULE AUDIT: prove in the code that (a) no route lets the DD send straight to the CEO or QP, (b) the CEO only signs the outcome letter, (c) nobody can approve their own item, (d) SDPs cannot see EISA Instrument Validation, (e) nothing auto-creates registrations or site visits except the RPL/ARPL flag. Add a short test script or checklist in docs/assessments-v2 for each.
4. UX pass: empty states, loading states, role guards on every route, consistent status badges, audit trail reachable from every record.
5. Write docs/assessments-v2/07-user-manual-v2.md — a new step-by-step demo manual (same style as the old user manual: portals, passwords, role switching, numbered steps) for the whole new flow, including the FISA track.
6. Confirm nothing outside src/features/assessments-v2 and docs/assessments-v2 changed except the one router line (git diff --stat against the branch it was created from).
7. Follow 06-swap-plan.md up to "ready to swap" and list the exact edits the swap will need. Do NOT perform the swap.
8. npm run build and npm run lint clean.
```
