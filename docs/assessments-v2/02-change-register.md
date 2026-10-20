# Assessments v2 — Change Register (build version)

Every change request for the new Assessments domain, one block per item, in the order of the agreed process flow. This is the checklist the build is measured against: nothing in here may be skipped. Source documents: `03-change-request-source.md` (CR-001 to CR-060) and `01-process-flow.md` (process-map corrections).

**How to read a block**

- **Build phase** — which phase in `05-build-prompts.md` builds it.
- **Old build** — where the behaviour lives in the OLD user manual (`04-old-user-manual-REFERENCE-ONLY.md`). In v2 you are NOT changing the old screen; you are building the correct behaviour fresh.
- **Current behaviour** — what the old build does.
- **Required (v2 must do this)** — the behaviour to build.
- **Status** — Modify existing = old behaviour is wrong and is rebuilt correctly; New feature = did not exist; Open item = a detail is still to be decided (build the best reading and flag it); Dependency = shaped by something else; Blocked = backend-dependent or deferred (stub only); Confirm/terminology = naming question; Cross-domain = touches another QCTO domain (simulate it).

## Build phase map

| Phase | Items |
|---|---|
| Phase 0 | CR-006, CR-015, CR-011, PM-04 |
| Phase 0 (backend stub only — no screen) | CR-001, CR-002, CR-009, CR-010, CR-020, CR-022, CR-037, CR-039 |
| Phase 1 | CR-003, CR-004, CR-005, CR-007, CR-008, CR-012, CR-013, CR-013 note, CR-007 / CR-008 follow-up, CR-014, CR-016 |
| Phase 2 | CR-017, CR-018, CR-019, CR-021, CR-023, CR-024, CR-025 |
| Phase 3 | CR-027, CR-028, CR-029, CR-030, CR-031, CR-032, CR-033, CR-033 note, CR-034 |
| Phase 4 | CR-035, CR-036, CR-036 note, CR-038, CR-040, CR-041, CR-042, CR-043, PM-08 |
| Phase 5 | CR-044, CR-045, CR-046, CR-047, CR-048, CR-049, CR-050, CR-051, CR-053, CR-054, CR-055, CR-056, CR-057, CR-058, PM-05, PM-06, PM-07 |
| Phase 6 | CR-052, CR-059, CR-059 (hand-off), CR-060 |
| Phase 7 | CR-026, PM-01, PM-02, PM-03, PM-09, PM-10, PM-11 |
| Phase 8 | Process note |

## 1. QSA Addendum Application & Gate Check

*Old manual reference:* User Manual – Assessments Domain, Part 2 Step 3 (Create PASS Application – “Create New QASA Addendum Application” modal), Part 2 Step 4 (Create FAIL Application – Gate Evaluation Check + 3 manual uploads), and the “Path Split Determination” table after Part 5 Step 17

> Flow correction (read before building this section): the current build uses the gate check result to split the whole process — Pass → EISA path, Fail → FISA path. In the agreed process the gate check only decides WHERE the supporting documents come from (SAQA-registered → pulled automatically; not registered → the QP uploads them manually / they come from the Qualifications Development domain). Both outcomes stay in the QSA Addendum → EISA track. FISA is a completely separate Skills Programme process (see Section 16).

### CR-003 — Remove the “Proposed EISA Date” field from the QSA Addendum submission screen

- **Build phase:** Phase 1
- **Status:** Modify existing  |  Priority: Low · 0.25 days · Sprint 1
- **Old build:** Part 2 Step 3 – “Proposed Date of EISA *” (mandatory) field in the Create New QASA Addendum Application modal; carried through to the “Proposed EISA” column on the QASA tables (Part 3 Step 7, Part 4 Step 9) and the “Proposed Date of EISA” header field on the QAS Addendum Preliminary Checklist (Part 4 Step 9)
- **Current behaviour:** The QP must enter a proposed EISA date when submitting the QSA Addendum. The date is then shown on the internal QASA tables and on the evaluation checklist header.
- **Required (v2 must do this):** Remove the field from the submission screen, and remove/replace the dependent “Proposed EISA” table column and checklist header field. EISA dates are captured later, in the new EISA Date & Calendar module (Section 8, CR-029).

### CR-004 — Confirm and refine the existing-qualification vs new-qualification pathway in the QSA Addendum gate check

- **Build phase:** Phase 1
- **Status:** Open item  |  Priority: Medium · 0.25 days · Sprint 1
- **Old build:** Part 2 Step 3 & Step 4 – “Gate Evaluation Check” modal (“Pass = Qualification found in SAQA registry, documents auto-retrieved. Fail = Manual document upload required”); FAIL path requires 3 uploads (SAQA Qualification Document, Curriculum Document, QAS Addendum); “Path Split Determination” table (Passed → EISA Validation, Failed → FISA Standards)
- **Current behaviour:** Gate check is a simulated Pass/Fail button. Pass auto-attaches documents; Fail forces 3 manual uploads. The result also decides the downstream path: Pass → EISA Validation section, Fail → FISA Standards section.
- **Required (v2 must do this):** Keep the gate check as the SAQA-registered check only (existing qualification → documents auto-pulled; new/unregistered qualification → manual upload or documents from Qualifications Development). Both outcomes continue into the same QSA Addendum evaluation. Remove the Pass→EISA / Fail→FISA path split. Exact handling of the new-qualification pathway to be confirmed with QCTO.

## 2. Acknowledgement Letter & Global Terminology

*Old manual reference:* Part 3 Step 8.1 (ASD – Upload Acknowledgement Letter), Part 3 Steps 8.2–8.3 (Deputy Director / CEO review of the acknowledgement letter); system-wide labels

### CR-005 — Auto-generate the acknowledgement letter from a template using captured data; keep a reviewer “view” step

- **Build phase:** Phase 1
- **Status:** Modify existing  |  Priority: High · 0.5 days · Sprint 1
- **Old build:** Part 3 Step 8.1 – “Upload Acknowledgement Letter” modal (“Select a PDF or DOCX file”) → “Submit to Deputy Director”; Application Details panel shows “Acknowledgement Letter – Not yet uploaded”
- **Current behaviour:** The ASD drafts the acknowledgement letter outside the system and uploads it as a PDF/DOCX file before submitting to the Deputy Director.
- **Required (v2 must do this):** Generate the letter automatically from a template populated with the captured application data (QP, qualification title, SAQA ID, NQF level, dates). Remove the manual upload. Keep a reviewer “view/preview” step before it is sent. (Routing of this letter is corrected by CR-007 — it stops at DD level.)

### CR-006 — Global rename of “AQP” to “QP” throughout the system

- **Build phase:** Phase 0
- **Status:** Modify existing  |  Priority: Low · 0.25 days · Sprint 1
- **Old build:** Part 2 Step 3 – “Name of AQP *” field; “Name of AQP” column on every QASA table (Part 3 Step 7, Part 4 Step 9, Part 5); QAS Addendum Preliminary Checklist (“Name of AQP”, “Date Feedback Provided to AQP”); Site Visit record panel “AQP & Qualification” (Part 7 Step 24)
- **Current behaviour:** Labels use “AQP” in several places, while the role dropdown and manual text already say “Quality Partner”.
- **Required (v2 must do this):** Replace every “AQP” label, column header and field name with “QP” (search the whole build, including checklists, tables, modals and generated letters).

## 3. QSA Addendum Evaluation & Approval Routing (DD / IAC / CEO)

*Old manual reference:* Part 3 Steps 8.2–8.3 (DD Review & Evaluate → CEO Review & Approve), Part 4 Steps 9–13 (ASD Evaluation → DD → AIC → CEO → ASD), Part 5 Steps 14–17 (Approval Letter workflow)

> Current routing in the build: Acknowledgement letter ASD → DD (7-item checklist, “Save & Forward to CEO”, “Send to CEO”) → CEO (same 7-item checklist, “Save Approval”, “Approve & Send to Quality Partner”). Evaluation: ASD → DD (“Quality Check OK — Send to IAC”) → AIC (uploads QASA Presentation & Resolution Document, “IAC Approved — Send to CEO”) → CEO (“Final Review and Sign Outcome Letter”) → ASD. Approval letter: ASD drafts → DD → CEO signs → ASD → “Submit to QP Portfolio”.

