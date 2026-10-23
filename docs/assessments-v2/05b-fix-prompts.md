# Assessments v2 — fix prompts (round 1, after the Phase 7 test)

Same method as 05-build-prompts.md. Paste ONE prompt at a time, in order. These come BEFORE Phase 8.

**Before every fix**
1. `git branch --show-current` must say `assessments-v2`, and `git status` should be clean (commit the last fix first).
2. `/clear` to start a fresh session.
3. Fix 1A runs in plan mode (Shift+Tab until it says plan mode).

**While Claude works** (same rules as before)
- Approve: reads, `npx eslint`, scoped `tsc --noEmit`, `git status`, edits inside `src/features/assessments-v2` and `docs/assessments-v2`.
- Say NO to: `npm run build`, `tsc -b`, `npm install`, `git push/reset/checkout/stash`, any edit outside the two v2 folders.
- Never pick "allow all edits" or auto mode.

**After every fix**
1. Do the click-through Claude gives you.
2. Read `progress.md`.
3. Commit: `git add -A` then `git commit -m "assessments-v2: fix N - <what>"`.
4. In the Excel tracker, set the row's Status to Re-test (or Done) and re-run the matching test IDs.

**Put `08-test-findings.md` and this file in `docs/assessments-v2/` before starting.** Claude Code cannot open the Excel file, so `08-test-findings.md` is its copy of your Changes to Build sheet plus your raw test notes.

**Add this line to the end of EVERY prompt below:**
```
Do NOT run npm run build or tsc -b. Verify with npx eslint on the files you changed and a scoped tsc --noEmit only. Do not edit anything outside src/features/assessments-v2 and docs/assessments-v2. Do not install packages.
```

Order at a glance: 1A plan → 1B people and visibility → 2A guards → 2B QSA flows → 3 validation, calendar, registration → 4 site visits and results → 5 FISA and RPL → 6 QCTO forms (when you have the documents) → re-test → styling → Phase 8.

---

## Fix 1A — Visibility matrix (plan mode, writes only one doc)

```
Read src/features/assessments-v2/CLAUDE.md, docs/assessments-v2/progress.md, 01-process-flow.md, 02-change-register.md and docs/assessments-v2/08-test-findings.md (rows 1 and 2, plus the appendix notes for K-04, K-11, C-14, C-15, G-05, G-19, B-19, B-26). Phases 0-7 are built.

This step is a DESIGN DOC ONLY. The only file you may create is docs/assessments-v2/09-visibility-matrix.md.

Draft a role-visibility matrix for the whole of v2, based on the "who is involved" lines in 01-process-flow.md and the CR-015 / CR-053 / CR-054 notes:
1. One table per portal. Rows = roles (external: QP, SDP; internal: every role in config/roles). Columns = every module and tab. Cell = None / See own / See unit / See all, and which actions the role may take.
2. A second table of RECORD visibility: for each record type (QSA application, instrument validation, sitting, registration, confirmation, visit, visit report, results batch, FISA record, RPL toolkit) say who sees it (owner, owner's unit, approvers, the QP/SDP it belongs to).
3. List the named demo users you propose (2-3 people per internal role, 2-3 QPs, 2-3 SDPs, each with the qualifications / learners / units they own) so "my items" and "different person must approve" can be shown.
4. List every place in the CURRENT code where the rules are not enforced (use the findings), so Fix 1B knows what to change.
5. Mark any rule you had to guess with [ASSUMPTION].

Wait for my approval before anything is built.
```

## Fix 1B — Named demo users and visibility enforcement

Only run this once you have read and agreed 09-visibility-matrix.md (tell Claude any corrections first).

```
Read src/features/assessments-v2/CLAUDE.md, docs/assessments-v2/progress.md, 09-visibility-matrix.md (approved, with my corrections if any) and docs/assessments-v2/08-test-findings.md rows 1, 3, 4, 12 and 28.

1. Named demo users (row 1): extend config/roles and the seed data with the named people from the matrix. The role switcher becomes "role, then person" (or one person picker grouped by role). The active PERSON, not just the role, is stored and used by shared/workflow for: no self-approval (CR-053), allocation of work to a named ASD, re-route to a named person, and "my items" filters. Reset demo data must still work and old localStorage data must not crash the app (version the storage key if needed).
2. Visibility enforcement (rows 3, 4, 12, 28): implement the matrix in ONE place (a visibility helper in shared/ or config/) and use it for nav items, tab visibility, list filtering and route guards. Direct URLs a role may not see must show a clear "no access" screen, not data.
   - SDP must not see the QSA Addendum section at all (B-26).
   - QP sees only their own records; SDP only their own learners/registrations.
   - CEO sees only applications waiting for an outcome-letter signature (B-19).
   - External QP view of site visits shows only their own visits (G-05).
3. K-11 must pass: in both portals, a role sees only the modules and tabs the matrix allows, and the actions were already correct.
4. Update progress.md: what is enforced, anything in the matrix not yet enforced, and every [ASSUMPTION].

Give me a click-through script: switch to each role/person and show what appears and what does not, the SDP trying the QSA URL directly, the CEO list, a QP seeing only their own visits, and one person failing to approve their own submission while a colleague can.
```

