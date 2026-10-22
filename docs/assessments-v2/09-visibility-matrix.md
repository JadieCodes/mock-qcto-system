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
| **QP** | See own (tiles for modules QP touches) | See own — view, respond to corrections (`qp-corrections`, CR-012) | See own — propose/accept/counter a slot, submit instrument, resubmit after "not approved" | See own batch-proposal status; See all for the published calendar itself (needs to see sitting dates to plan around them) — propose dates | **None** — "who's involved" names SDP + Assistant Director only `[ASSUMPTION]` | See own — acknowledge consolidated list, confirm centres/counts/dates | See own, view only — plus acknowledge outcome on Post-EISA Monitoring reports (`outcome-shared` stage) | See own — submit results batch, resubmit after decline | **None** — QP is not a party to any FISA workflow stage (confirmed: no FISA record type carries a `qpName` field) `[ASSUMPTION — not currently nav-hidden, see gap list]` | See own — respond to corrections, track evaluation |
| **SDP** | See own (tiles for modules SDP touches) | **None** — SDP is not in the "who's involved" line for QSA Addendum at all `[ASSUMPTION: nav-hide like CR-018]` | **None** (CR-018 — already enforced via `hiddenForRoles`) | See all published sittings, view only — no propose action (proposing is QP-only per the process map) | See own — build registration, pick enrolled learners, upload SOR | **None** — "who's involved" names "QCTO officials, QP" only | **None** — process-flow's own-visits line names only QP; code's `ExternalDashboard.tsx` already renders `NotApplicableView` for SDP here, so this one is already correct | **None** — code's `ExternalDashboard.tsx` already renders `NotApplicableView` for SDP here, already correct | See own — SDP is the FISA Instrument Validation and FISA Registration submitter | **None** — SDP is not in the RPL Toolkit "who's involved" line `[ASSUMPTION — not currently nav-hidden, see gap list]` |

### Table B — Internal portal

Rows: all 11 internal roles (`config/roles.ts`). Columns: every `INTERNAL_NAV` item, with the three modules that have internal sub-tabs noted under the table.