> Agreed routing (process map 1 + 6 August meeting): ASD evaluates → DD reviews → IAC gives final internal approval based on a summary presentation (not a re-check of the full evaluation) → CEO ONLY signs the final outcome letter. The CEO does not tick any evaluation checklist.

> Terminology flag: the role dropdown contains both “Internal Assessment Committee” and “AIC” as separate roles, and the manual uses “AIC” (Steps 11, 32.4) while the process maps use “IAC”. Confirm with QCTO that these are the same committee and keep one label (IAC).

### CR-007 — Remove all Deputy Director → CEO direct-routing steps in the QSA Addendum evaluation/approval workflow

- **Build phase:** Phase 1
- **Status:** Modify existing  |  Priority: Critical · 0.5 days · Sprint 1
- **Old build:** Part 3 Step 8.2 – DD “Save and Forward to CEO” / “Send to CEO” (acknowledgement letter); Part 4 Step 10–12 hand-offs into the CEO step; Part 5 Step 15 – DD “Quality Check OK — Send to CEO” (approval letter)
- **Current behaviour:** The DD forwards work directly to the CEO at the acknowledgement-letter stage, and again at the approval-letter stage.
- **Required (v2 must do this):** Remove every DD → CEO direct route. The acknowledgement letter stops at DD level (process map 1 correction). The CEO is only reached through the outcome-letter flow after IAC approval (see CR-008 and CR-014).

### CR-008 — Remove the CEO “review and approve” evaluation step; limit the CEO's role to the final outcome-letter signature only

- **Build phase:** Phase 1
- **Status:** Modify existing  |  Priority: Critical · 0.25 days · Sprint 1
- **Old build:** Part 3 Step 8.3 – CEO “Review and Evaluate” (7-item checklist, Approval Notes, “Save Approval”, “Approve and Send to Quality Partner”); Part 4 Step 12 – CEO 4-item checklist (“Complete evaluation package reviewed”, “All approvals in place”, “Outcome letter is ready for signature”, “Legal and compliance requirements met”)
- **Current behaviour:** The CEO ticks evaluation checklists and approves applications, repeating checks already done by ASD/DD/IAC.
- **Required (v2 must do this):** Remove the CEO checklist/approval screens. The CEO's only action is to sign the final outcome letter after IAC approval — confirming the process was followed, not redoing checks.

### CR-012 — Enforce DD → ASD → QP routing for evaluation corrections; remove the direct DD → QP option

- **Build phase:** Phase 1
- **Status:** Modify existing  |  Priority: High · 0.25 days · Sprint 1
- **Old build:** Part 4 Step 9 – Evaluation Report actions (“Negative — Return to QP”, “Positive — Send to Deputy Director”); Part 4 Step 10 – DD “Review and Send to IAC” (only a forward action is documented); Part 3 Step 8.3 “Approve and Send to Quality Partner”
- **Current behaviour:** The manual only documents forward actions for the DD. The direct DD → QP return option named in the change request is not shown in the manual but exists in the build — it lets the DD bypass the ASD.
- **Required (v2 must do this):** When the DD wants corrections, the DD can only return the evaluation to the ASD (add a “Return to ASD” action). The ASD then returns it to the QP. Remove any DD → QP direct action.

### CR-014 — Split the evaluation-approval workflow and the outcome-letter-approval workflow into two separate flows; remove the CEO from the evaluation flow

- **Build phase:** Phase 1
- **Status:** Modify existing  |  Priority: Critical · 0.5 days · Phase 2
- **Old build:** Part 4 Steps 9–13 – single flow shown on the QASA Evaluation tab header (“ASD evaluation → Deputy Director → IAC → CEO sign-off → Return to ASD for approval”) with stage cards ASD Evaluation / Deputy Director / IAC / CEO / ASD Return
- **Current behaviour:** Evaluation, approval and the outcome letter all run as one chain, with the CEO embedded as a stage of the evaluation.
- **Required (v2 must do this):** Flow 1 – Evaluation approval: ASD → DD → IAC (decision). Flow 2 – Outcome letter: generated letter (CR-013) → CEO signature → back to QP. The CEO appears only in Flow 2. Update stage cards, statuses and counters to match.

### CR-016 — Merge the Internal Assessment Committee (IAC) decline/remediation branch into the main build and demonstrate it to the client

- **Build phase:** Phase 1
- **Status:** Already built  |  Priority: High · 0.25 days · Sprint 1
- **Old build:** Part 4 Step 11 – AIC “Review and Approve to CEO” (5-item checklist, Upload QASA Presentation, Upload Resolution Document, “IAC Approved — Send to CEO”)
- **Current behaviour:** The manual (main build) only has the IAC approve path. The decline/remediation branch was built on a separate branch and is not yet merged.
- **Required (v2 must do this):** Merge the decline/remediation branch into the main build so the IAC can decline or send for remediation (back down the chain to ASD → QP), then demonstrate it to QCTO. Verify it fully meets the requirement rather than rebuilding.

## 4. Evaluation & Validation Checklists

*Old manual reference:* Part 4 Step 9 (QAS Addendum Preliminary Checklist – 44 items, Recommendations, Evaluation Report), Part 3 Step 8.2 & Part 4 Steps 10–11 (DD / IAC tick-only checklists), Part 6 Step 20.1 (Instrument Validation tab – “QA Validation of Assessment Instrument Checklist”), Part 8 Steps 32.2–32.5 and 34.2 (FISA checklists)

> Build note (process map outline §9): QSA evaluation, FISA Standards evaluation, RPL Toolkit evaluation and Instrument Validation all follow the same shape — evaluate → moderate → validate/endorse → approve, with a comment field per checklist line. Build one reusable checklist component and use it everywhere.

> Note: this is the OPPOSITE of the Accreditation domain, where QCTO asked to remove the blanket per-item comment requirement. Keep the comment rule configurable per domain — do not share one global setting.

### CR-011 — Add a mandatory comment/justification field to every checklist line item (evaluation and instrument validation checklists)

- **Build phase:** Phase 0
- **Status:** Modify existing  |  Priority: High · 0.5 days · Sprint 1
- **Old build:** Part 4 Step 9 – 44-item checklist rows (Yes / No / “Comments…” per line, currently optional) and Recommendations rows; Part 3 Step 8.2, Part 4 Steps 10–11 – DD and IAC checklists (tick boxes + one overall “Review Notes” box); Part 6 Step 20.1 – Instrument Validation checklist
- **Current behaviour:** The QAS evaluation checklist has an optional comment box per line. The DD/IAC review checklists and the instrument validation checklist are tick-only with a single notes box for the whole checklist.
- **Required (v2 must do this):** Every checklist line gets its own comment/justification field, and it is mandatory before the checklist can be saved/submitted. Apply to the evaluation checklists and the instrument validation checklist (EISA and FISA).

### CR-009 — Add gate-check / AI-assisted validation to reduce fully manual steps in the DD/ASD evaluation flow

- **Build phase:** Phase 0 (backend stub only — no screen)
- **Status:** Blocked  |  Backend
- **Old build:** Part 4 Steps 9–10 – ASD/DD evaluation checklists (all manual ticks)
- **Current behaviour:** Every check is a manual tick by the ASD/DD.
- **Required (v2 must do this):** Add automated/AI-assisted validation to pre-check items before the ASD/DD review. Backend-dependent — parked in the Change Request appendix — requires real AI-assisted/automated validation logic.

### CR-010 — Build a hybrid automatic/manual validation model for the QSA evaluation checklist

- **Build phase:** Phase 0 (backend stub only — no screen)
- **Status:** Blocked  |  Backend
- **Old build:** Part 4 Step 9 – QAS Addendum Preliminary Checklist (44 items)
- **Current behaviour:** All 44 items are answered manually (Yes/No).
- **Required (v2 must do this):** Auto-check objective data items (e.g. SAQA ID, NQF level, credits, totals) and keep manual review with commentary for subjective items. Backend-dependent — parked in the Change Request appendix — requires real automated (AI) checking of objective data.