---

## Fix 2A — Duplicate buttons, missing messages, missing notes

```
Read src/features/assessments-v2/CLAUDE.md, docs/assessments-v2/progress.md, 09-visibility-matrix.md and docs/assessments-v2/08-test-findings.md rows 5, 6, 10 and 11 (plus appendix notes for B-05, B-08, B-10, B-11, B-15). Fix 1B is done.

These are bugs where actions bypass the workflow rules. Fix them at the root:
1. Row 5 and 6: the DD review stage has a second set of buttons that skips the review, the IAC stage shows three sets of buttons (only the bottom pair is correct), and the ASD can see the DD's review checklist and button. Make every stage render exactly ONE action bar, driven by shared/workflow (the stage's role-gated actions), and show a stage's checklist only to the role that owns that stage. Remove the extra bars.
2. THEN audit every other module (instrument-validation, eisa-calendar, eisa-registration, eisa-confirmation, site-visits, approval-of-results, fisa, rpl-toolkit) for the same pattern: more than one action bar, an action that is not routed through shared/workflow, an action visible to a role that cannot take it, a Submit/Approve enabled before mandatory comments, notes or uploads are done. Fix what you find and list each fix in progress.md.
3. Row 11: wherever a form or checklist blocks Submit because of missing required fields or missing line comments, show a clear message next to each missing field (and a summary at the top), not just a disabled button. Build ONE shared helper/component for this and use it everywhere forms are validated.
4. Row 10: the acknowledgement letter "Send back to ASD" action must require a note, stored in the audit trail and shown to the ASD.

Give me a click-through script: the DD review stage, the IAC stage (one bar only), the ASD not seeing the DD checklist, an incomplete form showing messages, and the send-back note. Also list every module you audited and what you changed.
```

## Fix 2B — QSA Addendum flow changes

```
Read src/features/assessments-v2/CLAUDE.md, docs/assessments-v2/progress.md, 01-process-flow.md (map 1), 02-change-register.md, 09-visibility-matrix.md and docs/assessments-v2/08-test-findings.md rows 7, 8, 9, 13, 14 and 16 (plus appendix notes for B-10, B-11, B-13, B-14, B-18, B-21, B-24, B-25). Fix 2A is done. Skip row 15 (blocked until the QCTO documents).

Change the QSA Addendum flows. Keep using shared/workflow for every transition.
1. Row 7: the ASD's evaluation outcome is generated automatically from the checklist answers (a simulated "auto-evaluation" function in mock/integrations, e.g. any No on a mandatory line, or a configurable rule, makes it NEGATIVE; otherwise POSITIVE). Negative: the ASD sends the evaluation report back to the QP. Positive: it goes to the DD for review. The ASD cannot override it; they can only add notes.
2. Row 8 and 9: when the DD sends work back to the ASD, or the IAC sends it for remediation, the ASD sees the reviewer's notes and checklist results, can redo the evaluation report and resubmit. A redone report is run through the same automatic outcome (negative goes to the QP with the report, positive goes to the DD). A negative report reaches the QP, and the QP can correct and resubmit it (CR-012). There is still NO direct DD to QP action.
3. Row 13: new approval-letter flow. The approval letter is drafted from the template and the ASD sees it, can edit the editable fields, and submits it to the DD. The DD reviews and signs it, or declines it back to the ASD with a mandatory note (the ASD edits and resubmits). Once signed it returns to the ASD, who sends it to the QP. Keep the signer in the config constant (default DD) and update progress.md's open question.
4. Row 14: move the audit trail out of the details tab into its own tab, on both the internal and external views. On the QP view, put the acknowledgement letter, outcome letter and approval letter each in its own tab.
5. Row 16 (Ask QCTO): leave the new-qualification pathway as it is; just add it to progress.md open questions.

Update progress.md. Give me a click-through script: a positive path to approval including the new approval-letter flow and the QP receiving the letter; a negative evaluation reaching the QP and resubmission; a DD send-back with the ASD redoing the report; an IAC remediation loop; a declined approval letter; the new tabs.
```

