# 10 — Audit of the 38 QCTO feedback items against the current code

Read-only audit, 27 Oct 2026, branch `assessments-v2`. Source items: `10-qcto-feedback-items.md`. Code checked: `src/features/assessments-v2/`. Nothing in the code was changed.

## The one finding that explains most of the feedback

After **Reset demo data** (`mock/api/storage.ts:22`), the **only seeded workflow records are the six FISA Standards** (`mock/data/fisaStandardsSeed.ts`, read at `modules/fisa/api.ts:33`). Every other module reads `readStore(KEY, [])`, so it starts empty: QSA Addendum, EISA Instrument Validation, EISA Calendar (batches and sittings), EISA Registration, EISA Confirmation, Site Visits, Approval of Results, FISA Instrument Validation, FISA Registration, RPL Toolkit, notifications and the audit log. The reference data (named users, QP/SDP directories, enrolled learners, checklists) is seeded.

The EISA chain is also gated from the top:
- An EISA date needs an approved QSA Addendum (`eisa-calendar/api.ts:36-66`).
- A registration needs a published sitting.
- A confirmation needs a completed registration.
- A results batch needs a confirmed confirmation.

So a first-time reviewer has to take one QSA Addendum through ASD → DD → IAC → CEO → ASD draft → DD sign before **any** EISA module after it can hold data. That is why QCTO reported "no content" for QASA, Confirmations, Approval of Results and FISA instruments, even though those screens are built.

Path convention below: routes are relative to the v2 mount (`/assessments-v2/{internal|external}/…`), and files are relative to `src/features/assessments-v2/`.

## Item table