### CR-022 — Apply the checklist comment-field and hybrid validation logic to the instrument validation checklist

- **Build phase:** Phase 0 (backend stub only — no screen)
- **Status:** Blocked  |  Backend
- **Old build:** Part 6 Step 20.1 – Instrument Validation tab; Part 8 Step 34.2 – FISA “Conduct Validation” checklist
- **Current behaviour:** Instrument validation checklist is manual with no per-line comments.
- **Required (v2 must do this):** Comment-field portion is already covered by CR-011 (build now). The hybrid automatic/manual validation portion depends on the same automated logic as CR-010. Backend-dependent — parked in the Change Request appendix.

## 5. Outcome Letter & Approval Letter

*Old manual reference:* Part 4 Step 12 (CEO – Upload Signed Outcome Letter), Part 5 Step 14 (ASD – Draft Approval Letter upload), Part 5 Step 15 (DD – Review Approval Letter), Part 5 Step 16 (CEO – Upload Signed Approval Letter), Part 5 Step 17 (ASD – Submit to QP Portfolio)

### CR-013 — Auto-generate the outcome letter and approval letter from a template using captured data, with an in-app view/print step, removing manual drafting/upload

- **Build phase:** Phase 1
- **Status:** Modify existing  |  Priority: High · 0.5 days · Sprint 1
- **Old build:** Part 4 Step 12 – “Upload Signed Outcome Letter *”; Part 5 Step 14 – “Upload Draft Approval Letter *” (PDF/DOCX) + Draft Notes; Part 5 Step 16 – “Upload Signed Approval Letter *”
- **Current behaviour:** Both letters are drafted outside the system and uploaded as files (draft by ASD, signed copies by CEO).
- **Required (v2 must do this):** Generate both letters from templates populated with the captured application/evaluation data, with an in-app view/print step. Remove the manual draft/upload fields.

### CR-013 note — Digital signature capability for generated letters

- **Build phase:** Phase 1
- **Status:** Blocked  |  Deferred
- **Old build:** Same steps – CEO signature on outcome and approval letters
- **Current behaviour:** Signatures are applied outside the system and the signed file is uploaded.
- **Required (v2 must do this):** Digital signature capability is explicitly deferred until backend/security infrastructure exists. No build action yet — use the view/print step in the meantime.

### CR-007 / CR-008 follow-up — Confirm whether the Approval Letter still needs a CEO signature

- **Build phase:** Phase 1
- **Status:** Open item  |  Confirm
- **Old build:** Part 5 Steps 15–16 – DD “Quality Check OK — Send to CEO”, CEO “Final Approval & Sign” (5-item checklist, Upload Signed Approval Letter, “Approve & Sign — Return to ASD”)
- **Current behaviour:** The approval letter goes ASD → DD → CEO → ASD → QP Portfolio.
- **Required (v2 must do this):** CR-007 removes DD → CEO routing and CR-008 limits the CEO to the outcome letter only, while process map 1 says a separate approval letter is “drafted and signed off afterwards”. Confirm with QCTO who signs the approval letter (DD, or CEO as part of the outcome-letter flow) before rebuilding Part 5.

## 6. Roles & Assignment Model

*Old manual reference:* Role dropdown used on every screen (CEO, Internal Assessment Committee, Director & Team, AIC, Qualifications Development, Assistant Director, Domain Director, Sub Domain Admin, Deputy & Assistant Director, Director, ASD), Part 5 Step 17 (“Submit to QP Portfolio”)

### CR-015 — Restructure the Assessments role/assignment model around process-stage teams rather than QP-portfolio ownership

- **Build phase:** Phase 0
- **Status:** Modify existing  |  Priority: Medium · 0.5 days · Sprint 1
- **Old build:** Part 5 Step 17 – ASD “Submit to QP Portfolio”; allocation actions such as Part 8 Step 32.1 (DD “Allocate to ASD”) and Step 34.1 (AD Allocation)
- **Current behaviour:** Work is organised by QP portfolio — an official “owns” a QP and their submissions.
- **Required (v2 must do this):** Assign work by process-stage teams (e.g. QSA evaluation team, instrument validation team, registration team, site visits team). Replace “Submit to QP Portfolio” with a stage-based hand-off and update allocation screens/filters accordingly.

## 7. EISA Instrument Validation

*Old manual reference:* Path Split Determination (Passed → “EISA Validation section”), Part 6 Step 18 (External – Populate EISA Validation Schedule), Part 6 Step 20.1 (ASD – Liaise with QP / Instrument Validation tabs), Part 6 Step 20.2 (DD Review & Outcome); side navigation “EISA > EISA Validation”; internal header “EISA Validation Management – Manage EISA validation schedules submitted by SDPs”

> Agreed process (map 2): ASD checks the actual exam paper (instrument) against the approved QSA Addendum. If changes are needed the QP fixes the instrument and it is checked again. Output = a validated instrument. No DD step and no SDP involvement.

### CR-017 — Remove QP self-scheduling for instrument validation; build a joint ASD/QP scheduling process (reuse the Quality Assurance module's scheduling methodology)

- **Build phase:** Phase 2
- **Status:** Modify existing  |  Priority: High · 0.5 days · Phase 2
- **Old build:** Part 6 Step 18 – QP “Populate EISA Validation Schedule” (Validation Date, Start/End Time, Venue, Assessor Name, Assessor Email, Notes, optional schedule upload) → “Submit Schedule to Internal”; Part 6 Step 20.1 – “Liaise with QP” tab (QP contact details, “Basic Logistics Arranged”, “Validation Date Confirmed”)
- **Current behaviour:** The QP sets the validation date, time and venue on its own and submits it to QCTO; the ASD only records the liaison afterwards.
- **Required (v2 must do this):** Replace with a joint ASD/QP scheduling process — the ASD and QP agree the slot together — reusing the scheduling/availability approach already built in the Quality Assurance module.

### CR-018 — Rename “EISA Validation” to “EISA Instrument Validation” and remove SDP visibility/access from this process

- **Build phase:** Phase 2
- **Status:** Modify existing  |  Priority: High · 0.25 days · Sprint 1
- **Old build:** Side navigation “EISA Validation” (external and internal); internal header “Manage EISA validation schedules submitted by SDPs”; Part 6 Step 21 – SDP role opens the “EISA Validations” section to reach the EISA Registration tab
- **Current behaviour:** The section is called “EISA Validation” and the SDP role can see and act inside it.
- **Required (v2 must do this):** Rename to “EISA Instrument Validation” everywhere (nav, headers, statuses). Remove all SDP visibility/access — this is a QP ↔ QCTO process only. Fix the header text that says schedules are “submitted by SDPs”.

### CR-019 — Separate “EISA Instrument Validation” and “EISA Registration” into two distinct, correctly labelled sections

- **Build phase:** Phase 2
- **Status:** Modify existing  |  Priority: High · 0.5 days · Sprint 1
- **Old build:** Part 6 Step 21 – “EISA Registration” is a tab inside the EISA Validation Details modal (Step 1 upload documents, Step 2 details, Step 3 categorise Trades / Non-Trades)
- **Current behaviour:** Registration is completed from inside the validation record, so the two processes are one record moving through tabs.
- **Required (v2 must do this):** Make Instrument Validation and Registration two separate sections/modules with their own navigation, records and labels. (Registration redesign is detailed in Section 9.)

### CR-021 — Confirm and build a process for re-validating or recapturing pre-populated instrument validation fields

- **Build phase:** Phase 2
- **Status:** Open item  |  Priority: Medium · 0.25 days · Sprint 1
- **Old build:** Part 6 Step 20.1 – Instrument Validation tab “QP & Qualification Information” (Name of QP, Address of QP, Contact Number, Contact Person) and required-documents confirmation; Part 8 Step 34.2 – FISA checklist header (Name of QP, Title of Qualification, SAQA ID, Credits, NQF Level pre-filled)
- **Current behaviour:** Fields are pre-populated from the earlier application with no way to confirm or correct them.
- **Required (v2 must do this):** Add a confirm (re-validate) or overwrite (recapture) mechanism for each pre-populated field, with the change recorded. The exact process still needs to be confirmed with QCTO.