| Role | Dashboard | QSA Addendum | EISA Instrument Validation | EISA Calendar | EISA Registration | EISA Confirmation | Site Visits & Monitoring | Approval of Results | FISA | RPL Toolkit |
|---|---|---|---|---|---|---|---|---|---|---|
| **ASD** | See own team's tiles | See unit — evaluate, send to DD, return to QP, preview ack letter | See unit — validate instrument, schedule (`CALENDAR_REVIEWER_ROLE` doubles as scheduling party) | See unit — approve/reject proposed batch, publish, postpone/cancel (`CALENDAR_REVIEWER_ROLE`) | None (not on `registration` team) | None (not the generator role) | See unit — submit visit report (`REPORT_SUBMITTER_ROLE`) | None (not on `approval-of-results` team) | See unit — evaluate FISA Standards, validate FISA instruments | See unit — evaluate, send to DD, return to QP |
| **Assistant Director** | See own team's tiles | None | None | None | See unit — review, create registration number, resolve SOR flags (`REGISTRATION_PROCESSOR_ROLE`) | See unit — generates the confirmation record (`CONFIRMATION_GENERATOR_ROLE`) `[ASSUMPTION — EISA Confirmation has no team in PROCESS_STAGE_TEAMS, see Section 4]` | See unit — plan the visit (`PLANNER_ROLE`) | See unit — compliance/evidence/folder-checklist review, decline (`RESULTS_AD_ROLE`) | See unit — allocate FISA validation to an ASD, review FISA registration | See unit — allocate to an ASD (`ad-allocation`) |
| **Deputy Director** | See own team's tiles | See unit — review ack letter and evaluation, send to IAC or return to ASD (must differ from the ASD, CR-053) | None | None | None | None | See unit — recommend plan (`PLAN_RECOMMENDER_ROLE`); approve/send-back/reject/re-route report (`REPORT_APPROVER_ROLE`), must be a different person than the submitting ASD (CR-053) | See unit — review, decline (`RESULTS_DD_ROLE`) | See unit — review FISA Standards | See unit — review, send to Director & Team, return to ASD |
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
| EISA Registration | SDP (submitter) | `registration` | Assistant Director (`REGISTRATION_PROCESSOR_ROLE`) | `sdpName`; also carries a `qpName` copied from the originating sitting for traceability, but QP has no access right to the record (Section 1) |
| EISA Confirmation | Generated by Assistant Director, actioned by QP | *(no team defined — see Section 4 gap)* | None in-workflow; QP acknowledges then confirms | `qpName` field; also carries `sdpName` |
| Site Visit (planning) | Assistant Director (planner) | `site-visits` | Deputy Director (recommend) → Domain Director (approve) → Sub Domain Admin (books) | `qpName`; `sdpName` nullable |
| Site Visit Report | ASD (submitter) | `site-visits` | Deputy Director — must be a different person than the submitting ASD (CR-053); send-back/reject/re-route all land back with a Deputy Director (CR-055/056) | Same `qpName`/`sdpName` as the parent visit; QP sees it only once shared (`outcome-shared` stage) — CR-054's `REPORT_VISIBILITY_RULES` currently grants every site-visits-team role `scope: 'all'` and QP `scope: 'own-qp-visits'` |
| Results Batch | QP (submitter) | `approval-of-results` | Assistant Director → Deputy Director → Director → Chief Director | `qpName` field |
| FISA record (Standards / Validation / Registration) | Qualifications Development (Standards) or SDP (Validation, Registration) | `fisa` | Standards: ASD → Deputy Director → IAC → Qualifications Development Director & Team. Validation: Assistant Director (allocates) → ASD. Registration: Assistant Director | `sdpName` on Validation/Registration records; Standards records carry neither `qpName` nor `sdpName` (no external party) |
| RPL Toolkit record | QP (submitter) | `rpl-toolkit` | Assistant Director (allocates) → ASD → Deputy Director → Director & Team → IAC; outcome letter: CEO signs | `qpName` field |

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
| Sipho Ndlovu | ASD | `qsa-evaluation`, `instrument-validation`, `eisa-calendar`, `site-visits`, `fisa`, `rpl-toolkit` | QSA Addendum / Instrument Validation queue for Nomvula Dlamini's and Johan van der Merwe's qualifications | The "direct manager" pairing below; general ASD evaluation flows |
| Thandeka Zulu | ASD | same teams, different queue | Precious Mahlangu's qualifications | Second ASD, to prove one ASD's queue is unit-scoped, not global |
| Grace Mokoena | Deputy Director | `qsa-evaluation`, `site-visits`, `approval-of-results`, `fisa`, `rpl-toolkit` | Direct manager of **Sipho Ndlovu** | CR-053 — approver must be a different *person*, not just a different role label; re-route target when Grace is "unavailable" |
| Peter Botha | Deputy Director | same teams, different queue | Direct manager of **Thandeka Zulu** | CR-055 manual re-route demo: re-route a report from Grace's queue to Peter's |
| Lindiwe Khumalo | Assistant Director | `registration`, `site-visits`, `fisa`, `approval-of-results`, `rpl-toolkit` | EISA Registration queue for Khanya Skills Academy | Registration + site-visit-planning flows |
| Riaan Pretorius | Assistant Director | same teams, different queue | EISA Registration queue for Vuma Trade Centre | Second AD, non-compliant-SDP demo |
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
| 8 | EISA Confirmation has no process-stage team | `config/teams.ts` `PROCESS_STAGE_TEAMS` has 8 entries; "confirmation" isn't one of them, so which internal role(s) legitimately see it is undefined by the CR-015 data model | Either add a `confirmation` team, or confirm Assistant Director's generator role doubles as the visibility owner (Section 1's assumption) |
| 9 | All internal addendum/validation records visible to all internal roles | C-14 ("all users can see the lists of addendums and validations"), C-15 ("all internal users see the Instrument Validation section") | Same root cause as #2 |

## Section 5 — All assumptions, collected

1. SDP should be nav-hidden from **QSA Addendum**, the same way CR-018 hides it from Instrument Validation.
2. QP should be **None** on **EISA Registration** (not in the "who's involved" line).
3. QP should be **None** on **Site Visits** for SDP is *already* correctly built (`NotApplicableView`) — listed here only to confirm it's not a gap, not because it's guessed.
4. QP should be **None** on **FISA** entirely (no FISA record type carries a `qpName`), and should be nav-hidden there, not just functionally empty.
5. SDP should be **None** on **RPL Toolkit** and nav-hidden there.
6. CEO's QSA Addendum / RPL Toolkit internal view should be a filtered "awaiting my signature" queue, not the team's full list.
7. EISA Confirmation's internal owner/visibility role is Assistant Director (the generator role), since it has no CR-015 team of its own.
8. EISA Calendar's internal visibility stays ASD-only, including the Audit Trail tab, pending QCTO — no basis found to widen it.
9. Qualifications Development doing both the FISA source-document supply step and the final Director & Team sign-off is one role literal covering two distinct parties named in the process-flow doc — flagged, not changed.
10. QP demo identity is a named individual; SDP demo identity is an organisation (matches the existing `SDP_DIRECTORY` seed shape).
11. "See unit" is defined as "whole process-stage team" until Section 3's named users exist to subdivide it further — CR-054's real subdivision rule is still an open question for QCTO, not resolved here.