---

## Fix 3 — Instrument validation, calendar, registration

```
Read src/features/assessments-v2/CLAUDE.md, docs/assessments-v2/progress.md, 09-visibility-matrix.md and docs/assessments-v2/08-test-findings.md rows 17, 18, 21, 22, 23, 24, 25, 26, 27 and 20 (plus appendix notes for C-06, C-07, C-11, D-08, D-11, D-12, D-17, E-06, E-07, E-10, E-12, F-02, F-05). Fix 2B is done. Skip row 19 (blocked until the QCTO documents).

1. Row 17: choosing "Approved with conditions" requires a mandatory conditions note that the QP sees and that goes into the audit trail and the letter/outcome view.
2. Row 18: the QP (external) side of Instrument Validation gets tabs like the internal side: Scheduling, Instrument, Validation outcome, Details, Audit trail.
3. Row 21: a rejected date batch can be edited by the QP and resubmitted, keeping the earlier rejection reason visible.
4. Rows 22 and 23 (Ask QCTO, build the default): on postpone, the ASD may enter an optional proposed new date shown in the SDP notification and audit trail; cancel needs a reason. Delete of a sitting that already has registrations is blocked with a clear message (offer postpone or cancel instead). Edit stays as is. Record both as open questions in progress.md.
5. Row 24: a draft registration can be deleted/withdrawn by the SDP; the duplicate "Building registration" left behind after a blocked concurrent registration must not occur: a blocked learner/registration must not leave a stuck record, and an SDP cannot start a second open registration for the same sitting. Re-run E-06 logic after this.
6. Row 25: SOR gets a status per learner: Uploaded, Under review, Accepted, Flagged, Replaced. Uploading sets Uploaded; the Assistant Director's review sets Under review / Accepted / Flagged; a replacement sets Replaced. Show the status on the learner row for both the SDP and the Assistant Director.
7. Row 26 (Ask QCTO): keep SOR per learner and note it as confirmed-by-register in progress.md.
8. Row 27: add a one-line help text under the title of each section (Instrument Validation, Date & Calendar, Registration, Confirmation, Site Visits), e.g. Confirmation: "After registration is complete the QP confirms centres, learner counts and marking/moderation dates. RPL monitoring items in Site Visits come from the registration, not from Confirmation."
9. Row 20 (Ask QCTO): no change; add to the open questions.

Update progress.md. Click-through script: conditions note, QP tabs, rejected batch resubmit, postpone with proposed date, deleting a sitting that has registrations, a blocked concurrent registration leaving nothing behind, the SOR statuses.
```

## Fix 4 — Site Visits and Approval of Results

```
Read src/features/assessments-v2/CLAUDE.md, docs/assessments-v2/progress.md, 01-process-flow.md (maps 7, 8, 9, 10), 09-visibility-matrix.md and docs/assessments-v2/08-test-findings.md rows 32, 33, 34, 35, 36, 37, 38, 39, 29, 30 and 40 (plus appendix notes for G-05 to G-26, H-05, H-11). Fix 3 is done. Skip rows 31 and 41 (blocked until the QCTO documents).

1. Row 32: after the planner submits a visit plan, the plan stays visible (read-only) to every later approver and to the QP where allowed. Nothing may disappear after submit.
2. Row 33: a Reject (with mandatory reason) and a Send back (with mandatory note) action at EVERY planning stage, through shared/workflow, with audit entries and notifications to the previous owner.
3. Row 34: the execution tab has QP and qualification selectors at the top of the form (CR-049). Selecting a qualification restricts the QP choice to QPs of that qualification; pre-fill what you can from the linked sitting.
4. Row 35: re-route lets the user choose a named person with the SAME role (from the demo users), requires the audit note, shows the new owner on the record, and notifies them.
5. Row 36 and 38 (Ask QCTO): use the visibility matrix for visit reports. After the DD approves a visit report, the DD can click "Share Visit Outcome" (row 37), which sends the outcome to the QP (and for PEM, the other parties), shows it on the QP's own visit, and logs it. On the Approval of Results review screen also show the shared visit outcome for the sitting, not just its status. Record the rules as open questions.
6. Row 39 (Ask QCTO): keep the placeholder names; make sure they are in config/labels.ts so one edit renames them; list under open questions.
7. Rows 29 and 30 (Ask QCTO): in the planning form only offer SDPs that have access to the visit (those with a registration for the linked sitting, or the matrix says visible); leave manual RPL visit creation allowed and note it as an open question.
8. Row 40: the QP's results submission captures a result PER LEARNER (Competent / Not yet competent), listing the learners of the sitting's registrations. The batch competency rate is calculated from those, and replaces the hand-typed count. The low-competency rule (config, 60%) then creates the PEM visit suggestion from real numbers. Keep the old seed data working by seeding per-learner results.

Update progress.md. Click-through script: submitted plan still visible, reject and send-back at each stage, QP/qualification selectors, re-route to a named colleague, DD approving then Share Visit Outcome with the QP receiving it, a results batch with mixed learner results producing a low competency rate and a PEM suggestion.
```