### CR-023 — Correct instrument validation outcome routing to go directly to the QP, removing the Deputy Director step from this sub-process

- **Build phase:** Phase 2
- **Status:** Modify existing  |  Priority: High · 0.25 days · Sprint 1
- **Old build:** Part 6 Step 20.1 – ASD “Send to Deputy Director”; Part 6 Step 20.2 – “DD Review & Outcome” tab (Changes Required, Reviewed By, Outcome Decision: Approved / Approved with Conditions / Not Approved, Outcome Notes)
- **Current behaviour:** ASD sends the validation to the DD, and the DD records the outcome decision.
- **Required (v2 must do this):** The ASD's validation outcome goes straight back to the QP — no DD step. If changes are required, the QP fixes the instrument and resubmits it for re-validation (loop back to the ASD).

### CR-024 — Decouple instrument validation completion from automatically triggering EISA registration

- **Build phase:** Phase 2
- **Status:** Modify existing  |  Priority: High · 0.25 days · Sprint 1
- **Old build:** Part 6 Step 20.2 – DD “Approve & Send to EISA Registration”; Part 6 Step 21 – record then shows the EISA Registration tab
- **Current behaviour:** Approving the validation automatically opens the record for EISA registration.
- **Required (v2 must do this):** Completing validation only records a validated instrument. EISA Registration is started separately by the SDP for a specific EISA sitting (from the EISA Calendar) — not triggered by validation.

### CR-025 — Build a status-visibility dashboard for internal officials (QSA agenda / instrument validation status)

- **Build phase:** Phase 2
- **Status:** New feature  |  Priority: Medium · 0.5 days · Phase 2
- **Old build:** No dashboard documented – only per-section stat cards (e.g. EISA Validation Management: Pending Review, Schedule Submitted, Assistant Director …)
- **Current behaviour:** Officials can only see counts inside each section; there is no overview of where each QSA Addendum / instrument validation is.
- **Required (v2 must do this):** Build a dashboard for internal officials showing the QSA agenda and instrument validation status across all records.

### CR-020 — Confirm integration architecture for the legacy AIDB / item-bank system

- **Build phase:** Phase 0 (backend stub only — no screen)
- **Status:** Blocked  |  Backend
- **Old build:** Not covered in the current manual (instrument/item-bank source)
- **Current behaviour:** No link to the legacy AIDB / item bank.
- **Required (v2 must do this):** Integration architecture to be confirmed once QCTO has made an internal decision. Backend-dependent — parked in the Change Request appendix — legacy system integration, pending decision.

## 8. EISA Date & Calendar Management

*Old manual reference:* Not covered in the current manual. The only EISA date captured today is the “Proposed Date of EISA” on the QSA Addendum application (Part 2 Step 3 – being removed by CR-003); an “EISA Date” column also appears on the registration tables (Part 6 Steps 21–22) and “Date of Upcoming EISA” on the instrument checklist (Part 8 Step 34.2)

> Process map gap: no QCTO map covers this — it was described in the 6 August meeting. It must be a standalone module, not a tab inside the QSA Addendum or Registration screens.

### CR-027 — Build a standalone, continuously updatable EISA calendar module (QCTO-managed add/edit/delete)

- **Build phase:** Phase 3
- **Status:** New feature  |  Priority: Critical · 0.75 days · Phase 2
- **Old build:** Not covered – new module
- **Current behaviour:** No calendar exists.
- **Required (v2 must do this):** Build a standalone EISA Calendar module that QCTO staff can add to, edit and delete from at any time.

### CR-028 — Build the QP date-proposal → QCTO validation/approval → publish-to-calendar workflow

- **Build phase:** Phase 3
- **Status:** New feature  |  Priority: Critical · 0.5 days · Phase 2
- **Old build:** Not covered – new workflow
- **Current behaviour:** No workflow – the only date is the proposed date on the addendum.
- **Required (v2 must do this):** QP proposes EISA dates → QCTO validates/approves → approved dates are published to the calendar.

### CR-029 — Build an in-system EISA date submission form for the QP, replacing the external document process

- **Build phase:** Phase 3
- **Status:** New feature  |  Priority: High · 0.5 days · Sprint 1
- **Old build:** Not covered – dates are currently submitted to QCTO outside the system
- **Current behaviour:** QPs submit EISA dates via an external document.
- **Required (v2 must do this):** Add an in-system date submission form for the QP that feeds the CR-028 workflow.

### CR-030 — Build validation linking a qualification's approved EISA frequency to calendar submissions, enforcing the correct date count

- **Build phase:** Phase 3
- **Status:** Dependency  |  Priority: High · 0.5 days · Sprint 1
- **Old build:** Not covered – no “EISA frequency” value is captured on the QSA Addendum application or checklist (Part 2 Step 3, Part 4 Step 9)
- **Current behaviour:** No frequency rule exists, so any number of dates could be submitted.
- **Required (v2 must do this):** Validate each QP submission against the qualification's approved EISA frequency (e.g. 2 sittings a year → exactly 2 dates). Depends on the approved QSA Addendum carrying an EISA frequency value — confirm where this comes from.

### CR-031 — Redesign the data model to support multiple EISA dates per qualification per year

- **Build phase:** Phase 3
- **Status:** New feature  |  Priority: High · 0.25 days · Sprint 1
- **Old build:** Part 2 Step 3 – single “Proposed Date of EISA” value per application
- **Current behaviour:** One date per application/qualification.
- **Required (v2 must do this):** Change the data model so a qualification can hold multiple EISA dates per year (one-to-many).

### CR-032 — Build automated date-rejection validation (public holidays, lead time) plus a formal QCTO review/rejection-with-reason workflow

- **Build phase:** Phase 3
- **Status:** Open item  |  Priority: Medium · 0.5 days · Phase 2
- **Old build:** Not covered – new validation
- **Current behaviour:** No date checks.
- **Required (v2 must do this):** Auto-reject dates that fall on public holidays or inside the minimum lead time, and give QCTO a review/reject-with-reason action. The lead-time figure and the public-holiday source are not specified yet — confirm before building.

### CR-033 — Build in-app notification banners/alerts for approaching calendar deadlines, plus a visual calendar UI

- **Build phase:** Phase 3
- **Status:** New feature  |  Priority: Medium · 0.5 days · Sprint 1
- **Old build:** Not covered – new UI
- **Current behaviour:** No calendar view or deadline alerts.
- **Required (v2 must do this):** Add a visual calendar UI and in-app banners/alerts for upcoming deadlines (in-app only for now).

### CR-033 note — Real email/SMS delivery of calendar notifications

- **Build phase:** Phase 3
- **Status:** Blocked  |  Deferred
- **Old build:** Not covered
- **Current behaviour:** No email/SMS notifications.
- **Required (v2 must do this):** Real email/SMS delivery is deferred until the backend exists — in-app only for now. No build action yet.

### CR-034 — Build a formal EISA date cancellation/postponement workflow (QCTO-initiated only, reason required, SDP notifications, audit trail)

- **Build phase:** Phase 3
- **Status:** New feature  |  Priority: High · 0.5 days · Phase 2
- **Old build:** Not covered – new workflow
- **Current behaviour:** No way to cancel or postpone an EISA date.
- **Required (v2 must do this):** Only QCTO can cancel/postpone; a reason is mandatory; affected SDPs are notified (in-app); every change is kept in an audit trail.

## 9. EISA Registration

*Old manual reference:* Part 6 Step 21 (SDP – EISA Registration tab: Step 1 upload EISA Reg Document, LEISA File (.xlsx, 43 columns A–AQ) and SOR & QA Reports; Step 2 details – training start date, expected completion date, name/province/address of SDP; Step 3 categorise EISA Trades / EISA Non-Trades → “Send to Registration”), Part 6 Step 22 (Assistant Director – Trades Processing: Mark Documentation as Validated → Create Registration Number → Mark as Submitted to QP); side navigation “EISA Trades” / “EISA Non Trades”

