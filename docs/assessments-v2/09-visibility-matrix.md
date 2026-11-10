# 09 — Role Visibility Matrix (draft for QCTO review)

**Status: draft.** This is Claude's first pass at the role-visibility rules, built from the "Who's involved" lines in `01-process-flow.md`, the `teams`/`allowedRoles` already in the code, and the gaps testers found (`08-test-findings.md` row 1 and row 2, and findings K-11, C-14, C-15, G-05, G-19, B-19, B-26). It is **not** built yet — Fix 1B will implement whatever comes out of this doc once you and QCTO correct it. Every place a rule was guessed rather than read directly off the register is tagged `[ASSUMPTION]`, and all of them are collected again in Section 5.

Visibility levels used in the tables below:
- **None** — module/record is not shown at all (nav item hidden, route blocked).
- **See own** — only records this person submitted, or that name them as the QP/SDP, or that are currently sitting at a stage this person's role acts in.
- **See unit** — every record touched by this person's **process-stage team** (CR-015). Today the code has no subdivision smaller than "the whole team," so until Section 3's named users exist, "See unit" and "the whole team's queue" are the same thing — CR-054 (cross-unit report visibility) is the one place QCTO has explicitly flagged this as needing a finer rule later.
- **See all [filtered]** — the one case here where a role legitimately needs a cross-team view, but only of a specific filtered slice, never the raw full list (CEO's signature queue).

## Section 1 — Per-portal visibility matrix

### Table A — External portal

Rows: the two external roles (`config/roles.ts`). Columns: every item in `EXTERNAL_NAV` (`config/nav.ts`).

| Role | Dashboard | QSA Addendum | EISA Instrument Validation | EISA Calendar | EISA Registration | EISA Confirmation | Site Visits & Monitoring | Approval of Results | FISA | RPL Toolkit |
|---|---|---|---|---|---|---|---|---|---|---|
| **QP** | See own (tiles for modules QP touches) | See own — view, respond to corrections (`qp-corrections`, CR-012) | See own — propose/accept/counter a slot, submit instrument, resubmit after "not approved" | See own batch-proposal status; See all for the published calendar itself (needs to see sitting dates to plan around them) — propose dates | **None** — "who's involved" names SDP + ASD (formerly "Assistant Director", 3.11) only `[ASSUMPTION]` | See own — acknowledge consolidated list, confirm centres/counts/dates | ~~See own, view only — plus acknowledge outcome on Post-EISA Monitoring reports (`outcome-shared` stage)~~ **None** — removed 28 Oct 2026, QCTO feedback 2.12 (see "Approved corrections") | See own — submit results batch, resubmit after decline | **None** — QP is not a party to any FISA workflow stage (confirmed: no FISA record type carries a `qpName` field) `[ASSUMPTION — not currently nav-hidden, see gap list]` | See own — respond to corrections, track evaluation |
| **SDP** | See own (tiles for modules SDP touches) | **None** — SDP is not in the "who's involved" line for QSA Addendum at all `[ASSUMPTION: nav-hide like CR-018]` | **None** (CR-018 — already enforced via `hiddenForRoles`) | See all published sittings, view only — no propose action (proposing is QP-only per the process map) | See own — build registration, pick enrolled learners, upload SOR | **None** — "who's involved" names "QCTO officials, QP" only | **None** — process-flow's own-visits line names only QP; code's `ExternalDashboard.tsx` already renders `NotApplicableView` for SDP here, so this one is already correct | **None** — code's `ExternalDashboard.tsx` already renders `NotApplicableView` for SDP here, already correct | See own — SDP is the FISA Instrument Validation and FISA Registration submitter | **None** — SDP is not in the RPL Toolkit "who's involved" line `[ASSUMPTION — not currently nav-hidden, see gap list]` |

### Table B — Internal portal

Rows: all 11 internal roles (`config/roles.ts`). Columns: every `INTERNAL_NAV` item, with the three modules that have internal sub-tabs noted under the table.

| Role | Dashboard | QSA Addendum | EISA Instrument Validation | EISA Calendar | EISA Registration | EISA Confirmation | Site Visits & Monitoring | Approval of Results | FISA | RPL Toolkit |
|---|---|---|---|---|---|---|---|---|---|---|
| **ASD** *(includes the former "Assistant Director" — QCTO feedback 3.11, see below)* | See own team's tiles | See unit — evaluate, send to DD, return to QP, preview ack letter | See unit — validate instrument, schedule (`CALENDAR_REVIEWER_ROLE` doubles as scheduling party) | See unit — approve/reject proposed batch, publish, postpone/cancel (`CALENDAR_REVIEWER_ROLE`) | See unit — review, create registration number, resolve SOR flags (`REGISTRATION_PROCESSOR_ROLE`) | See unit — generates the confirmation record (`CONFIRMATION_GENERATOR_ROLE`) `[ASSUMPTION — EISA Confirmation has no team in PROCESS_STAGE_TEAMS, see Section 4]` | See unit — plan the visit (`PLANNER_ROLE`) and submit the visit report (`REPORT_SUBMITTER_ROLE`) | See unit — compliance/evidence/folder-checklist review, decline (`RESULTS_AD_ROLE`) | See unit — evaluate FISA Standards, validate FISA instruments | See unit — evaluate, send to DD, return to QP |
| ~~**Assistant Director**~~ | *Merged into the ASD row above (QCTO feedback 3.11, 29 Oct 2026). Allocation moved to the Deputy Director.* | | | | | | | | | |
| **Deputy Director** | See own team's tiles | See unit — review ack letter and evaluation, send to IAC or return to ASD (must differ from the ASD, CR-053) | None | None | None | None | See unit — recommend plan (`PLAN_RECOMMENDER_ROLE`); approve/send-back/reject/re-route report (`REPORT_APPROVER_ROLE`), must be a different person than the submitting ASD (CR-053) | See unit — review, decline (`RESULTS_DD_ROLE`) | See unit — review FISA Standards; allocate FISA instruments to an ASD (`FISA_VALIDATION_ALLOCATOR_ROLE`, 3.11) | See unit — allocate to an ASD (`ad-allocation`, `RPL_ALLOCATOR_ROLE`, 3.11); review, send to Director & Team, return to ASD |
| **Director** | See own team's tiles | None | None | None | None | None | None | See unit — review, decline (`RESULTS_DIRECTOR_ROLE`) | None | None |
| **Domain Director** | See own team's tiles | None | None | None | None | None | See unit — approve the visit plan (`PLAN_APPROVER_ROLE`) | None | None | None |
| **Chief Director** | See own team's tiles | None | None | None | None | None | None | See unit — final approve/decline, triggers hand-off to Certification (`RESULTS_CHIEF_DIRECTOR_ROLE`) | None | None |
| **IAC** | See own team's tiles | See unit (records at `iac-review`) — approve, decline, send for remediation | None | None | None | None | None | None | See unit — review FISA Standards | See unit — approve, decline, send for remediation |
| **CEO** | See own team's tiles | **See all awaiting-my-signature only** (`ceo-signature` stage) — sign. Not the full applications list (fixes B-19) | None | None | None | None | None | None | **None** — FISA's final sign-off is Qualifications Development Director & Team, explicitly *not* the CEO (CLAUDE.md) | **See all awaiting-my-signature only** — sign, same B-19-style fix |
| **Sub Domain Admin** | See own team's tiles | None | None | None | None | None | See unit — book the visit only (`BOOKING_ROLE`); no report-approval rights | None | None | None |
| **Director & Team** | See own team's tiles | None | None | None | None | None | None | None | None | See unit — review, send to IAC, return to ASD (`director-team-review`) |
| **Qualifications Development** | See own team's tiles | None | None | None | None | None | None | None | See unit — supplies source documents (`qd-submission`) **and** gives final sign-off (`qd-signoff`, `FISA_STANDARD_SIGNOFF_ROLE`) — one role literal does both jobs in code, but the process-flow document distinguishes "Qualifications Development Domain" (supplier) from "the Qualifications Development Director & Team" (signer) `[ASSUMPTION — flagged as a possible future role split, not changing it now]` | None |

**Sub-tabs** (same access as the parent module row above, no separate rule found):
- **EISA Instrument Validation** → `Workspace` tab / `Status Dashboard` tab — both ASD-only, since ASD is the only internal role on the `instrument-validation` team (consistent with "no DD" rule, CR-018/CR-023).
- **EISA Calendar** → `Calendar` tab / `Audit Trail` tab — both ASD-only today. `[ASSUMPTION — an audit trail arguably has a case for broader oversight access, but nothing in the register supports widening it yet; leaving it ASD-only pending QCTO.]`
- **Site Visits & Monitoring** → `Dashboard` tab / `Scheduling` tab — same five-role set as the Site Visits column above for both tabs.

**Dashboard column note:** today `shared/ui/Dashboard.tsx` only filters tiles by `hiddenForRoles`, not by team — every internal role currently sees all 9 module tiles regardless of `teams`. The "See own team's tiles" cells above are the *target*; see Section 4 for the gap.

## Section 2 — Record-type visibility

| Record type | Owner | Owner's unit (CR-015 team) | Approvers (from `workflow.ts`) | Belongs to which QP/SDP, and by what key |
|---|---|---|---|---|
| QSA Addendum application | QP (submitter) | `qsa-evaluation` | ASD → Deputy Director → IAC; outcome letter: CEO signs | `qpName` field on the record (free-text string, no id) |
| EISA Instrument Validation record | QP (submitter) | `instrument-validation` | ASD only (no DD, CR-018/023) | `qpName` field |
| EISA sitting / calendar batch | QP (proposer) | `eisa-calendar` | ASD (as `CALENDAR_REVIEWER_ROLE`) | `qpName` field on the batch and on each published sitting |
| EISA Registration | SDP (submitter) | `registration` | ASD (`REGISTRATION_PROCESSOR_ROLE`; formerly "Assistant Director", 3.11) | `sdpName`; also carries a `qpName` copied from the originating sitting for traceability, but QP has no access right to the record (Section 1) |
| EISA Confirmation | Generated by the ASD (formerly "Assistant Director", 3.11), actioned by QP | *(no team defined — see Section 4 gap)* | None in-workflow; QP acknowledges then confirms | `qpName` field; also carries `sdpName` |
| Site Visit (planning) | ASD (planner; formerly "Assistant Director", 3.11) | `site-visits` | Deputy Director (recommend) → Domain Director (approve) → Sub Domain Admin (books) | `qpName`; `sdpName` nullable |
| Site Visit Report | ASD (submitter) | `site-visits` | Deputy Director — must be a different person than the submitting ASD (CR-053); send-back/reject/re-route all land back with a Deputy Director (CR-055/056) | Same `qpName`/`sdpName` as the parent visit; QP sees it only once shared (`outcome-shared` stage) — CR-054's `REPORT_VISIBILITY_RULES` currently grants every site-visits-team role `scope: 'all'` and QP `scope: 'own-qp-visits'` |
| Results Batch | QP (submitter) | `approval-of-results` | ASD → Deputy Director → Director → Chief Director (3.11) | `qpName` field |
| FISA record (Standards / Validation / Registration) | Qualifications Development (Standards) or SDP (Validation, Registration) | `fisa` | Standards: ASD → Deputy Director → IAC → Qualifications Development Director & Team. Validation: Deputy Director (allocates, 3.11) → ASD. Registration: removed (2.10) | `sdpName` on Validation/Registration records; Standards records carry neither `qpName` nor `sdpName` (no external party) |
| RPL Toolkit record | QP (submitter) | `rpl-toolkit` | Deputy Director (allocates, 3.11) → ASD → Deputy Director → Director & Team → IAC; outcome letter: CEO signs | `qpName` field |

## Section 3 — Proposed named demo users

Reusing the existing `SDP_DIRECTORY` seed (`mock/data/sdpDirectory.ts`) for continuity rather than inventing new SDPs. No `QP_DIRECTORY` exists yet, so QP names below are new. `[ASSUMPTION: QP demo identity = a named individual, not an organisation, since "Quality Partner" is an individual-assessor role in QCTO terms — unlike SDP, which is a training-provider organisation.]`

| Name | Role | Unit / team | Owns | Used to demo |
|---|---|---|---|---|
| Nomvula Dlamini | QP | — (external) | Electrical Trades qualifications | "my items" filtering; QP-only visibility everywhere QP is involved |
| Johan van der Merwe | QP | — (external) | Plumbing qualifications | A *second* QP, to prove QP-A never sees QP-B's records |
| Precious Mahlangu | QP | — (external) | Welding qualifications | FISA/RPL Toolkit QP-submitter flows |
| Khanya Skills Academy | SDP | — (external) | Learners enrolled under Electrical Trades (Nomvula Dlamini's qualifications) | SDP-only visibility; SDP never sees QP's QSA Addendum (fixes B-26 demo) |
| Vuma Trade Centre | SDP | — (external) | Learners enrolled under Plumbing — **seeded non-compliant** (CR-041) | SDP compliance block on EISA Registration |
| Lerato Training Institute | SDP | — (external) | Learners enrolled under Welding | A *second* compliant SDP, to prove SDP-A never sees SDP-B's records |
| Sipho Ndlovu | ASD | `qsa-evaluation`, `instrument-validation`, `eisa-calendar`, `registration`, `site-visits`, `approval-of-results`, `fisa`, `rpl-toolkit` (`registration` and `approval-of-results` added by 3.11) | QSA Addendum / Instrument Validation queue for Nomvula Dlamini's and Johan van der Merwe's qualifications | The "direct manager" pairing below; general ASD evaluation flows |
| Thandeka Zulu | ASD | same teams, different queue | Precious Mahlangu's qualifications | Second ASD, to prove one ASD's queue is unit-scoped, not global |
| Grace Mokoena | Deputy Director | `qsa-evaluation`, `site-visits`, `approval-of-results`, `fisa`, `rpl-toolkit` | Direct manager of **Sipho Ndlovu** | CR-053 — approver must be a different *person*, not just a different role label; re-route target when Grace is "unavailable" |
| Peter Botha | Deputy Director | same teams, different queue | Direct manager of **Thandeka Zulu** | CR-055 manual re-route demo: re-route a report from Grace's queue to Peter's |
| Lindiwe Khumalo | ASD (formerly Assistant Director, 3.11) | every ASD team (same as Sipho Ndlovu) | EISA Registration queue for Khanya Skills Academy | Registration + site-visit-planning flows |
| Riaan Pretorius | ASD (formerly Assistant Director, 3.11) | same teams, different queue | EISA Registration queue for Vuma Trade Centre | Fourth ASD, non-compliant-SDP demo |
| Zanele Mthembu | Director | `approval-of-results` | Results batches for Nomvula Dlamini's qualifications | Approval-of-results chain |
| Sarah Naidoo | Director | `approval-of-results` | Results batches for Precious Mahlangu's qualifications | Second Director |
| Michael van Wyk | Domain Director | `site-visits` | Visit-plan approvals, Electrical/Plumbing | Visit-planning approval step |
| Busisiwe Radebe | Chief Director | `approval-of-results` | Final results sign-off | Approval-of-results chain terminus |
| Thabiso Molefe | IAC (committee member) | `qsa-evaluation`, `rpl-toolkit`, `fisa` | — | IAC review step |
| Angela Fourie | CEO | `qsa-evaluation`, `rpl-toolkit` | — | B-19 fix demo: CEO's filtered signature queue vs the old full dump |
| Karabo Sithole | Sub Domain Admin | `site-visits` | Booking only | Shows booking-only rights (no report approval) |
| Elsabe Steyn | Director & Team member | `rpl-toolkit` | — | RPL Toolkit review step |
| Fundiswa Ngcobo | Qualifications Development | `fisa` | — | FISA Standards supply *and* sign-off (same role, two stages — see Section 1 flag) |

## Section 4 — Where the current code does not enforce these rules

| # | Rule | Not enforced at (file:line) | What's missing |
|---|---|---|---|
| 1 | No per-person identity | `actorName = roleDescriptor(role)?.label ?? role` in `approval-of-results/internal/ResultsBatchWorkspace.tsx:106,196,258`, `fisa/internal/ValidationWorkspace.tsx:20`, `site-visits/internal/VisitWorkspace.tsx:87`, and the same pattern in every other internal workspace component; `shared/workflow/engine.ts:47`'s `requiresDifferentActor` check only compares role labels (the code's own comment at `site-visits/api.ts:230` admits every Deputy Director shares one label) | A named-user concept (Section 3) wired into the role switcher so `actorName` is a person, not a role label — needed for CR-053 to mean "a different person," not "a different role" |
| 2 | No list/record filtering by team or ownership anywhere | No `canView`/`getVisibleRecords`/ownership-filter utility exists in `shared/`. Every internal module's list view queries the full mock-api collection with no role/team predicate. Confirmed by K-11 ("in internal every role can see everything") | A shared visibility-filter helper, read by every module's list query, keyed off `ROLE_DESCRIPTORS[].teams` (internal) and the record's `qpName`/`sdpName` (external) |
| 3 | SDP sees QSA Addendum | B-26 — no `hiddenForRoles: ['SDP']` on the `qsa-addendum` nav item (`config/nav.ts:14`), unlike `instrument-validation` which already has this for CR-018 | Extend the CR-018 `hiddenForRoles` pattern to `qsa-addendum`, `approval-of-results` (already correctly `NotApplicableView`'d, but not nav-hidden), `eisa-confirmation`, and `rpl-toolkit` for SDP; and to `eisa-registration`, `fisa`, `rpl-toolkit` for QP |
| 4 | CEO sees a full list, not a signature queue | B-19 — `qsa-addendum`/`rpl-toolkit` internal dashboards show the CEO the same full list every other team role sees; no "awaiting my signature" filter exists anywhere in those modules' internal views | A CEO-specific filtered view scoped to `ceo-signature` stage records only |
| 5 | External QP/SDP pick records "by qualification," not by identity | G-05 ("I see separate qualifications to choose from but not a selection from a QP name"), G-19 ("on the externals side you can only see visits per qualification selection") | Same root cause as #2 — there's no identity-keyed filter, so pickers fall back to qualification as a proxy |
| 6 | CR-054 cross-unit report visibility not enforced beyond QP-only-own-visits | `site-visits/config.ts:47` `REPORT_VISIBILITY_RULES` gives every site-visits-team role `scope: 'all'` — a rule table exists but isn't subdivided further, and `progress.md` flags it as not wired into any UI filter | The real per-unit subdivision, once QCTO decides it and Section 3's named users exist to subdivide "unit" below "whole team" |
| 7 | Dashboard tiles not filtered by team | `shared/ui/Dashboard.tsx:10` filters only by `hiddenForRoles`, never by `ROLE_DESCRIPTORS[].teams` — every internal role sees all 9 module tiles | Filter the tile list by whether the active role's `teams` intersects the module's process-stage team |
| 8 | EISA Confirmation has no process-stage team | `config/teams.ts` `PROCESS_STAGE_TEAMS` has 8 entries; "confirmation" isn't one of them, so which internal role(s) legitimately see it is undefined by the CR-015 data model | Either add a `confirmation` team, or confirm the ASD's generator role (formerly "Assistant Director", 3.11) doubles as the visibility owner (Section 1's assumption) |
| 9 | All internal addendum/validation records visible to all internal roles | C-14 ("all users can see the lists of addendums and validations"), C-15 ("all internal users see the Instrument Validation section") | Same root cause as #2 |

## Section 5 — All assumptions, collected

1. SDP should be nav-hidden from **QSA Addendum**, the same way CR-018 hides it from Instrument Validation.
2. QP should be **None** on **EISA Registration** (not in the "who's involved" line).
3. QP should be **None** on **Site Visits** for SDP is *already* correctly built (`NotApplicableView`) — listed here only to confirm it's not a gap, not because it's guessed.
4. QP should be **None** on **FISA** entirely (no FISA record type carries a `qpName`), and should be nav-hidden there, not just functionally empty.
5. SDP should be **None** on **RPL Toolkit** and nav-hidden there.
6. CEO's QSA Addendum / RPL Toolkit internal view should be a filtered "awaiting my signature" queue, not the team's full list.
7. EISA Confirmation's internal owner/visibility role is the ASD (the generator role; formerly "Assistant Director", 3.11), since it has no CR-015 team of its own.
8. EISA Calendar's internal visibility stays ASD-only, including the Audit Trail tab, pending QCTO — no basis found to widen it.
9. Qualifications Development doing both the FISA source-document supply step and the final Director & Team sign-off is one role literal covering two distinct parties named in the process-flow doc — flagged, not changed.
10. QP demo identity is a named individual; SDP demo identity is an organisation (matches the existing `SDP_DIRECTORY` seed shape).
11. "See unit" is defined as "whole process-stage team" until Section 3's named users exist to subdivide it further — CR-054's real subdivision rule is still an open question for QCTO, not resolved here.

## Approved corrections

QCTO's corrections to the draft above, as given to the developer. These override the sections they touch; everything else in this doc stands as written.

1. **SDP is None on Site Visits**, confirmed. The SDP picker is removed from visit planning.
2. **"See unit" = the whole process-stage team's records**, with a "My items / All in my team" switch.
3. **Records link to a QP or SDP by stable id (`qpId`/`sdpId`), not by free-text name.**
4. Assumption 3 (Section 5) should read: *"SDP is None on Site Visits; already correct in the code."*
5. All other assumptions (Section 5) are **approved as written**.
6. ~~The EISA Instrument Validation status dashboard **stays ASD-only**. CR-025 ("should other officials get a read-only status dashboard?") remains an **open question for QCTO**.~~ **Replaced on 28 Oct 2026 by QCTO feedback 2.2** (see below).
7. **QP is None on Site Visits too** — external Site Visits is removed for every external role (28 Oct 2026, QCTO feedback 2.12; see below). This replaces the QP-sees-own-visits rule in Table A.

### QCTO feedback 2.2 — status view for all system users (28 Oct 2026, replaces correction 6)

QCTO: "The information regarding the QASA status and approved instruments needs to be available for viewing by all system users." This answers CR-025's open question and replaces correction 6. Where it differs from the original change request (CR-025 limited the dashboard to internal officials), QCTO's feedback wins.

- **Who:** every role on both portals — QP and SDP (external); ASD, Deputy Director, Director, Domain Director, Chief Director, IAC, CEO, Sub Domain Admin, Director Office and Qualifications Development (internal). `[ASSUMPTION]` "All system users" includes SDPs, who get the same status-only view.
- **Where:** its own menu item, "QASA Status and Approved Instruments" (path `qasa-status`), right after EISA Instrument Validation on both portals. Granted in one place: `MODULES_VISIBLE_TO_ALL_ROLES` in `src/features/assessments-v2/shared/visibility/config.ts`, read by `isModuleVisible()`. No role is special-cased in the screen.
- **What it shows (read-only):**
  - *QASA status* — qualification, SAQA ID (added with 29.5), QP, and a plain-language current status (Under evaluation · Remediation requested from the QP · Under review · Under quality assurance (added with 2.1) · Awaiting IAC decision · Approved by the IAC — feedback letter awaiting CEO signature · Approved · Approved — under review). Batch K removed "Declined" and the approval-letter statuses.
  - *Approved instruments* — EISA instrument validations whose outcome is Approved or Approved with conditions: qualification, SAQA ID (added with 29.5), validation date, and the conditions (or "None").
- **What it never shows:** documents, checklists, evaluations, letters, comments/notes other than validation conditions, audit trail, or any link or button into a QASA or validation record. The view's api (`modules/qasa-status/api.ts`) returns only those columns.
- **Unchanged:** every role's access to every other module, including QASA itself. SDPs still cannot open the QASA or EISA Instrument Validation modules or records (Table A). The ASD's own "Status Dashboard" tab inside EISA Instrument Validation stays as it was (an ASD working list of every validation, in progress or not).

### QCTO feedback 3.8 — FISA Standards status for Qualifications Development (4 Nov 2026)

- **Who:** the Qualifications Development role only (internal). Granted in one place: `INTERNAL_MODULE_ROLE_OVERRIDE['fisa-status'] = ['Qualifications Development']` in `src/features/assessments-v2/shared/visibility/config.ts`, read by `isModuleVisible()`.
- **Where:** its own internal menu item, "FISA Standards Status" (path `fisa-status`), right after FISA.
- **What it shows (read-only):** every FISA Standard, with its Skills Programme, current stage and status. No documents, checklists, evaluation reports, notes, audit trail, actions, or links into a record.
- **Unchanged:** every role's access to the FISA module itself (Table B), including Qualifications Development's own FISA access.

### QCTO feedback 2.1 — QASA Director Office stage (answered 29 Oct 2026, built 4 Nov 2026)

- **Director Office** (`'Director & Team'`): now also **See unit** on QASA (team `qsa-evaluation` added in `config/roles.ts`). Acts at `director-office-review` only: approve for tabling, or return to the DD with a comment. Must not be the ASD or DD of the same QASA.
- **Deputy Director:** moderates (`dd-review`) and also records the IAC outcome (`iac-review`): Approved or Remediation requested (Batch K, 05.7: no Declined), with a comment and optional committee minutes.
- **IAC:** still **See unit** on QASA, but view only — it no longer acts. This replaces the IAC cell in Table B for QASA.
- **Section 2, QASA approvers:** ASD → Deputy Director → Director Office → Deputy Director (records the IAC outcome); feedback letter: CEO signs.

### QCTO feedback 2.9 — FISA Standards on the QASA route (answered 29 Oct 2026, built 4 Nov 2026)

- **Director Office:** now **See unit** on FISA (team `fisa`). Acts at `director-office-review` on FISA Standards only. Must not be the ASD or DD of the same Standard.
- **Deputy Director:** moderates and records the IAC outcome on FISA Standards.
- **CEO:** now on FISA (team `fisa`), replacing Table B's "None": "My items" is the FISA Standard outcome letters awaiting signature (approved or declined by the IAC); "All in my team" shows every FISA record, view only. This replaces the "FISA's final sign-off is Qualifications Development, never the CEO" note.
- **IAC:** view only on FISA Standards.
- **Qualifications Development:** creates the Standard and gets it back on remediation; no longer signs off. Its read-only "FISA Standards Status" (3.8) is unchanged.
- **Section 2, FISA Standards approvers:** ASD → Deputy Director → Director Office → Deputy Director (records the IAC outcome) → CEO signs the outcome letter.

### QCTO feedback 2.12 — external Site Visits removed (28 Oct 2026, replaces the QP-sees-own-visits rule)

QCTO: "Visits are scheduled by QCTO. This section should not be here." This replaces CR-047's original rule ("QPs see only their own relevant visits") and the QP cell for **Site Visits & Monitoring** in Table A, which read *"See own, view only — plus acknowledge outcome on Post-EISA Monitoring reports (`outcome-shared` stage)"*. The QP cell is now **None**, the same as the SDP cell (correction 1).

- **Who:** no external role. QP and SDP are both **None** on Site Visits & Monitoring. Set in one place: `EXTERNAL_MODULE_HIDDEN_FOR_ROLE['site-visits'] = ['SDP', 'QP']` in `src/features/assessments-v2/shared/visibility/config.ts`, read by `isModuleVisible()`. That one rule removes the menu item, the Dashboard line and the route (the external `site-visits` address shows the same "not available for your role" screen as every other hidden module). No role is special-cased in a screen. The external screens stay in `modules/site-visits/external/` but are no longer reachable.
- **QP acknowledgement:** the QP's "Acknowledge outcome" step lived only on the external screen. `[DEFAULT — to be confirmed with QCTO]` When the Deputy Director shares a visit outcome, the QP named on the visit (if there is one) gets an in-app notification, and the visit is completed (closed) at once, with its own audit entry. RPL/ARPL visits have no QP (QCTO feedback 2.7), so they complete with no QP notification.
- **Unchanged:** every internal role's access to Site Visits (Table B). The internal Approval of Results screen still shows the linked Marking & Moderation status and report (CR-052). `REPORT_VISIBILITY_RULES` in `site-visits/config.ts` still has its QP row (`own-qp-visits`), but no screen a QP can open reads it any more.

### Shared visit outcomes and visit domains (answered 29 Oct 2026, built 4 Nov 2026 — Batch G)

This replaces the QP acknowledgement default in the 2.12 section above (the QP no longer hears about every completed visit). Table A's Site Visits & Monitoring cell stays **None** for the QP and the SDP.

- **New external page "Visit Outcomes"** (path `visit-outcomes`), **QP: See own, read only** — only the visits QCTO chose to share with this QP (`qpId`): visit type, visit date, outcome summary and the shared visit report file name(s). No acknowledgement, no scheduling, no link into a visit. **SDP: None** (`EXTERNAL_MODULE_HIDDEN_FOR_ROLE['visit-outcomes'] = ['SDP']`). Not on the internal portal. It is a separate page: the external Site Visits menu item and route stay removed and blocked for the QP.
- **Who shares (internal):** the Deputy Director (`STAKEHOLDER_SHARE_ROLE` in `modules/site-visits/config.ts`), per visit, once the report is submitted or approved; default not shared. Sharing notifies the QP and writes an audit entry. Visits without a QP (RPL/ARPL, special meetings) cannot be shared. `[ASSUMPTION]` the DD decides, since the DD reviews the report; sharing is per visit.
- **"Complete Visit"** (formerly "Share Visit Outcome") only completes the visit and no longer notifies the QP.
- **Visit Domain (2.5):** every visit carries a Domain (default Assessment). **No role's access changed** — Table B's Site Visits & Monitoring column stands as written. `[OPEN]` which roles outside Assessment may plan or run visits for the other domains.
- **Section 2, Site Visit Report:** "QP sees it only once shared (`outcome-shared` stage)" now reads: the QP sees the visit type, date, outcome summary and report file, on Visit Outcomes, only while the visit is shared with them.

### Batch V1 — remediation on Site Visits (change request doc v14, row 05.14; built 9 Nov 2026)

Table A's Site Visits & Monitoring cell stays **None** for the QP and the SDP. The QP's only Site Visits action is on the **Visit Outcomes** page.

- **QP, Visit Outcomes: See own, read only — plus respond to remediation on their own visit.** When the Deputy Director chooses **Approved with remediation** on a visit that names this QP (`qpId`), the visit appears on Visit Outcomes **without the share Yes/No** (the report and items are shared automatically, and the share cannot be switched off afterwards). The QP sees the status, the qualifications, the remediation items and the history of rounds, and while the status is "Approved with remediation — awaiting QP" can **upload evidence** (empty files refused), **add a response** (required) and click **Submit remediation**. The api checks that the actor is the QP named on the visit (`actorId === visit.qpId`); another QP and the ASD are refused. The QP still has no scheduling, no checklist, no audit trail and no acknowledgement. `[ASSUMPTION]` a response needs text; evidence is optional.
- **Deputy Director:** chooses **Approved (final)** or **Approved with remediation** (items required) on a submitted report (self-approval check unchanged), then reviews a submitted remediation: **Approved (final)** or **Further remediation needed** (items required). Complete Visit only after Approved (final).
- **ASD:** for a visit with **no QP** (RPL/ARPL at an SDP or assessment centre) the ASD **records the stakeholder's response and evidence on the visit** until a later batch gives SDPs their own view; the SDP role still has no Site Visits access (it only receives an in-app notification, as for Post-EISA Monitoring). For a visit with a QP the ASD cannot respond.
- **SDP:** unchanged — None on Site Visits and on Visit Outcomes. `[OPEN]` the SDP's own remediation view is for a later batch.
- **Notifications:** the QP when remediation is requested (each round); the ASD instead for a visit without a QP; the DD when remediation is submitted.
- **Several qualifications (05.13):** Visit Outcomes also lists every qualification of the shared visit with its EISA date. No role's access changed.

### QCTO feedback 3.11 — "ASD" and "Assistant Director" are one role (answered 29 Oct 2026, built 4 Nov 2026)

QCTO: "ASD" and "Assistant Director" are the same role, and the DD allocates work to the ASDs. This replaces the separate ASD and Assistant Director rows in Table B (see the merged ASD row) and the Assistant Director entries in Sections 2 and 3.

- **One role:** `'ASD'`, screen label "ASD". The `'Assistant Director'` role key is gone from `types/index.ts` and `config/roles.ts`. "Director Office" (the `'Director & Team'` role) is unchanged.
- **ASD teams** (union of both former rows): `qsa-evaluation`, `instrument-validation`, `eisa-calendar`, `registration`, `site-visits`, `approval-of-results`, `fisa`, `rpl-toolkit`. So every ASD now also sees Learner EISA Registration, EISA Confirmation (`INTERNAL_MODULE_ROLE_OVERRIDE['eisa-confirmation'] = ['ASD']`) and Approval of Results. The former Assistant Directors now also see QASA, EISA Instrument Validation and the EISA Calendar.
- **People:** Lindiwe Khumalo and Riaan Pretorius are ASDs and keep their ids (`lindiwe-khumalo`, `riaan-pretorius`), so a saved person selection and every seeded record that names them still work. The ASD person list is Sipho Ndlovu, Thandeka Zulu, Lindiwe Khumalo, Riaan Pretorius (Sipho stays the default).
- **Stages taken over by the ASD (same stages, same order, stage ids unchanged):** Learner EISA Registration review (`ad-review`), EISA Confirmation generation, Site Visits planning (`ad-planning`), Approval of Results first review (`ad-review`).
- **Allocation goes to the Deputy Director:** FISA Instrument Validation (`awaiting-allocation`, `FISA_VALIDATION_ALLOCATOR_ROLE`) and RPL Toolkit (`ad-allocation`, `RPL_ALLOCATOR_ROLE`). The DD only allocates; the FISA outcome still goes straight from the ASD to the SDP (PM-01).
- **No approval step lost:** in no workflow did an Assistant Director approval feed straight into an ASD approval. Every different-person check compares person ids (`requiresDifferentActor`, `hasActedInRoles`) and is unchanged.

### QCTO feedback 2.4 — EISA Calendar permissions and requests (answered 29 Oct 2026, built 4 Nov 2026)

This replaces the EISA Calendar cells in Table A (QP) and Table B (ASD, Deputy Director, Director, CEO), and the "EISA Calendar stays ASD-only" assumption (Section 5, item 8).

- **QP (external):** proposes dates, edits their own unpublished proposals, corrects and resubmits a rejected batch. Cannot publish, postpone or cancel. Can raise a **postponement or cancellation request** on their own published sittings, and sees the status of their own requests under "My requests" (filtered by `qpId`). Month/List View still show the whole published calendar.
- **ASD:** reviews, approves, rejects and publishes proposals; adds special sittings; updates or deletes **unpublished** sittings only. No longer postpones or cancels. Sees the Requests list (view only).
- **Deputy Director:** now **See unit** on the EISA Calendar. Recommends every request (first step) and can raise one on any published sitting.
- **Director:** now **See unit** on the EISA Calendar. Decides postponement requests; recommends cancellation requests (second step).
- **CEO:** now **See unit** on the EISA Calendar. Decides cancellation requests (last step).
- **Granted in one place:** `INTERNAL_MODULE_ROLE_OVERRIDE['eisa-calendar'] = ['ASD', 'Deputy Director', 'Director', 'CEO']` in `src/features/assessments-v2/shared/visibility/config.ts`, read by `isModuleVisible()`.
- **Different person:** nobody acts twice on the same request — the person who raises or recommends it can never decide it (person ids, `changeRequests.ts` `hasActedOnRequest()`).
- **Section 2 addition — EISA sitting change request:** owner = the QP or DD who raised it; unit `eisa-calendar`; approvers: postponement DD → Director; cancellation DD → Director → CEO; belongs to the sitting's QP by `qpId`.
- **SDP:** unchanged (published, postponed and cancelled sittings, view only; notified when a sitting is postponed or cancelled).

### QCTO feedback 3.14 — FISA results in Approval of Results (answered 29 Oct 2026, built 5 Nov 2026)

QCTO: Approval of Results covers EISA and FISA. EISA is centralised (the QP submits); FISA is decentralised (no QP — the SDP conducts the assessment and submits the results). This replaces the SDP's **None** for Approval of Results in Table A.

- **Tabs:** Approval of Results has an "EISA" tab and a "FISA" tab on both portals.
- **SDP (external): See own, FISA tab only** — creates and submits FISA results batches for an Approved FISA Standard, resubmits after a decline, downloads the approval letter and verification report of its approved batches. Only its own batches (`sdpId`). Granted in `src/features/assessments-v2/shared/visibility/config.ts`: `'approval-of-results'` is no longer in `EXTERNAL_MODULE_HIDDEN_FOR_ROLE` for the SDP, and `APPROVAL_OF_RESULTS_EXTERNAL_TABS.SDP = ['fisa']`. `[ASSUMPTION]` the SDP sees the FISA tab only.
- **QP (external): unchanged, EISA tab only** (`APPROVAL_OF_RESULTS_EXTERNAL_TABS.QP = ['eisa']`), plus the two downloads on approved batches. The QP stays **None** on FISA.
- **Internal:** every role that already sees Approval of Results (ASD, Deputy Director, Director, Chief Director) sees both tabs and acts on FISA batches at the same stages as on EISA batches. A FISA batch the SDP has not submitted is not shown internally.
- **Section 2 addition — FISA results batch:** owner = the SDP (submitter); unit `approval-of-results`; approvers ASD → Deputy Director → Director → Chief Director (the same as an EISA batch, `[ASSUMPTION]`); belongs to the SDP by `sdpId`. On final approval the approval letter is generated and sent to the SDP, and the batch is recommended to Certification (simulated). No Post-EISA Monitoring visit.

### QCTO feedback Batch K — QASA corrections from the 5 Nov review (built 6 Nov 2026)

- **QP (external), 05.8 — Progress instead of the audit trail:** on the QP's QASA detail the Audit Trail tab is replaced by **Progress**: Submitted → ASD evaluation → Deputy Director moderation → Director Office → IAC → CEO signature → Approved, or Remediation requested. The current stage is highlighted with the date it entered that stage. It shows **no names and no internal comments**; the only comment shown is the remediation comment the QP must act on (the ASD's negative-evaluation note or the IAC's remediation comment). A QASA under review shows "Approved — under review" and the date the review started, but not the DD's reason. Built in `src/features/assessments-v2/modules/qsa-addendum/progress.ts` and `components/QpProgress.tsx`.
- **QP letters, 05.5/05.6:** the QP sees two letters: the acknowledgement letter (from the moment of submission) and the CEO-signed feedback letter (once signed — it is the approval). The Approval Letter tab is gone.
- **Internal:** the internal Audit Trail tab is unchanged and still shows names, roles and notes for every role that can open a QASA. The internal Approval Letter tab is gone.
- **Deputy Director, 05.2:** may **Start review** on an approved QASA (reason required). `[ASSUMPTION]` the DD starts reviews (`QASA_REVIEW_STARTER_ROLE`). An approved QASA is not counted in the DD's "My items" just because a review could be started.
- **ASD:** no longer acts on the acknowledgement letter (05.5) or drafts/sends an approval letter (05.6). Sees the DD's review reason on the Evaluation tab when a review sends a QASA back.
- **CEO:** "My items" lists only IAC-approved QASAs awaiting signature (05.7).
- **Status page, 29.5:** SAQA ID next to the qualification title in both tables, for every role on both portals. Still no names other than the QP, no comments and no links into records.
- **Section 2, QASA approvers:** unchanged route (ASD → Deputy Director → Director Office → Deputy Director records the IAC outcome; CEO signs the feedback letter). No acknowledgement or approval-letter approvers any more. A review uses the same route.

### Batch N1 — Outcome Letters, final decline and Sent to Certification (change request doc v14, rows 29.27, 05.19, 29.30, 05.20, 05.16; built 9 Nov 2026)

- **QP (EISA) and SDP (FISA), external:** see the **Outcome Letter** of their own batch once it has a final decision (approval or decline), the verification code, the verification report, and their own documents. They never see the **Certification recommendation letter**, the "Sent to Certification" list, the Deputy Director's or Director's decline recommendations, or a DRAFT Outcome Letter. After "Request more evidence" they see the reason and the Resubmit button; after a final decline there is no Resubmit.
- **Internal (ASD, Deputy Director, Director, Chief Director):** see the Outcome Letter (a DRAFT from the Deputy Director stage onwards), the Certification recommendation letter of an approved batch, and the new **Sent to Certification** tab in Approval of Results (internal only; no external role has it). Every QCTO stage can **Request more evidence**; the Deputy Director and the Director can **Recommend decline** while sending the batch on; **only the Chief Director** can **Decline results** (final, with irregularities and corrective actions).
- **Documents card (`documentsForPortal`):** the recommendation letters are `internalOnly` in `batchDocuments.ts`; the external card filters them out.
- **Section 2 — results batch / FISA results batch:** unchanged owner and approvers. New stages: `more-evidence` (the QP/SDP may act: resubmit) and a final `declined` (nobody may act).