## Fix 5 — FISA and RPL Toolkit

```
Read src/features/assessments-v2/CLAUDE.md, docs/assessments-v2/progress.md, 01-process-flow.md (maps 3, 4, 5), 09-visibility-matrix.md and docs/assessments-v2/08-test-findings.md rows 43, 44, 45, 46 and 48 (plus appendix notes for I-08, I-10, J-03, J-04, J-05, K-08). Fix 4 is done. Skip rows 42 and 47 (blocked until the QCTO documents).

1. Row 43: after FISA Instrument Validation completes, the SDP and officials can open the full FISA Validation Report: all checklist sections with answers and comments, outcome, reviewer, date, and audit trail. Read-only, printable.
2. Row 44: in FISA registration the SDP picks learners from a simulated "already enrolled in Skills Programme" list (mock data owned by the QA domain, like EISA registration) and can add and remove learners before submitting. Show where the list comes from in the help text. Record "learner source = QA enrolment" as an open question.
3. Row 45: the RPL Toolkit gets an outcome letter generated from a template (shared/letters), previewed, with the CEO as the only one who signs it, as in the QSA Addendum. Add the letter to the RPL Toolkit record, in its own tab.
4. Row 46 (Ask QCTO, build the default): add a team-level moderation step before the IAC: the Director & Team moderate with a checklist (comment on every line), then the IAC reviews and endorses the report, then the CEO signs the outcome letter. Flag the order as an open question.
5. Row 48: when a QP submits an update to an existing RPL toolkit, they choose from the QP's existing approved toolkits (list), and the new submission is linked to it as a new version.

Update progress.md. Click-through script: the FISA validation report for an SDP and an official, FISA registration adding and removing learners, the RPL path through moderation, IAC, outcome letter and CEO signature, and updating an existing toolkit.
```

## Fix 6 — Align content with the QCTO documents

Run this only after you have put the QCTO documents into `docs/assessments-v2/qcto-forms/` (PDFs or Word files are fine; if Claude cannot read a format, paste the text into a .md file). One prompt per module avoids running out of tokens: change the module name and the row number.

```
Read src/features/assessments-v2/CLAUDE.md, docs/assessments-v2/progress.md and docs/assessments-v2/08-test-findings.md row <15 | 19 | 31 | 41 | 42 | 47>. The QCTO documents for this module are in docs/assessments-v2/qcto-forms/<file names>.

1. Read the documents. Do NOT edit yet. List, for this module, every section, field, checklist item and wording in the document, and how it compares with the current v2 mock data, checklist and report fields (matches / different / missing / extra).
2. Then update the mock data, checklist items, report fields and labels so the module matches the documents exactly (copy the text; keep a comment on every checklist line). Keep ids stable where records already exist, and version the storage key if the seed changes.
3. Put the comparison table in docs/assessments-v2/10-qcto-alignment-<module>.md and note anything you could not match.
Wait for my OK after step 1 before editing.
```

| Row | Module | Documents to supply |
|---|---|---|
| 15 | QSA Addendum | QSA Addendum evaluation checklist and evaluation report |
| 19 | Instrument Validation | EISA instrument validation checklist |
| 31 | Site Visits | Readiness, Marking & Moderation, RPL/ARPL and Post-EISA execution forms |
| 41 | Approval of Results | Compliance review, evidence evaluation, folder-check forms |
| 42 | FISA | FISA Standards form, FISA instrument validation checklist and report |
| 47 | RPL Toolkit | RPL Toolkit evaluation checklist and report |

---

## After Fix 6

1. Re-run the whole test script (at least every Fail, Partial, pass-with-note and Not tested row) and update the tracker.
2. Do the styling round from the Styling Notes sheet (global first: side navs, nav sections, modals, logout button; then per screen).
3. Then Phase 8 in 05-build-prompts.md.