> Agreed process (map 6 + meeting): registration needs a learner-enrolment link, an SOR compliance gate check, a Home Affairs ID check, a duplicate-registration block and an SDP compliance gate check. Trades and Non-Trades are two paths; Non-Trades also prepares files for the QP and shares the SDP list with Quality Assurance (see Part B).

### CR-035 — Separate registration from validation; build synced learner/SOR/document visibility on registration records

- **Build phase:** Phase 4
- **Status:** Modify existing  |  Priority: Critical · 0.5 days · Phase 2
- **Old build:** Part 6 Step 21 – registration completed inside the validation record; Part 6 Steps 22–23 – registration record shows “Submitted Documents” as file names only (EISA Reg Document, LEISA File, SOR & QA Reports)
- **Current behaviour:** Registration lives inside validation, and a registration record only lists uploaded file names.
- **Required (v2 must do this):** Registration is its own module (see CR-019). Each registration record shows the synced learners, each learner's SOR and the supporting documents.

### CR-036 — Redesign the EISA registration screen to select learners from a simulated “already-enrolled” list rather than a spreadsheet upload; add an SOR upload UI element

- **Build phase:** Phase 4
- **Status:** Modify existing  |  Priority: Critical · 0.5 days · Phase 2
- **Old build:** Part 6 Step 21 – “LEISA File *Required” Excel upload (Learner Enrolment and Readiness for EISA, naming LEISAyyyymmdd-SDP/AC name, 43 columns A–AQ)
- **Current behaviour:** The SDP uploads a spreadsheet of learners.
- **Required (v2 must do this):** Replace the spreadsheet with learner selection from a simulated already-enrolled learner list (QA-domain enrolment data, mocked for now) and add an SOR upload element per learner. Upload is UI-only for now.

### CR-036 note — AI/gate-check validation and virus scanning of SOR uploads

- **Build phase:** Phase 4
- **Status:** Blocked  |  Deferred
- **Old build:** Same screen – SOR upload
- **Current behaviour:** No checks on uploaded files.
- **Required (v2 must do this):** AI/gate-check validation and virus scanning are deferred until the backend exists. No build action yet.

### CR-038 — Build a non-compliant SOR flagging/notification workflow to the SDP

- **Build phase:** Phase 4
- **Status:** New feature  |  Priority: Medium · 0.25 days · Sprint 1
- **Old build:** Part 6 Step 22 – AD only has “Mark Documentation as Validated” (whole-package tick)
- **Current behaviour:** Documents are validated as one package; there is no way to flag a single SOR as non-compliant.
- **Required (v2 must do this):** Let the official flag an individual SOR as non-compliant with a reason and send an in-app notification back to the SDP to correct it.

### CR-040 — Build a control to block duplicate/concurrent EISA registrations for the same learner

- **Build phase:** Phase 4
- **Status:** New feature  |  Priority: High · 0.25 days · Sprint 1
- **Old build:** Part 6 Steps 21–22 – no learner-level check (learners only exist inside the uploaded spreadsheet)
- **Current behaviour:** The same learner could be registered for more than one EISA at a time.
- **Required (v2 must do this):** Block registration if the learner already has an active/concurrent EISA registration, with a clear message. Works off the learner selection built in CR-036.

### CR-041 — Add a compliance/monitoring-status indicator on the registration screen (simulated SDP status) that visually blocks registration when status is non-compliant

- **Build phase:** Phase 4
- **Status:** Cross-domain  |  Priority: Medium · 0.25 days · Sprint 1
- **Old build:** Part 6 Step 21 – registration screen (no compliance information shown)
- **Current behaviour:** No SDP compliance status is shown or checked.
- **Required (v2 must do this):** Show the SDP's compliance/monitoring status and block registration when it is non-compliant. Status is simulated/mock data until the QA-domain backend exists (QA owns SDP compliance status; Assessments reads it).

### CR-042 — Add an RPL/ARPL indicator field to the registration data model, triggering the Assessments-specific monitoring workflow

- **Build phase:** Phase 4
- **Status:** New feature  |  Priority: Medium · 0.25 days · Sprint 1
- **Old build:** Part 6 Step 21 – registration details (no RPL/ARPL field)
- **Current behaviour:** No way to mark a registration as RPL/ARPL.
- **Required (v2 must do this):** Add an RPL/ARPL indicator. When set, it automatically creates an Assessments monitoring item (this is the only auto-trigger into Site Visits — see CR-044).

### CR-037 — Build the Qualifications ↔ Modules database relationship and AI validation of an uploaded SOR against required modules

- **Build phase:** Phase 0 (backend stub only — no screen)
- **Status:** Blocked  |  Backend
- **Old build:** Part 6 Step 21 – SOR & QA Reports upload
- **Current behaviour:** SORs are not checked against the qualification's modules.
- **Required (v2 must do this):** Link qualifications to their modules and auto-validate each SOR against the required modules. Backend-dependent — parked in the Change Request appendix — needs a real Qualifications↔Modules database relationship and AI validation.

### CR-039 — Integrate the Home Affairs ID-validation API at the learner enrolment stage (Quality Assurance domain)

- **Build phase:** Phase 0 (backend stub only — no screen)
- **Status:** Blocked  |  Backend
- **Old build:** Not in this manual – learner enrolment sits in the Quality Assurance domain
- **Current behaviour:** No ID verification.
- **Required (v2 must do this):** Home Affairs G2G API check at QA-domain learner enrolment (ID verification and “double dipping” detection), which Assessments then relies on. Backend-dependent — parked in the Change Request appendix — needs a live Home Affairs API.

## 10. EISA Confirmation (formerly “EISA Notification”)

*Old manual reference:* Part 6 Step 23 (QP – Registration Docs tab: “EISA Notification Ready” → “Send EISA Notification”, which moves the record into Site Visit and Monitoring), Part 7 Step 24 (record appears in Incoming Requests as “EISA Notification: EISA-1”)

> Process map gap: no QCTO map covers EISA Confirmation — it was described in the meeting. In the main highway it sits between EISA Registration and Marking & Moderation monitoring.

### CR-043 — Rename “EISA Notification” to “EISA Confirmation”; build the system-generated consolidated learner list view and confirmation capture (assessment centres, learner counts, marking/moderation dates)

- **Build phase:** Phase 4
- **Status:** Modify existing  |  Priority: High · 0.5 days · Phase 2
- **Old build:** Part 6 Step 23 – “Send EISA Notification” button / “EISA Notification Ready” panel; Part 7 Step 24 – Incoming Requests “EISA Notification Received”
- **Current behaviour:** The QP clicks “Send EISA Notification”, which pushes the record into Site Visits & Monitoring. No learner list is shown and nothing is confirmed.
- **Required (v2 must do this):** Rename this step “EISA Confirmation”. QCTO shares a system-generated consolidated list of registered learners with the QP; the QP acknowledges it and confirms the assessment centres, learner counts and marking/moderation dates. It must no longer auto-create a site visit (see CR-044).

## 11. Site Visits & Monitoring — Module Structure & Visibility

*Old manual reference:* Part 6 Step 23 → Part 7 Steps 24–31; internal tabs Incoming Requests, Planning & Scheduling, Site Visit Execution, Evaluation & Reports, Approvals & Outcomes, Monitoring Dashboard; external tabs Notifications & Submissions, Site Visit Schedules, Reports & Outcomes; external header cards Total Records, Pending Assessment, Schedules Received, Results Received; Part 8 Step 35 (FISA “continues to Steps 24–31”)

> Agreed structure: a standalone Site Visits & Monitoring hub where officials see and schedule ANY type of visit (EISA readiness, marking & moderation, post-EISA monitoring, RPL/ARPL monitoring) independently of the registration pipeline. The manual's statement that “both paths eventually converge into site visit and monitoring” no longer applies.