| Ref | Exists today? | Where (menu label → route → file) | Which roles can reach it | First-time reviewer after Reset, nothing created | Work needed | Size |
|---|---|---|---|---|---|---|
| 1.5 | Yes - visible | Internal: QSA Addendum → `qsa-addendum` → `modules/qsa-addendum/internal/InternalDashboard.tsx:54`; EISA Instrument Validation → `instrument-validation/internal/InternalDashboard.tsx:51`; EISA Calendar → `eisa-calendar/internal/InternalCalendarView.tsx:50`; EISA Registration → `eisa-registration/internal/InternalDashboard.tsx:89`; RPL Toolkit → `rpl-toolkit/internal/InternalDashboard.tsx:61`; plus the "Owner Team" column (`instrument-validation/internal/StatusDashboard.tsx:105`, from `config/teams.ts:5-12`) and "Teams: …" on the dashboard (`shared/ui/Dashboard.tsx:30`) | Headings: every role on that module's team (ASD for QSA/IV/Calendar; AD for Registration; AD/ASD/DD/Director & Team/IAC/CEO for RPL). Dashboard "Teams:" line: every internal role | Headings show above empty lists | Words | S |
| 1.7 | Yes - visible | Internal: EISA Instrument Validation → `instrument-validation` → `modules/instrument-validation/internal/InternalDashboard.tsx:52` (page description) | ASD only (only role on the `instrument-validation` team) | Statement shows above an empty "Validations" list | Words | S |
| 1.13 | Yes - visible | External: EISA Confirmation → `eisa-confirmation` → `modules/eisa-confirmation/external/ExternalDashboard.tsx:23-24`; same sentence internally at `eisa-confirmation/internal/InternalDashboard.tsx:28-29` | External: QP. Internal: Assistant Director | Statement shows above "No confirmations yet" | Words | S |
| 3.1 | Yes - visible | "QSA" is used across the whole UI: `config/labels.ts:5`, `config/nav.ts:16,31`, `config/teams.ts:5`, and about 38 lines in 21 `.tsx` files (e.g. `qsa-addendum/external/ExternalDashboard.tsx:33-51`, `eisa-calendar/external/QpCalendarView.tsx:39`, `instrument-validation/internal/StatusDashboard.tsx:89`). Note: module `CLAUDE.md` currently says to use "QSA Addendum" and never "QASA", so that rule has to be updated too | All roles on both portals | Visible straight away in the nav for everyone | Words | M |
| 3.2 | Yes - visible | External: QSA Addendum → `qsa-addendum` → `qsa-addendum/external/ExternalDashboard.tsx:33-51` ("My QSA Addendum Applications", "New QSA Addendum Application", "No applications yet"), `external/NewApplicationForm.tsx:137`; internal `internal/InternalDashboard.tsx:57,70,72` | QP (external); ASD, DD, IAC, CEO (internal) | Shows straight away (heading, button, empty state) | Words | S |
| 3.9 | Partly | Internal: FISA → `fisa` → Standards checklist `mock/data/fisaStandardChecklistItems.ts` (already says "Skills Programme" and "source documents"); FISA Instrument Validation checklist reuses the EISA one (`fisa/api.ts:1,224`, `mock/data/instrumentValidationChecklistItems.ts`). Neither file contains the words "qualification document" | ASD (evaluates), DD, IAC, Qualifications Development (read-only) | Checklist is visible on the seeded "Bricklaying" standard (ASD stage) | Words | S |
| 3.11 | Yes - visible | Internal: RPL Toolkit → `rpl-toolkit` → `rpl-toolkit/workflow.ts:10-14,36-37,114`; `internal/InternalDashboard.tsx:73-76` (tiles "With Assistant Director" / "With ASD" / "With Director & Team"); `internal/ApplicationWorkspace.tsx:51,126,208,210`; role label at `config/roles.ts:38` | AD, ASD, DD, Director & Team, IAC, CEO | Tiles and heading are visible; every count is 0 | Words ("Director Office") + Flow change (merging AD into ASD changes the allocation stage) | M |
| 3.12 | Yes - visible | Internal: RPL Toolkit → `rpl-toolkit` → `rpl-toolkit/internal/InternalDashboard.tsx:65` | Every RPL team role except CEO | Shows straight away under the heading | Words | S |
| 1.6 | Yes - hard to find | Internal: EISA Instrument Validation → tab "Status Dashboard" → `instrument-validation/internal/StatusDashboard.tsx:83-92` (filter: All types / QSA Addendum / EISA Instrument Validation) | ASD only | Empty table ("No records match these filters") | Small logic | S |
| 2.6 | Yes - visible | Internal: Site Visits & Monitoring → "Plan a New Visit" → `site-visits/internal/NewVisitDialog.tsx:122-160` (sitting link and qualification are shown for every visit type, including EISA Readiness) | Planner = Assistant Director (`site-visits/config.ts:5`); any site-visits team role can open the dialog | Dialog opens; the sitting drop-down holds only "Not linked" because no sittings exist | Small logic | S |
| 2.7 | Yes - visible | Same dialog `NewVisitDialog.tsx:142-160` (QP is required for every type; no SDP/AC picker); data model `site-visits/types.ts:15-24` is keyed on `qpId`; auto-created RPL visits come from `site-visits/api.ts` `buildAutoCreatedVisit()` | Assistant Director, ASD, DD, Domain Director, Sub Domain Admin | Dialog only; no RPL visits exist | Small logic (form, model and external QP filter all assume a QP) | M |
| 2.10 | Yes - visible | Internal: FISA → tab "FISA Registration" → `fisa/internal/InternalDashboard.tsx:89,184`; External: FISA → tab "FISA Registration" → `fisa/external/ExternalDashboard.tsx:42`; workflow `fisa/workflow.ts:193-204` | Internal: Assistant Director acts; ASD/DD/IAC/QD can view the tab. External: SDP | Empty tab with "Registrations submitted by an SDP will appear here." | Small logic (remove tab, dialogs, workflow, api) | S |
| 2.11 | Yes - visible | External: EISA Instrument Validation → "Start Validation" → `instrument-validation/external/NewValidationDialog.tsx:57-58` (text); limit enforced at `instrument-validation/api.ts:65-70` | QP | The dialog shows the statement as soon as it opens, because nothing is eligible | Small logic | S |
| 2.12 | Yes - visible | External: Site Visits & Monitoring → `site-visits` → `site-visits/external/ExternalDashboard.tsx`, `VisitDetail.tsx` (QP acknowledges a shared outcome there); hidden only for SDP at `shared/visibility/config.ts:11` | QP | "No visits for … yet." | Flow change (the QP acknowledgement step `qp-acknowledge-outcome` loses its screen) | M |
| 3.6 | Yes - visible | `site-visits/internal/NewVisitDialog.tsx:162-173` (read-only "SDP" line), `internal/VisitWorkspace.tsx:130-137` (editable SDP field on Details); readiness checklist mentions the SDP at `mock/data/eisaReadinessVisitSections.ts:13,21,22` | Site-visits team roles | Visible in the dialog only | Small logic + Words | S |
| 1.8 | Yes - visible | External: EISA Calendar → `eisa-calendar` → `eisa-calendar/external/QpCalendarView.tsx:39`, `ProposeDatesForm.tsx:78,97`; internal `AddEditSittingDialog.tsx:91`; rule at `eisa-calendar/api.ts:36-66` (the sitting count also comes from the QSA's `approvedEisaSittingsPerYear`) | QP (propose), ASD (add directly) | Proposing is impossible: "No qualifications with an Approved QSA Addendum yet — approve one first." | Flow change (needs a mock "qualifications with accredited SDPs" source and a new source for the sittings-per-year count) | M |
| 1.9 | Yes - but empty on first load | Internal: EISA Calendar → tab "List View" → `eisa-calendar/components/SittingListView.tsx:67-100` (Postpone, Cancel, Edit, Delete); `internal/PostponeSittingDialog.tsx` | ASD only (`CALENDAR_REVIEWER_ROLE`, `eisa-calendar/config.ts:6`) | "No sittings to show yet." The buttons only appear once a sitting exists | None (seed data only) | S |
| 2.3 | Partly | `eisa-calendar/components/SittingListView.tsx:42` (columns: Date, Qualification title, QP, Year, Status). No qualification ID/SAQA ID, closing date or SDP count | ASD (internal), QP and SDP (external, read-only) | Empty list | Small logic | S |
| 3.5 | No | No closing-date field on `EisaSitting` and no rule in `eisa-registration/api.ts` `startRegistration()` | — | — | Small logic (calculated field shown on both portals, plus a registration cut-off) | M |
| 1.1 | Partly | External: EISA Registration → `eisa-registration` → `eisa-registration/external/ExternalDashboard.tsx`, `NewRegistrationDialog.tsx`, `RegistrationDetail.tsx`; internal `eisa-registration/internal/InternalDashboard.tsx`. Learners are registered against a published sitting, but there is no closing date and the label does not say "Learner" | External: SDP only (hidden for QP, `shared/visibility/config.ts:9`). Internal: Assistant Director | SDP: empty list; the new-registration dialog says "No published sittings yet". Internal: "No registrations yet" | Words + Small logic (closing date, seed data) | M |
| 1.2 | Yes - but empty on first load | Internal and External: Approval of Results → `approval-of-results` → `approval-of-results/external/ExternalDashboard.tsx`, `SubmitResultsBatchDialog.tsx`, `internal/ResultsBatchWorkspace.tsx`; Certification hand-off at `approval-of-results/api.ts:268-282` | External: QP (SDP gets "Not applicable"). Internal: AD, DD, Director, Chief Director | QP: "Nothing awaiting submission." / "No batches submitted yet." Internal: empty table and empty activity. Nothing can be submitted until the whole chain above it has been run | Small logic (seed records at each stage) | M |
| 1.3 | Yes - but empty on first load | Internal: QSA Addendum → `qsa-addendum` → `qsa-addendum/internal/InternalDashboard.tsx`, `ApplicationWorkspace.tsx` (Details / Acknowledgement / Evaluation / Outcome / Approval Letter / Audit Trail) | ASD, DD, IAC, CEO | "No applications yet — Applications submitted by a QP in the external portal will appear here." | Small logic (seed records at each stage) | M |
| 1.10 | Yes - but empty on first load | External: EISA Confirmation → `eisa-confirmation` → `eisa-confirmation/external/ExternalDashboard.tsx` (one list, no tabs), `ConfirmationDetail.tsx` | QP | "No confirmations yet." No tabs at all | Small logic (seed) + Words (say what the section is for); tabs only if QCTO wants them | M |
| 1.11 | Yes - but empty on first load | Internal: FISA → tab "FISA Instrument Validation" → `fisa/internal/InternalDashboard.tsx:138-177`, `ValidationWorkspace.tsx` | Assistant Director (allocates), ASD (validates); DD/IAC/QD can view the tab | "No FISA instruments yet." Only the Standards tab is seeded | Small logic (seed) | S |
| 2.2 | Partly | Status view exists only inside EISA Instrument Validation → tab "Status Dashboard" (`instrument-validation/internal/StatusDashboard.tsx`), and stays ASD-only per `09-visibility-matrix.md` "Approved corrections" item 6 | ASD only | Empty | New screen (a shared status view every role can reach, on both portals) | M |
| 1.4 | Yes - but empty on first load | Internal: QSA Addendum → record → tab "Outcome Letter" → `qsa-addendum/workflow.ts:107-114` (`OUTCOME_WORKFLOW`, CEO "Sign outcome letter" after the IAC decision), `internal/ApplicationWorkspace.tsx:~460-486`; CEO queue at `internal/InternalDashboard.tsx:39-41`. It is called the "outcome letter", not the "feedback letter" | CEO (signs); ASD/DD/IAC (view) | CEO sees "No applications yet" (queue filtered to `ceo-signature`) | Words (rename to feedback letter) + seed | S |
| 1.12 | Partly | Internal: Site Visits → record → tab "Execution & Report" → `site-visits/internal/VisitWorkspace.tsx:380-494`, `components/ExecutionForm.tsx` (checklist, notes, Submit Report, DD approve, send back, re-route, reject, share outcome). There is **no file upload** for reports or attendance registers | ASD submits, DD reviews | No visits, so the tab is never reached; once a visit exists the tab says "Not yet available — the visit must be booked first" until it has been through 4 planning stages | Small logic (UI-only upload, same pattern as other modules) | S |
| 2.1 | No | `qsa-addendum/workflow.ts:45-102` `EVAL_WORKFLOW` is ASD → DD → IAC; there is no Director's office stage. The visibility config has no Director role on `qsa-evaluation` (`config/roles.ts:32`) | — | — | Flow change | M |
| 2.9 | Partly | `fisa/workflow.ts:8-89` `FISA_STANDARD_WORKFLOW`: QD submission → ASD → DD → IAC → **QD sign-off**. There is no Director "quality assure / approve for tabling" stage, and the final step is QD, not IAC | QD, ASD, DD, IAC | Seeded: one record at each stage (6 records) | Flow change | M |
| 3.3 | No | QSA record has no components, weights or validity period (`qsa-addendum/types.ts`); only `approvedEisaSittingsPerYear` is captured. There is no Certification hand-off for QSA (the only hand-off is for results, `approval-of-results/api.ts:268`) | — | — | Small logic + new fields (simulated hand-off) | M |
| 3.8 | Partly | The Qualifications Development role is on the `fisa` team (`config/roles.ts:39`), so it can open the whole FISA module and see the Standards statuses. There is no read-only "status view" built for that domain | Qualifications Development | Sees the seeded Standards it is acting on (Road Transport, Plumbing) under "My items" | Small logic (read-only status list, or "All in my team" as default) | S |
| 3.10 | No | `mock/data/fisaStandardChecklistItems.ts` was built fresh (its own header comment says so) | — | — | Words (new checklist content; blocked until QCTO supplies the manual checklist) | M |
| 2.4 | Partly | External: EISA Calendar → `eisa-calendar/external/QpCalendarView.tsx` (propose dates, correct and resubmit a rejected batch, Month/List view of every QP's published sittings). Nothing on screen states what a QP may or may not do | QP | "No sitting date submissions yet." and the propose form is blocked (see 1.8) | Small logic (after QCTO confirms the permissions) | M |
| 3.4 | No | No Excel/CSV import anywhere in the folder (searched for `excel`, `xlsx`, `csv`, `bulk`: no matches) | — | — | New screen | L |
| 2.5 | No | `site-visits/types.ts:5` `VisitType` has only 4 types; Site Visits is an Assessments-only module | — | — | New screen + Flow change (new types, cross-domain use) | L |
| 2.8 | Yes - hard to find | Internal: Approval of Results → record → Details tab → `approval-of-results/internal/ResultsBatchWorkspace.tsx:164-176` ("Create Post-EISA Monitoring Visit" button on an approved batch below the threshold; it does not fire on its own); `approval-of-results/api.ts` `createPemVisitForBatch()` | AD, DD, Director, Chief Director | Not reachable: no batches exist | Words (remove "PM-06 — trigger and threshold unconfirmed") + seed; Small logic only if QCTO wants it automatic | S |
| 3.7 | Partly | Marking & Moderation visit type with its checklist `mock/data/siteVisitFormSections.ts` (has script-marking items 1.1, 1.11, 2.4, 3.1-3.4, but no "verification of marked and moderated scripts" step); SDP field at `NewVisitDialog.tsx:162-173` and `VisitWorkspace.tsx:130-137` | Site-visits team roles | Not reachable: no visits | Small logic + Words (checklist section, remove SDP) | M |
| 3.13 | No | External: RPL Toolkit → New Submission → `rpl-toolkit/external/NewApplicationForm.tsx`. The form has title, type, description, date and notes, but **no file picker** (the only "Upload" is the icon on the Submit button, line 156) | QP | "No submissions yet" | Small logic (UI-only upload) | S |

## List 1 — Role model

### Places where "Assistant Director" and "ASD" are treated as different roles

- **Role definitions:** `types/index.ts:23` (`Role` union lists both); `config/roles.ts:11-24` gives them different teams (ASD: qsa-evaluation, instrument-validation, eisa-calendar, site-visits, fisa, rpl-toolkit; Assistant Director: registration, site-visits, fisa, approval-of-results, rpl-toolkit); `mock/data/users.ts:23-24` (Lindiwe Khumalo and Riaan Pretorius as Assistant Director, separate from the ASD people).
- **Visibility:** `shared/visibility/config.ts:19-28` maps modules to teams, so the ASD cannot see EISA Registration or Approval of Results, and the Assistant Director cannot see QSA Addendum, EISA Instrument Validation or EISA Calendar. `shared/visibility/config.ts:34` makes EISA Confirmation Assistant Director-only.
- **EISA Registration:** `eisa-registration/config.ts:3` `REGISTRATION_PROCESSOR_ROLE = 'Assistant Director'`; workflow `ad-review` stage; `eisa-registration/api.ts:236,281,321,351,396,445`; tile "With Assistant Director" `internal/InternalDashboard.tsx:101`; description `:91`.
- **EISA Confirmation:** `eisa-confirmation/config.ts:5` `CONFIRMATION_GENERATOR_ROLE = 'Assistant Director'`; `eisa-confirmation/api.ts:169`.
- **Site Visits:** `site-visits/config.ts:5` `PLANNER_ROLE = 'Assistant Director'` versus `:14` `REPORT_SUBMITTER_ROLE = 'ASD'`. The Assistant Director plans the visit and the ASD executes it.
- **Approval of Results:** `approval-of-results/config.ts:5` `RESULTS_AD_ROLE = 'Assistant Director'`; `approval-of-results/api.ts:132,221`; page description `internal/InternalDashboard.tsx:81`.
- **FISA:** `fisa/workflow.ts:141` (Assistant Director allocates) → `:142` (ASD validates); `:197` FISA Registration `ad-review`; `fisa/config.ts:11` `FISA_VALIDATION_ALLOCATOR_ROLE`; `fisa/api.ts:521`.
- **RPL Toolkit:** `rpl-toolkit/workflow.ts:10` (Assistant Director allocates) → `:11` (ASD evaluates); `internal/InternalDashboard.tsx:73-74` (separate tiles); `internal/ApplicationWorkspace.tsx:51,126`.
- **Docs:** `09-visibility-matrix.md` Table B, which has separate rows for ASD and Assistant Director.

### User-visible headings or labels that say "Team"

- `qsa-addendum/internal/InternalDashboard.tsx:54`: "QSA Addendum — QSA Evaluation Team"
- `instrument-validation/internal/InternalDashboard.tsx:51`: "EISA Instrument Validation — Instrument Validation Team"
- `eisa-calendar/internal/InternalCalendarView.tsx:50`: "EISA Calendar — EISA Calendar Team"
- `eisa-registration/internal/InternalDashboard.tsx:89`: "EISA Registration — Registration Team"
- `rpl-toolkit/internal/InternalDashboard.tsx:61`: "RPL Toolkit Evaluation — RPL Toolkit Team"
- `instrument-validation/internal/StatusDashboard.tsx:105`: column "Owner Team"; values from `config/teams.ts:5-12` via `:46,55`
- `shared/ui/Dashboard.tsx:30`: "Teams: qsa-evaluation, instrument-validation, …" (shows the raw team ids)
- `shared/ui/ScopeToggle.tsx:27`: "All in my team" (shown on all 9 internal dashboards)
- "Director & Team" as a role and stage name:
  - `config/roles.ts:38` (role switcher label)
  - `rpl-toolkit/workflow.ts:14,37,114`
  - `rpl-toolkit/internal/InternalDashboard.tsx:76`
  - `rpl-toolkit/internal/ApplicationWorkspace.tsx:208` ("Director & Team Moderation") and `:210` ("Team-level moderation …")
- `fisa/workflow.ts:15`: stage "Qualifications Development Director & Team sign-off" (shown as the stage label)

## List 2 — On-screen developer notes and system explanations

Only text a user can see (JSX text, props such as `description`, `title` and `placeholder`, and status labels). Code comments are not listed.

| File:line | Visible text |
|---|---|
| `modules/rpl-toolkit/internal/InternalDashboard.tsx:65` | "PM-09 — not in the change request register yet. Open one to act on it — …" |
| `modules/instrument-validation/internal/InternalDashboard.tsx:52` | "… — a separate section from EISA Registration; SDPs cannot see this section." |
| `modules/instrument-validation/external/NewValidationDialog.tsx:57-58` | "… and each addendum can only have one validation." |
| `modules/eisa-confirmation/external/ExternalDashboard.tsx:23-24` | "… RPL monitoring items in Site Visits come from the registration, not from Confirmation." |
| `modules/eisa-confirmation/internal/InternalDashboard.tsx:28-29` | Same sentence, internal side |
| `modules/eisa-registration/internal/InternalDashboard.tsx:91-92` | "… — a separate section from EISA Instrument Validation, split here by category." |
| `modules/eisa-registration/internal/InternalDashboard.tsx:29` | "Registrations submitted by an SDP will appear here." (EISA, internal) |
| `modules/fisa/internal/InternalDashboard.tsx:184` | "Registrations submitted by an SDP will appear here." (the FISA one QCTO quoted) |
| `modules/fisa/internal/InternalDashboard.tsx:79` | "A fully independent process. Never triggered by the SAQA gate check; shares nothing with EISA except shared components." |
| `modules/fisa/external/ExternalDashboard.tsx:35` | "Independent of EISA/QSA Addendum. …" |
| `modules/site-visits/internal/InternalDashboard.tsx:98` | "A standalone hub (CR-044) for … — an RPL/ARPL monitoring item is created automatically from a registration, never from EISA Confirmation." |
| `modules/site-visits/external/ExternalDashboard.tsx:27` | "… An RPL/ARPL monitoring item here comes automatically from your registration, not from EISA Confirmation." |
| `modules/site-visits/internal/NewVisitDialog.tsx:137` | "CR-050: QP, qualification and date were auto-populated from the sitting." |
| `modules/site-visits/components/ExecutionForm.tsx:144-145` | "CR-057: only shown on Post-EISA Monitoring, … Phase 6 (Approval of Results) does not exist yet — simulated here." (the Phase 6 part depends on `RESULTS_APPROVAL_IS_SIMULATED`) |
| `modules/site-visits/components/ExecutionForm.tsx:151` | Toggle label "Simulate: results approved" |
| `modules/eisa-calendar/internal/AddEditSittingDialog.tsx:38` | "CR-027 — QCTO can add, edit or delete calendar sittings at any time." |
| `modules/approval-of-results/internal/InternalDashboard.tsx:81` | "… Assistant Director → Deputy Director → Director → Chief Director (CR-059)." |
| `modules/approval-of-results/external/ExternalDashboard.tsx:29` | "Submit your exam results batch within 21 working days of the sitting (CR-059)." |
| `modules/approval-of-results/internal/ResultsBatchWorkspace.tsx:167-168` | "… (PM-06 — trigger and threshold unconfirmed with QCTO)." |
| `modules/approval-of-results/internal/ResultsBatchWorkspace.tsx:182` | Section heading "Marking & Moderation Monitoring Status (CR-052)" |
| `modules/approval-of-results/internal/ResultsBatchWorkspace.tsx:201` | "Report details are restricted for your role (CR-054 — still open with QCTO)." |
| `modules/rpl-toolkit/internal/ApplicationWorkspace.tsx:210` | "Team-level moderation before the IAC (Ask QCTO — confirm the order of moderation, IAC endorsement and CEO signature)." |
| `modules/eisa-registration/external/NewRegistrationDialog.tsx:93` | "… is not compliant (simulated QA status) …" |
| `modules/fisa/external/RegistrationDetail.tsx:67` | "… Assurance domain's learner enrolment (simulated data for this build)." |
| `modules/qsa-addendum/external/NewApplicationForm.tsx:206` | "Simulate whether the qualification is registered with SAQA. …" (a demo control, not a note, but it does explain the system) |
| `qsa-addendum/external/NewApplicationForm.tsx:154`, `rpl-toolkit/external/NewApplicationForm.tsx:86`, `eisa-registration/external/NewRegistrationDialog.tsx:86`, `fisa/external/NewRegistrationDialog.tsx:71`, `fisa/external/NewValidationDialog.tsx:63` | "Submitting/Registering/Developing as the acting … — switch person in the header to … as someone else." (demo instructions) |
| `shared/ui/DemoBanner.tsx:9` | "Demo — mock data only. Nothing here is saved to a real backend." (probably fine to keep) |

Not visible today (checked): the `config/nav.ts:25` PM-09 comment is a code comment only, and the "Phase N" badges in `shared/ui/AssessmentsV2Layout.tsx:131-133` and `shared/ui/Dashboard.tsx:47` only render when a nav item has `comingInPhase`, which none have.

## List 3 — Tabs and pages that are empty on first load (after Reset, nothing created)

Default internal list scope is "My items". The "All in my team" switch is noted where it changes the result.

**Dashboard (both portals):** never empty. It shows the "Acting as" card and the module list.

**QSA Addendum:**
- Internal: ASD, DD, IAC and CEO all see an empty "Applications" list and 0 on every tile (CEO: empty "Awaiting Your Signature").
- External: QP sees an empty list. SDP has no access.

**EISA Instrument Validation:**
- Internal: ASD sees an empty "My Queue" tab and an empty "Status Dashboard" tab.
- External: QP sees an empty list, and the "Start Validation" dialog says nothing is eligible.

**EISA Calendar:**
- Internal: ASD sees empty Proposals, Month View, List View and Audit Trail tabs.
- External QP: My Submissions, Month and List are empty, and Propose is blocked (no approved QSA).
- External SDP: calendar view (`SdpCalendarView.tsx`) is empty.

**EISA Registration:**
- Internal: Assistant Director sees empty Trades and Non-Trades tabs, with 0 on every tile.
- External: SDP sees an empty list, and the new-registration dialog says "No published sittings yet". QP has no access.

**EISA Confirmation:**
- Internal: Assistant Director sees an empty "Ready to Confirm" list and an empty "All Confirmations" list.
- External: QP sees an empty list.

**Site Visits & Monitoring:**
- Internal (Assistant Director, ASD, DD, Domain Director, Sub Domain Admin): Dashboard tiles are all 0 and Recent Activity is empty; the Scheduling tab, the All Visits tab and all 4 visit-type sub-tabs are empty.
- External: QP sees "No visits for … yet". SDP has no access (shown a "Not applicable" card).

**Approval of Results:**
- Internal (AD, DD, Director, Chief Director): "All Results Batches" table and Recent Activity are empty.
- External: QP sees "Awaiting Submission" and "My Submitted Batches" both empty. SDP gets "Not applicable".

**FISA:**
- Internal, Standards tab (**seeded, 6 records**). Under "My items":
  - QD sees Road Transport (qd-submission) and Plumbing (qd-signoff).
  - ASD Sipho sees Bricklaying (ASD stage) and Carpentry (he submitted it).
  - DD Grace sees Carpentry and Welding.
  - IAC sees Welding.
  - Assistant Director sees **nothing**: no Standards stage belongs to that role.
  - The approved Electrical standard appears only under "All in my team", or for Ayesha Patel.
- Internal: the FISA Instrument Validation and FISA Registration tabs are empty for every role.
- External SDP: both tabs are empty. "Start Instrument Development" works, because the Electrical standard is approved. QP has no access.

**RPL Toolkit:**
- Internal (AD, ASD, DD, Director & Team, IAC): "Submissions" list is empty and all 6 tiles show 0. CEO: empty signature queue.
- External: QP sees an empty list. SDP has no access.

## Counts per verdict

| Verdict | Count | Refs |
|---|---|---|
| Yes - visible | 14 | 1.5, 1.7, 1.13, 3.1, 3.2, 3.11, 3.12, 2.6, 2.7, 2.10, 2.11, 2.12, 3.6, 1.8 |
| Yes - hard to find | 2 | 1.6, 2.8 |
| Yes - but empty on first load | 6 | 1.9, 1.2, 1.3, 1.10, 1.11, 1.4 |
| Partly | 9 | 3.9, 2.3, 1.1, 2.2, 1.12, 2.9, 3.8, 2.4, 3.7 |
| No | 7 | 3.5, 2.1, 3.3, 3.10, 3.4, 2.5, 3.13 |
| **Total** | **38** | |

Work needed (each item counted once, by its main need):

| Work needed | Count | Refs |
|---|---|---|
| None | 1 | 1.9 |
| Words | 10 | 1.5, 1.7, 1.13, 3.1, 3.2, 3.9, 3.12, 1.4, 2.8, 3.10 |
| Small logic | 19 | 1.6, 2.6, 2.7, 2.10, 2.11, 3.6, 2.3, 3.5, 1.1, 1.2, 1.3, 1.10, 1.11, 1.12, 3.3, 3.8, 2.4, 3.7, 3.13 |
| New screen | 3 | 2.2, 3.4, 2.5 |
| Flow change | 5 | 3.11, 2.12, 1.8, 2.1, 2.9 |

Sizes: S 19 · M 17 · L 2.

Six items (1.2, 1.3, 1.10, 1.11, 1.9 and 1.4) mainly need **seed data**. One seeding task, records at every stage of every module, would clear most of the "no content" feedback at once.

## The three items I am least sure about

1. **3.9 (FISA checklist "qualification documents").** I could not find "qualification document" anywhere in the FISA screens or checklists. The FISA Standards checklist already says "Skills Programme" and "source documents", and the FISA Instrument Validation checklist (reused from EISA) does not mention qualifications. QCTO may have been looking at the QSA checklist, an older build, or the FISA Standard "source documents" wording. This needs a screenshot or the exact wording from QCTO before anyone changes text.
2. **1.1 (Learner EISA Registration "missing").** The SDP-side EISA Registration module does register learners against a published sitting, so I marked it "Partly", not "No". QCTO may expect a different actor (a QP or learner-led registration), a module named "Learner EISA Registration", or the closing-date rule (3.5). They may also have missed it because it is SDP-only and empty until the whole chain above it has run. If QCTO means a different flow, this becomes a New screen / L.
3. **2.12 (remove Site Visits from the external side).** Hiding it is a one-line visibility change. But the QP's "acknowledge shared outcome" step (`qp-acknowledge-outcome`, `site-visits/external/VisitDetail.tsx`) lives only on that screen, and CR-058 / PM-07 rely on the outcome reaching the QP. Whether that step moves elsewhere (a notification only, or the Approval of Results screen) or is dropped is a decision for QCTO. That decision is what decides the size (S to M).