### CR-044 — Decouple Site Visits & Monitoring into a standalone module; auto-trigger monitoring only for RPL/ARPL cases

- **Build phase:** Phase 5
- **Status:** Modify existing  |  Priority: Critical · 0.75 days · Phase 2
- **Old build:** Part 6 Step 23 → Part 7 Step 24 – every record arrives in Incoming Requests after “Send EISA Notification”; Part 8 Step 35 – FISA records also flow into Steps 24–31
- **Current behaviour:** Site visits only exist as the last stage of a registration/FISA record; every record is pushed in automatically.
- **Required (v2 must do this):** Make Site Visits & Monitoring a standalone module where visits are created/scheduled by officials. The only automatic trigger is an RPL/ARPL-flagged registration (CR-042).

### CR-045 — Remove the obsolete “schedules received” metric; rename “results received” to “reports received”

- **Build phase:** Phase 5
- **Status:** Modify existing  |  Priority: Low · 0.25 days · Sprint 1
- **Old build:** Part 7 Step 29 – external Site Visits & Monitoring header cards (“Schedules Received”, “Results Received”)
- **Current behaviour:** The external dashboard shows “Schedules Received” and “Results Received” counters.
- **Required (v2 must do this):** Remove the “Schedules Received” card. Rename “Results Received” to “Reports Received”.

### CR-046 — Remove deprecated/leftover UI tabs from the previous build version

- **Build phase:** Phase 5
- **Status:** Modify existing  |  Priority: Low · 0.25 days · Sprint 1
- **Old build:** Part 7 Steps 24–31 – site-visit record modal still carries earlier-stage tabs (Validation Schedule, Liaise with QP, Instrument Validation, DD Review & Outcome, Registration Docs); Part 8 Step 32 – FISA records carry “QASA Eval. Checklist” / “QASA Eval. Report” tabs
- **Current behaviour:** Records keep every tab from previous stages/builds, so leftover tabs appear where they no longer belong.
- **Required (v2 must do this):** Remove the deprecated/leftover tabs. The tabs listed here are the likely candidates seen in the manual — confirm the exact list against the client's feedback before deleting.

### CR-047 — Restrict QP visibility to only their own relevant visits/schedules; move scheduling into its own standalone tab

- **Build phase:** Phase 5
- **Status:** Modify existing  |  Priority: High · 0.5 days · Sprint 1
- **Old build:** Part 7 Step 29 – external Notifications & Submissions / Site Visit Schedules / Reports & Outcomes lists; internal Part 7 Step 25 – Planning & Scheduling tab
- **Current behaviour:** The QP view lists records without an ownership filter, and scheduling is mixed into the visit record flow.
- **Required (v2 must do this):** Filter the QP view to only that QP's own visits and schedules. Give scheduling its own standalone tab.

### CR-054 — Decide and implement cross-unit report visibility rules within the Assessment domain

- **Build phase:** Phase 5
- **Status:** Open item  |  Priority: Medium · 0.25 days · Sprint 1
- **Old build:** Part 7 – Evaluation & Reports and Approvals & Outcomes tabs (visible to every internal role via the role dropdown)
- **Current behaviour:** All internal roles/units can see all reports.
- **Required (v2 must do this):** Define which units can see which reports (rules still to be decided with QCTO), then implement them.

## 12. Site Visit Planning & Execution

*Old manual reference:* Part 7 Step 25 (Planning & Scheduling – Schedule Title, Schedule Date, Schedule Time, Venue/Site, Monthly Plan Month, Assigned Officials, Monthly Plan Summary → “Save Plan & Submit for Review”), Part 7 Step 26 (DD Recommend → Domain Director Approve Plan), Part 7 Step 27 (Sub Domain Admin – Book Site Visit), Part 7 Step 28 (Deputy & Assistant Director – “Quality Assurance Report – QCTO Occupational Qualifications Marking Sessions”)

### CR-048 — Build a dynamic, visit-type-driven site visit execution form using QCTO's existing templates

- **Build phase:** Phase 5
- **Status:** Dependency  |  Priority: High · 0.5 days · Phase 2
- **Old build:** Part 7 Step 28 – Site Visit Execution tab, single fixed form “Quality Assurance Report – QCTO Occupational Qualifications Marking Sessions” (assessor/marker and moderator details, sections 1–8, General Comments, Completion Details)
- **Current behaviour:** Every visit uses the same marking-sessions form, whatever the visit type.
- **Required (v2 must do this):** The execution form changes according to visit type (EISA readiness, marking & moderation, post-EISA monitoring, RPL/ARPL) using QCTO's existing templates. Needs the template set from QCTO.

### CR-049 — Add QP and qualification selection fields at the top of the visit execution form

- **Build phase:** Phase 5
- **Status:** New feature  |  Priority: Low · 0.25 days · Sprint 1
- **Old build:** Part 7 Step 28 – execution form starts with “Approved Schedule Reference” and “Monthly Plan Summary”
- **Current behaviour:** No QP or qualification selection on the form.
- **Required (v2 must do this):** Add QP and qualification selection fields at the top of the execution form.

### CR-050 — Link marking/moderation sessions to a specific EISA sitting/calendar date, with auto-populate

- **Build phase:** Phase 5
- **Status:** Dependency  |  Priority: Medium · 0.25 days · Sprint 1
- **Old build:** Part 7 Step 25 – Schedule Date entered manually; Step 28 – Approved Schedule Reference (Date, Time, Venue, Assigned Officials)
- **Current behaviour:** Visit dates are typed in by hand with no link to an EISA sitting.
- **Required (v2 must do this):** Select the EISA sitting from the EISA Calendar and auto-populate the session date/details. Depends on the calendar (CR-027, Phase 2) — use simulated sittings until then.

### CR-051 — Build a notification-type flag (notified / unannounced) with configurable lead time for site visits

- **Build phase:** Phase 5
- **Status:** New feature  |  Priority: Medium · 0.25 days · Sprint 1
- **Old build:** Part 7 Step 25 – Planning & Scheduling form (no notification-type field)
- **Current behaviour:** Every visit is treated the same way; no announced/unannounced option.
- **Required (v2 must do this):** Add a Notified / Unannounced flag on each visit, with a configurable notice lead time for notified visits.

## 13. Site Visit Report Approval Workflow

*Old manual reference:* Part 7 Step 26 (DD “Recommend to Domain Director”, Domain Director “Approve Plan”), Part 7 Step 28 (Deputy & Assistant Director – Finalise Evaluation Report → Send Results to Quality Partner), Part 7 Steps 30–31 (AD PEM Report → DD “Recommend PEM Report”)

> Terminology flag: the role dropdown has a combined “Deputy & Assistant Director” role that both completes and finalises the evaluation report at Step 28. This is the root of the self-approval bug — the ASD and DD must be separate roles with separate steps.

### CR-053 — Fix the site visit report approval workflow — remove the self-approval/login-context bug; route to the submitter's direct manager

- **Build phase:** Phase 5
- **Status:** Modify existing  |  Priority: Critical · 0.5 days · Sprint 1
- **Old build:** Part 7 Step 28 – “Deputy & Assistant Director” completes the report, clicks “Finalize Evaluation Report” and “Send Results to Quality Partner” with no separate approver
- **Current behaviour:** The same login (combined role) writes and approves its own report, then releases it to the QP.
- **Required (v2 must do this):** Two explicit steps: the ASD submits the report → the submitter's direct manager (DD) approves it. The approver must always be a different user from the submitter (process map 10 correction).

### CR-055 — Build flexible approval routing with manual override and a mandatory audit note for workload-sharing scenarios

- **Build phase:** Phase 5
- **Status:** New feature  |  Priority: Medium · 0.5 days · Phase 2
- **Old build:** Not covered – approvals are fixed to one role per step
- **Current behaviour:** Approver is fixed; work cannot be redirected when a manager is unavailable.
- **Required (v2 must do this):** Allow an approval to be manually re-routed to another approver, with a mandatory audit note explaining why.

### CR-056 — Add “send back for clarification” and “reject” actions to report approval screens

- **Build phase:** Phase 5
- **Status:** New feature  |  Priority: Medium · 0.25 days · Sprint 1
- **Old build:** Part 7 Step 26 (“Recommend to Domain Director”, “Approve Plan”), Step 31 (“Recommend PEM Report”) – forward/approve actions only
- **Current behaviour:** Approvers can only move a report forward.
- **Required (v2 must do this):** Add “Send back for clarification” and “Reject” actions (with a reason) on every report approval screen.

## 14. Post-EISA Monitoring & Results Sharing

*Old manual reference:* Part 7 Step 29 (QP – Reports & Outcomes > “Submit Approved Results” tab: Facilitator Questionnaire + Learner Questionnaire → “Submit Approved Results to Assessment Domain”; external “New Approved Results” button), Part 7 Steps 30–31 (AD – PEM Report → DD recommend)

### CR-057 — Restrict Facilitator & Learner Questionnaires to the Post-EISA-Monitoring visit type, gated on results approval

- **Build phase:** Phase 5
- **Status:** Modify existing  |  Priority: Low · 0.25 days · Sprint 1
- **Old build:** Part 7 Step 29 – questionnaires shown on every record (including “Marked & Moderated Scripts” records)
- **Current behaviour:** Questionnaires appear for every visit type, before any results are approved.
- **Required (v2 must do this):** Only show the Facilitator and Learner Questionnaires on Post-EISA Monitoring visits, and only once the related results have been approved.

### CR-058 — Rename/redesign the “submit approved results” step to reflect the actual outcome-sharing process

- **Build phase:** Phase 5
- **Status:** Open item  |  Priority: Low · 0.25 days · Sprint 1
- **Old build:** Part 7 Step 29 – “Submit Approved Results” tab and “Submit Approved Results to Assessment Domain” button
- **Current behaviour:** The label implies the QP is submitting approved results, but the step is really about sharing visit outcomes/questionnaires.
- **Required (v2 must do this):** Rename and redesign the step so it reflects outcome-sharing (QCTO shares the visit outcome; QP responds). Final label/wording to be agreed with QCTO.

### CR-052 — Surface the linked marking/moderation monitoring status on the approval-of-results screen

- **Build phase:** Phase 6
- **Status:** Dependency  |  Priority: Medium · 0.25 days · Sprint 1
- **Old build:** Not covered – the Approval of Results screen does not exist yet (Section 15)
- **Current behaviour:** No link between monitoring and results approval.
- **Required (v2 must do this):** Show the linked marking & moderation monitoring status on the Approval of Results screen so approvers can see it before signing off. Depends on CR-059 (and CR-050 linking).

## 15. Approval of Results (Missing Process)

*Old manual reference:* Not covered in the current manual. Closest existing screens: Part 7 Step 29 (“Submit Approved Results”, “New Approved Results” button) and Part 7 Step 30 (internal “Approvals & Outcomes” tab)

> Agreed process (map 10): QP submits a results batch → several layers of checking (compliance review, evidence evaluation, folder-by-folder compliance checks) by Assistant Director → Deputy Director → Director → Chief Director final approval → recommendation to the Certification domain to print certificates. This is the step that unlocks certification.

### CR-059 — Build the full “Approval of Results” module: QP result submission within a 21-working-day SLA, QCTO evaluate/approve/decline, recommendation to the Certification domain

- **Build phase:** Phase 6
- **Status:** New feature  |  Priority: Critical · 1.25 days · Phase 2
- **Old build:** Not covered – new module
- **Current behaviour:** No results approval process exists.
- **Required (v2 must do this):** Build: QP results-batch submission with a visible 21-working-day deadline; QCTO compliance review, evidence evaluation and folder-by-folder checks; approve/decline through AD → DD → Director → Chief Director; on approval, a recommendation to print certificates.

### CR-059 (hand-off) — Recommendation to the Certification domain on approval

- **Build phase:** Phase 6
- **Status:** Cross-domain  |  Part of CR-059
- **Old build:** Not covered – the current process stops before certification
- **Current behaviour:** No hand-off to Certification.
- **Required (v2 must do this):** On Chief Director approval, send a recommendation to print certificates to the Certification domain. Needs agreement on what the Certification domain receives.

### CR-060 — Rename the incorrectly labelled existing “Approval of Results” tab to free up the correct naming

- **Build phase:** Phase 6
- **Status:** Confirm/terminology  |  Priority: Low · 0.25 days · Sprint 1
- **Old build:** The manual does not show a tab literally named “Approval of Results”. Likely candidates: internal “Approvals & Outcomes” tab (Part 7 Step 30), external “Submit Approved Results” tab / “New Approved Results” button (Part 7 Step 29)
- **Current behaviour:** An existing tab uses the “Approval of Results” name for something that is not the real results-approval process.
- **Required (v2 must do this):** Rename that tab so the “Approval of Results” name is reserved for the new module (CR-059). Confirm which tab the client meant and its new name.

## 16. FISA — Independent Skills Programme Track

*Old manual reference:* Path Split Determination (Failed application → FISA Standards), Part 8 Step 32 (FISA Standards: DD Allocate to ASD → ASD Final Evaluation → Director & Team → AIC → Qualifications Development approve → DD “Mark Complete and Move to External”), Part 8 Step 33 (SDP – Validation of FISA, Upload Instrument), Part 8 Step 34 (AD Allocation → ASD Conduct Validation → DD Review → Submit & Notify SDP), Part 8 Step 35 (continue to Site Visits Steps 24–31)

> Flow correction: in the current build a FISA record only exists because a QASA application FAILED the gate check (records are tagged “Routed from QASA” and carry QASA Eval. Checklist/Report tabs). In the agreed process FISA is its own process for Skills Programmes, with its own trigger (a new Skills Programme needs a final-assessment standard), its own participants and its own approvers — it is never a fallback of the QSA/EISA track. Related process-map items without a CR number are listed in Part B.

### CR-026 — Rebuild FISA as a fully independent process (FISA Standards → evaluation/approval → instrument development → instrument validation → registration), decoupled from the EISA/QSA Addendum flow

- **Build phase:** Phase 7
- **Status:** New feature  |  Priority: Critical · 1 days · Phase 2
- **Old build:** Path Split Determination; Part 8 Steps 32–35
- **Current behaviour:** FISA starts from a failed QASA gate check, has no instrument-development or FISA-registration stage, and ends by joining the EISA site-visit flow.
- **Required (v2 must do this):** Rebuild as a standalone module: FISA Standards (source documents from Qualifications Development) → evaluation/approval (final sign-off by Qualifications Development Director & Team) → instrument development → FISA instrument validation (SDP submits) → FISA registration. Remove the dependency on the QASA gate check and the QASA tabs.

## 17. System-Wide Data Foundations (Backend)

*Old manual reference:* Not covered in the current manual — backend scope

### CR-001 — Build database structures for dependent domains (e.g. Qualifications Development) ahead of their front-end builds, so Assessments can integrate with real data early

- **Build phase:** Phase 0 (backend stub only — no screen)
- **Status:** Blocked  |  Backend
- **Old build:** Not covered – Assessments currently uses simulated documents (e.g. “SAQA_Qualification_Document_AUTO.pdf” at Part 3 Step 8)
- **Current behaviour:** Documents and data from other domains are mocked.
- **Required (v2 must do this):** Create the database structures for dependent domains early so Assessments can read real data. Backend-dependent — parked in the Change Request appendix — needs real database structures for another domain.

### CR-002 — Implement a data-quality gate-check at the point of data entry across the system

- **Build phase:** Phase 0 (backend stub only — no screen)
- **Status:** Blocked  |  Backend
- **Old build:** Not covered – applies to every data-entry form
- **Current behaviour:** No central data-quality validation.
- **Required (v2 must do this):** Add data-quality checks at the point of data entry across the system. Backend-dependent — parked in the Change Request appendix — backend data-quality validation infrastructure, not a screen.

## 18. Process & Delivery Notes (Governance — not a manual location)

*Old manual reference:* Change Request document – Summary, Delivery Plan and Estimate Assumptions sections

### Process note — Re-wire all simulated/mock data to real data sources once backend development begins

- **Build phase:** Phase 8
- **Status:** Dependency  |  Process note
- **Old build:** Process note
- **Current behaviour:** Several items are built on mock/placeholder data (compliance status, enrolled-learner lists, SOR uploads).
- **Required (v2 must do this):** Track every simulated item (CR-036, CR-041, CR-050 and similar) so it is re-wired to the real QA / Qualifications / Certification data sources when the backend starts.

### Process note — Estimates exclude client review cycles, UAT and sign-off time

- **Build phase:** Phase 8
- **Status:** Open item  |  Process note
- **Old build:** Process note
- **Current behaviour:** N/A
- **Required (v2 must do this):** Plan separate time for client review, UAT and sign-off of the 52 frontend CRs (estimates cover build + internal testing only, single developer working sequentially).

### Process note — Formal sign-off of the change request list by QCTO – Assessments Domain

- **Build phase:** Phase 8
- **Status:** Open item  |  Process note
- **Old build:** Process note
- **Current behaviour:** Change Request document prepared by Jade Klynsmith, reviewed by Dave Reevell, awaiting sign-off by QCTO – Assessments Domain.
- **Required (v2 must do this):** Obtain QCTO Assessments sign-off. Accreditation and Quality Assurance change requests are tracked separately (see the Accreditation & QA mapping document).

## Process-map items with no CR number yet

These came out of the process-map review. They are not in the change request register, so they have PM- numbers. Build them as described and flag the open questions in `progress.md`.

### PM-01 — FISA instrument validation outcome should route straight back to the SDP — no Deputy Director step

- **Build phase:** Phase 7
- **Status:** Open item
- **Old build:** Part 8 Step 34.2 – ASD “Submit EISA Report to Deputy Director”; Part 8 Step 34.3 – DD Review (Final Recommendation: Approved / Approved with Conditions / Not Approved) → “Submit & Notify SDP”
- **Current behaviour:** The ASD's FISA validation goes to the DD, who records the recommendation and notifies the SDP.
- **Required (v2 must do this):** Mirror CR-023 for FISA: the ASD's outcome goes directly to the SDP; if changes are needed the SDP fixes the instrument and resubmits. No CR number covers the FISA side yet — confirm and fold into CR-026 or raise a new CR.

### PM-02 — Rename “Validation of FISA” to “FISA Instrument Validation”

- **Build phase:** Phase 7
- **Status:** Confirm/terminology
- **Old build:** Side navigation “FISA > Validation of FISA” (internal) and “Validation of FISA” (external); Part 8 Steps 33–34
- **Current behaviour:** Section is called “Validation of FISA”.
- **Required (v2 must do this):** Rename to “FISA Instrument Validation” — the client said “validation” on its own is ambiguous. Confirm label and fold into CR-026.

### PM-03 — FISA output document labelled “EISA Validation Report” — should be “FISA Validation Report”

- **Build phase:** Phase 7
- **Status:** Modify existing
- **Old build:** Part 8 Step 34.2 – button “Submit EISA Report to Deputy Director”; Part 8 Step 34.3 – heading “Review EISA Validation Report & Recommend”; FISA checklist fields “Name of QP” and “Date of Upcoming EISA”
- **Current behaviour:** Copy-paste leftovers from the EISA screens show EISA wording on FISA records.
- **Required (v2 must do this):** Change all FISA labels to FISA wording (“FISA Validation Report”), and review the copied fields (FISA is submitted by an SDP, not a QP; there is no EISA date on a FISA record).

### PM-04 — Three distinct names instead of the overloaded “EISA Notification”

- **Build phase:** Phase 0
- **Status:** Confirm/terminology
- **Old build:** External Site Visits & Monitoring “New EISA Notification” button; Incoming Requests modal “EISA Notification: EISA-1” / stage “EISA Notification Received” (Part 7 Step 24); Part 6 Step 23 “Send EISA Notification”
- **Current behaviour:** One label is used for the readiness trigger, the marking/moderation visit request and the learner-list acknowledgement.
- **Required (v2 must do this):** Use three different names: (1) QP EISA Readiness notification, (2) Marking & Moderation visit request, (3) EISA Confirmation (CR-043). Names for (1) and (2) still need to be agreed with QCTO.

### PM-05 — Build the QP EISA Readiness process (readiness site visit, jointly with Quality Assurance)

- **Build phase:** Phase 5
- **Status:** Cross-domain
- **Old build:** Not covered in the current manual
- **Current behaviour:** No readiness step exists.
- **Required (v2 must do this):** QP notifies QCTO that an EISA sitting is coming → QCTO (Assistant Director/Assessor, jointly with the QA domain) runs a readiness site visit → readiness site-visit report. Sits between Instrument Validation and Registration on the main highway. Needs a CR raised and agreement with QA on the joint visit.

### PM-06 — Post-EISA Monitoring should only be triggered when an approved results batch shows a low competency (pass) rate

- **Build phase:** Phase 5
- **Status:** Open item
- **Old build:** Part 7 Steps 30–31 – a PEM Report is compiled for every record after Step 29
- **Current behaviour:** PEM runs for every record regardless of results.
- **Required (v2 must do this):** Trigger PEM only from an approved results batch (CR-059) whose competency rate is below a threshold. The threshold is not defined — confirm with QCTO and raise a CR.

### PM-07 — Share the Post-EISA Monitoring (PEM) report with QA, the QP, Accreditation and the SDP

- **Build phase:** Phase 5
- **Status:** Cross-domain
- **Old build:** Part 7 Step 31 – DD “Recommend PEM Report” (process ends there)
- **Current behaviour:** The PEM report stops at the DD recommendation.
- **Required (v2 must do this):** After approval, distribute the PEM report to the Quality Assurance domain, the QP, the Accreditation domain and the SDP.

### PM-08 — EISA Registration – Non-Trades path prepares files for the QP and shares the SDP list with Quality Assurance

- **Build phase:** Phase 4
- **Status:** Cross-domain
- **Old build:** Part 6 Step 22 – only the Trades Processing tab is documented (EISA Non Trades side navigation exists but its processing is not described)
- **Current behaviour:** Non-Trades processing is not documented separately from Trades.
- **Required (v2 must do this):** Build/confirm the Non-Trades path: validate paperwork, prepare files for the QP and share the SDP list with the QA domain. Confirm the exact differences from the Trades path with QCTO.

### PM-09 — Build the RPL Toolkit Evaluation module (Application → Evaluation → Approval)

- **Build phase:** Phase 7
- **Status:** New feature
- **Old build:** Not covered in the current manual
- **Current behaviour:** No RPL Toolkit process exists.
- **Required (v2 must do this):** Standalone module (no links to the other maps): QP submits a new/updated RPL Toolkit → Assistant Director → ASD evaluation → Director & Deputy Director + Team → IAC → CEO signs outcome. Reuse the shared checklist component. Not in the change request list — needs a CR raised.

### PM-10 — FISA Standards final sign-off by the Qualifications Development Director & Team (not the Assessments CEO)

- **Build phase:** Phase 7
- **Status:** Already built
- **Old build:** Part 8 Step 32.5 – Qualifications Development “Approve and Return to Deputy Director”
- **Current behaviour:** Qualifications Development already approves FISA Standards in the build.
- **Required (v2 must do this):** Keep this sign-off when FISA is rebuilt (CR-026); verify that no Assessments CEO step is added.

### PM-11 — Validation of FISA is triggered by the SDP notifying QCTO

- **Build phase:** Phase 7
- **Status:** Already built
- **Old build:** Part 8 Step 33 – external “Validation of FISA” section with “Notify New Validation” button and Upload Instrument tab; Part 8 Step 34.1 – Assistant Director allocation
- **Current behaviour:** The SDP can already notify and upload an instrument; the Assistant Director allocates it.
- **Required (v2 must do this):** Keep this trigger in the rebuilt FISA module (CR-026); verify it is no longer dependent on a FISA Standard coming from a failed QASA.
