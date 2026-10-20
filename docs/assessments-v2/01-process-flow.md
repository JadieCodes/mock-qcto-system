**QCTO Assessments Domain**

**A Plain-English Guide to the Process Maps**

*Written for someone building the system with no prior background in how QCTO's assessment process works.*

Based on the 10 QCTO “To Be” process maps, the 6 August 2026 client review meeting, and the consolidated Assessments change request register (CR-001 to CR-060).

Version 2 — corrected 20 October 2026 (original 12 August 2026)

# What Changed in Version 2

Version 1 was checked against the Assessments change request register. Most of it already matched. These are the corrections made in this version:

- **The stages are linked by data, not by triggers —** Version 1 said each process's output is the next one's trigger. The change requests say the opposite: finishing instrument validation must NOT start registration (CR-024), and site visits are NOT started automatically by registration (CR-044). The stages still happen in order, but each one is started on its own.

- **EISA Date & Calendar added to the main highway —** The calendar is what registration and marking/moderation hang off (CR-003, CR-024, CR-050), so it now sits in the highway, running alongside it.

- **FISA track completed —** Added the missing instrument development and FISA registration stages (CR-026).

- **EISA Registration updated —** Learners are selected from an already-enrolled list, not uploaded in a LEISA spreadsheet (CR-036). The RPL/ARPL flag auto-creates a monitoring item (CR-042, CR-044).

- **Readiness and Post-EISA Monitoring triggers flagged —** Neither the EISA Readiness stage nor the “low competency rate” trigger appears in the change request register. Both are kept, marked “to confirm with QCTO”.

- **Missing routing rules added —** The IAC can decline (CR-016); corrections go DD → ASD → QP (CR-012); joint ASD/QP scheduling (CR-017); auto-generated letters (CR-005, CR-013); process-stage teams (CR-015).

- **Change request numbers added —** Every process now lists the CRs that apply to it, and a new Section 9 lists everything still to confirm with QCTO.

- **Tidy-up —** Map numbers in Section 7 now match Section 3; numbered lists restart correctly; one name used for the addendum (“QSA Addendum”, as in the change request register).

# 1. Key Terms (read this first)

If you only read one section before diving into code, read this one. Everything below assumes you know these words.

| **Term**                                | **What it means**                                                                                                                                                                                                                                                                                                    |
|-----------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **QCTO**                                | Quality Council for Trades & Occupations — the government body that regulates trade and occupational qualifications in South Africa. This is who the whole system is being built for.                                                                                                                                |
| **Assessments Domain**                  | The part of QCTO you're building software for. Its job is to make sure the final exam that decides whether a learner is “competent” is properly written, checked, run, and marked.                                                                                                                                   |
| **QP (Quality Partner)**                | Usually a SETA. The QP “owns” a qualification on QCTO's behalf — think of them as the project manager for that qualification. The current build still says “AQP” in places; it is being renamed “QP” everywhere (CR-006).                                                                                            |
| **SDP (Skills Development Provider)**   | The actual training provider — a college, company, or training centre — that teaches the learners day to day. SDPs report up to QPs.                                                                                                                                                                                 |
| **Qualification vs Skills Programme**   | A Qualification is a full trade or occupation (e.g. “Electrician”). A Skills Programme (SP) is one smaller, standalone piece of a qualification that can be completed and certified on its own.                                                                                                                      |
| **EISA**                                | External Integrated Summative Assessment — the final external exam a learner must pass to be certified competent in a full Qualification. “External” means QCTO controls it, not the training provider.                                                                                                              |
| **EISA sitting**                        | One scheduled date on which an EISA is written. A qualification can have several sittings a year (CR-031). Approved sittings live on the EISA Calendar.                                                                                                                                                              |
| **FISA**                                | Final Integrated Summative Assessment — the equivalent final exam for a Skills Programme. It runs on its own separate track, never as a branch of the EISA track.                                                                                                                                                    |
| **QSA Addendum**                        | The document that specifies exactly how a qualification will be assessed — what's tested, in what format, how it's weighted. The QP drafts it; QCTO evaluates and approves it. It is written “QAS” / “QASA” on some maps and in the current build — confirm the official on-screen label with QCTO.                  |
| **Instrument / Instrument Validation**  | “Instrument” is the actual exam paper, task, memo and rubric. “Instrument Validation” is QCTO checking that the instrument genuinely tests what the approved QSA Addendum (or FISA Standard) says. The processes are called “EISA Instrument Validation” and “FISA Instrument Validation” — never just “validation”. |
| **EISA Confirmation**                   | The step after registration where QCTO shares the final registered-learner list with the QP, and the QP confirms the assessment centres, learner counts and marking/moderation dates. Previously called “EISA Notification” (CR-043).                                                                                |
| **RPL / ARPL / RPL Toolkit**            | Recognition of Prior Learning — assessing someone on real-world experience instead of formal training. ARPL is the artisan-specific version. An RPL Toolkit is the approved set of instruments used for this. Registrations carry an RPL/ARPL indicator (CR-042).                                                    |
| **SOR (Statement of Results)**          | The official record of a learner's training results, only available once training is complete. A learner needs a valid SOR before they can be registered for an EISA.                                                                                                                                                |
| **Marking & Moderation**                | After an exam, markers grade the scripts, and moderators independently double-check that the marking was fair and consistent.                                                                                                                                                                                        |
| **Site Visit**                          | Any in-person (or virtual) check QCTO does — readiness, marking/moderation monitoring, RPL/ARPL monitoring, or post-results monitoring. All site visits are managed in one standalone Site Visits & Monitoring hub. A visit can be notified or unannounced (CR-051).                                                 |
| **ASD**                                 | An Assessment Standards Domain official who does the hands-on evaluation and validation work day to day.                                                                                                                                                                                                             |
| **DD (Deputy Director)**                | A senior manager who reviews and signs off work coming from ASDs. The DD is the ASD's direct manager for report approvals.                                                                                                                                                                                           |
| **Director / Chief Director**           | More senior sign-off levels, mainly involved in Approval of Results. The Chief Director gives the final approval of a results batch.                                                                                                                                                                                 |
| **IAC (Internal Assessment Committee)** | A QCTO-wide committee of all Domain Directors and Chief Directors. Gives the final internal approval (or decline) on a QSA Addendum, based on a summary presentation, not by re-checking the full evaluation. The current build shows both “IAC” and “AIC” — they are the same committee; use IAC.                   |
| **CEO's role**                          | Only signs the final outcome letter, after the IAC has approved. The CEO does not tick any checklist or redo any checks (CR-008).                                                                                                                                                                                    |
| **Process-stage teams**                 | Work is assigned by stage (e.g. QSA evaluation team, instrument validation team, registration team, site visits team), not by which official “owns” a QP's portfolio (CR-015).                                                                                                                                       |
| **SAQA**                                | South African Qualifications Authority. QCTO checks with SAQA (via an API) whether a qualification is already registered.                                                                                                                                                                                            |
| **Qualifications Development Domain**   | The QCTO domain that builds qualifications and curricula. Supplies documents for unregistered qualifications and for FISA Standards, and gives the final sign-off on FISA Standards.                                                                                                                                 |
| **Quality Assurance (QA) Domain**       | The QCTO domain that monitors training delivery, learner enrolment and SDP compliance. Assessments reads learner enrolment and SDP compliance status from QA.                                                                                                                                                        |
| **Certification Domain**                | The QCTO domain that prints certificates, once Assessments approves a learner's results.                                                                                                                                                                                                                             |

# 2. The Story: How a Learner Actually Gets Certified

Before looking at the process maps individually, it helps to understand the journey they're all part of, told as a simple story.

1.  A qualification exists (say, “Electrician”). It may already be registered with SAQA, or it may be new.

2.  Before any learner can be assessed, QCTO needs an assessment “blueprint” for that qualification — the QSA Addendum. The QP submits it. If the qualification is SAQA-registered, the supporting documents are pulled in automatically; if not, they are uploaded manually. Either way it goes through the same evaluation: ASD → Deputy Director → IAC approval. The CEO then signs the outcome letter.

3.  Once the blueprint is approved, someone has to write the actual exam paper (the “instrument”). QCTO doesn't write it — but the ASD validates it against the approved blueprint, on a date agreed jointly with the QP. This is EISA Instrument Validation. The result goes straight back to the QP. Validating the instrument does not register anyone for an exam.

4.  The QP proposes EISA sitting dates in the system. QCTO checks them and publishes the approved dates on the EISA Calendar.

5.  Meanwhile, training happens at SDPs over months or years. Learners are enrolled in the Quality Assurance domain. Once a learner finishes training, they get a Statement of Results (SOR).

6.  As a sitting date approaches, QCTO may check the QP/SDP is ready to run the exam (EISA Readiness — still to be confirmed with QCTO).

7.  SDPs register their enrolled learners for a published sitting (EISA Registration). The system checks each learner's SOR, blocks duplicate registrations, and blocks SDPs that are not compliant.

8.  QCTO shares the final registered-learner list with the QP, who confirms the assessment centres, learner counts and marking/moderation dates (EISA Confirmation).

9.  On the day, learners write the exam. It gets marked, then moderated. QCTO officials schedule monitoring visits for that sitting from the Site Visits & Monitoring hub.

10. The QP submits the batch of results within 21 working days. Several layers of QCTO staff check them, and the Chief Director gives final approval (Approval of Results). This recommends the learners to the Certification domain for certificates.

11. If the approved results need following up (the maps say: a low competency rate), QCTO runs a Post-EISA Monitoring visit.

12. Separately: Skills Programmes run their own FISA track — FISA Standard → instrument development → FISA Instrument Validation → FISA registration — completely independent of the EISA track.

13. Also separately: some learners are assessed on prior experience. That relies on an approved RPL Toolkit — its own approval track, shaped like the QSA Addendum process.

# 3. The 10 Process Maps, Explained One by One

Each map below is explained in the same shape: what kicks it off, who's in the room, what actually happens, what comes out the other end, and which change requests apply. Where the QCTO map differs from what was agreed, this section describes the agreed version (Section 7 lists the differences).

## 1. QSA Addendum (3 stages: Application → Evaluation → Approval)

**Triggered by:** A QP submitting a QSA Addendum for a qualification. The submission form has no EISA date on it — dates belong in the EISA Calendar (CR-003).

**Who's involved:** QP, ASD, Deputy Director, the Internal Assessment Committee (IAC), CEO (outcome-letter signature only).

**What happens:** QCTO checks whether the qualification is registered with SAQA. If yes, supporting documents are pulled automatically; if no, the QP uploads them manually. This check only decides where the documents come from — it does NOT send the application down an EISA or FISA path (CR-004). An acknowledgement letter is generated from a template and stops at DD level (CR-005, CR-007). The ASD evaluates the addendum against a checklist with a comment on every line (CR-011). The DD reviews it; if corrections are needed the DD returns it to the ASD, who returns it to the QP — never DD straight to QP (CR-012). The IAC approves or declines based on a summary presentation; a decline sends it back for remediation (CR-016). Evaluation approval and the outcome letter are two separate flows (CR-014): the outcome letter is generated from a template (CR-013) and the CEO only signs it (CR-008). The approval letter is also generated from a template.

**Produces:** An approved QSA Addendum — the “blueprint” everything else in the EISA track is built against — including the number of EISA sittings per year the qualification is approved for (needed by the EISA Calendar, CR-030).

**Change requests:** CR-003, CR-004, CR-005, CR-006, CR-007, CR-008, CR-011, CR-012, CR-013, CR-014, CR-015, CR-016. Backend, later: CR-009, CR-010.

**Still to confirm:** Who signs the approval letter now that the CEO only signs the outcome letter; where the approved EISA frequency is captured; exact handling of the new-qualification pathway (CR-004).

## 2. EISA Instrument Validation (map title: “Validation of EISA”)

**Triggered by:** An approved QSA Addendum being in place and the QP having an instrument ready to validate.

**Who's involved:** QP, ASD. No Deputy Director step and no SDP involvement (CR-018, CR-023).

**What happens:** The ASD and QP agree the validation date together, using the scheduling approach already built for the Quality Assurance domain — the QP cannot schedule it alone (CR-017). The ASD checks the instrument against the approved QSA Addendum using the shared checklist (comment on every line). Fields pre-filled from the addendum can be confirmed or recaptured (CR-021). The outcome goes straight back to the QP (CR-023); if changes are needed, the QP fixes the instrument and resubmits it. Internal officials can see the status of all validations on a dashboard (CR-025). This is its own section, separate from EISA Registration (CR-019).

**Produces:** A validated exam instrument. Completing validation does NOT start EISA registration (CR-024).

**Change requests:** CR-017, CR-018, CR-019, CR-021, CR-023, CR-024, CR-025. Backend, later: CR-020 (legacy AIDB / item bank), CR-022.

## 3. FISA Standards

**Triggered by:** A new Skills Programme needing its own final-assessment standard. It is never triggered by a QSA Addendum failing its gate check (CR-026).

**Who's involved:** Qualifications Development Domain (supplies the source documents), ASD, Deputy Director, IAC, and the Qualifications Development Director & Team, who give the final sign-off (not Assessments' own CEO).

**What happens:** Mirrors the QSA Addendum evaluation shape — evaluate, moderate, validate, approve — using the same shared checklist component, but for a Skills Programme's final-assessment standard.

**Produces:** An approved FISA Standard, which the SDP's instrument is then developed against (instrument development — CR-026).

**Change requests:** CR-026, CR-011.

## 4. FISA Instrument Validation (map title: “Validation of FISA”)

**Triggered by:** An SDP notifying QCTO that a FISA instrument, developed against an approved FISA Standard, needs validating.

**Who's involved:** SDP, Assistant Director, ASD.

**What happens:** Same idea as EISA Instrument Validation, but the SDP (not a QP) submits the instrument and fixes it if changes are needed. The Assistant Director allocates it to an ASD, who validates it. The outcome should go straight back to the SDP, with no Deputy Director step. The output is called the “FISA Validation Report” (not “EISA Validation Report”).

**Produces:** A validated FISA instrument, followed by FISA registration (CR-026).

**Change requests:** CR-026, CR-011. No CR number yet for removing the DD step or for the FISA renames — raise or fold into CR-026.

**Still to confirm:** Confirm the FISA DD step is removed, as was agreed for EISA.

## 5. RPL Toolkit Evaluation

**Triggered by:** A QP submitting a new or updated RPL Toolkit.

**Who's involved:** QP, Assistant Director, ASD, Director & Deputy Director + Team, IAC, CEO (outcome-letter signature only, as for the QSA Addendum).

**What happens:** Follows the same Application → Evaluation → Approval shape as the QSA Addendum, using the shared checklist component, but for the toolkit used to assess learners through recognition of prior learning.

**Produces:** An approved RPL Toolkit, which SDPs can then use to run RPL/ARPL assessments.

**Change requests:** None yet — this process is not in the current build or the change request register.

**Still to confirm:** Raise a change request so it can be scoped and estimated.

## 6. EISA Registration

**Triggered by:** An SDP registering its learners for a published EISA sitting on the EISA Calendar. It is NOT triggered by instrument validation finishing (CR-024).

**Who's involved:** SDP, Assistant Director. Reads data from the Quality Assurance domain (learner enrolment, SDP compliance status).

**What happens:** Registration is its own module, separate from validation (CR-019, CR-035). Instead of uploading a LEISA spreadsheet, the SDP selects learners from the already-enrolled list (simulated until the QA backend exists) and uploads an SOR for each (CR-036). Gate checks: the SDP is blocked if its compliance status is non-compliant (CR-041); a learner already registered for another sitting is blocked (CR-040); a non-compliant SOR is flagged back to the SDP (CR-038). An RPL/ARPL indicator on the registration automatically creates an Assessments monitoring item (CR-042). Registrations split into Trades and Non-Trades; the Non-Trades path also prepares files for the QP and shares the SDP list with Quality Assurance. Each registration record shows the synced learners, their SORs and documents (CR-035).

**Produces:** Confirmed learner registrations for that EISA sitting.

**Change requests:** CR-035, CR-036, CR-038, CR-040, CR-041, CR-042. Backend, later: CR-037 (SOR checked against qualification modules), CR-039 (Home Affairs ID check at QA learner enrolment).

**Still to confirm:** Exact differences between the Trades and Non-Trades paths.

## 7. QP EISA Readiness

**Triggered by:** A QP notifying QCTO that an EISA sitting is coming up.

**Who's involved:** QP, Assistant Director/Assessor, jointly with the Quality Assurance domain.

**What happens:** QCTO conducts a readiness site visit to check the QP/SDP is actually ready to run the exam. In the agreed build this is a “readiness” visit type inside the standalone Site Visits & Monitoring hub (CR-044, CR-048), not a separate pipeline stage. Its notification must have its own name — not “EISA Notification”.

**Produces:** A readiness site-visit report.

**Change requests:** None directly — covered only by the Site Visits hub CRs (CR-044, CR-048).

**Still to confirm:** Not in the change request register. Confirm with QCTO that readiness visits are still required and how QA is involved, then raise a CR.

## 8. Marked & Moderated Scripts

**Triggered by:** QCTO officials scheduling a check on a marking/moderation session in the Site Visits & Monitoring hub — not automatically by registration (CR-044).

**Who's involved:** Assistant Director / ASD (conducts and submits the report), Deputy Director (the submitter's direct manager, approves), Domain Director (approves the visit plan), Sub Domain Admin (books the visit).

**What happens:** The visit is linked to a specific EISA sitting so its date and details auto-fill (CR-050), and is flagged as notified or unannounced (CR-051). It is planned, approved and booked, then carried out using the form for this visit type, with QP and qualification selected at the top (CR-048, CR-049). The ASD submits the report and a different person — their direct manager — approves it; nobody approves their own report (CR-053). Approvers can send back for clarification or reject (CR-056), and approvals can be manually re-routed with an audit note when workload is shared (CR-055). QPs see only their own visits (CR-047).

**Produces:** A marking & moderation monitoring report. Its status is shown on the Approval of Results screen (CR-052).

**Change requests:** CR-044, CR-047, CR-048, CR-049, CR-050, CR-051, CR-052, CR-053, CR-054, CR-055, CR-056.

## 9. Post EISA Monitoring

**Triggered by:** An approved results batch that needs following up. The QCTO map says this happens when the batch shows a low competency (pass) rate.

**Who's involved:** QP, Assistant Director, Deputy Director, Director.

**What happens:** QCTO checks the competency rate, then plans and conducts a follow-up visit (a “post-EISA monitoring” visit type in the Site Visits hub) to find out what went wrong. The Facilitator and Learner Questionnaires are only used on this visit type, and only after the results have been approved (CR-057). The step where results/outcomes are shared is renamed to reflect what it really does (CR-058). Note: RPL/ARPL monitoring is a different trigger — it is created automatically from the registration (CR-042, CR-044).

**Produces:** A Post-EISA Monitoring (PEM) report, shared with QA, the QP, Accreditation and the SDP.

**Change requests:** CR-057, CR-058.

**Still to confirm:** The “low competency rate” trigger and its threshold are not in the change request register — confirm with QCTO.

## 10. Approval of Results

**Triggered by:** A QP submitting a batch of exam results, within 21 working days (CR-059).

**Who's involved:** QP, Assistant Director, Deputy Director, Director, Chief Director.

**What happens:** The results batch goes through several layers of checking — a compliance review, evidence evaluation, and folder-by-folder compliance checks — with the linked marking/moderation monitoring status visible (CR-052). QCTO can approve or decline. The Chief Director gives final approval. The existing tab that is wrongly labelled “Approval of Results” is renamed so the name is free for this module (CR-060).

**Produces:** Approved results, and a recommendation to the Certification domain to print certificates.

**Change requests:** CR-059, CR-060, CR-052.

**Still to confirm:** Which existing tab CR-060 refers to, and what the Certification domain needs to receive.

# 4. How They Connect: The Main Highway

For any one EISA sitting, the EISA processes happen in the order below. But each stage is started on its own — finishing one does NOT automatically start the next (CR-024, CR-044). They are connected by the data they share, not by triggers.

1.  QSA Addendum is approved (including how many EISA sittings a year it allows).

2.  → EISA Instrument Validation checks the instrument against that approved addendum.

3.  → EISA Date & Calendar: the QP proposes sitting dates, QCTO approves and publishes them (runs alongside, once the addendum is approved).

4.  → (to confirm) EISA Readiness visit as the sitting date nears, scheduled in the Site Visits hub.

5.  → EISA Registration: SDPs register enrolled learners for a published sitting.

6.  → EISA Confirmation: QCTO shares the learner list; the QP confirms centres, counts and marking/moderation dates.

7.  → Marked & Moderated Scripts: officials monitor the marking/moderation for that sitting.

8.  → Approval of Results evaluates and signs off the results batch, then recommends certification.

9.  → Post EISA Monitoring, only when the approved batch needs following up.

**So the real spine is: QSA Addendum → EISA Instrument Validation → EISA Calendar sitting → (EISA Readiness) → EISA Registration → EISA Confirmation → Marking & Moderation monitoring → Approval of Results → Certification, with Post-EISA Monitoring when needed.**

What links each stage — the data handed from one to the next:

| **From**                              | **To**                       | **What is passed**                                                                                   |
|---------------------------------------|------------------------------|------------------------------------------------------------------------------------------------------|
| **QSA Addendum**                      | EISA Instrument Validation   | The approved addendum the instrument is checked against.                                             |
| **QSA Addendum**                      | EISA Calendar                | The approved number of sittings per year (CR-030).                                                   |
| **EISA Calendar**                     | EISA Registration            | The published sitting the SDP registers learners for.                                                |
| **Quality Assurance domain**          | EISA Registration            | Enrolled learners and SDP compliance status (simulated for now).                                     |
| **EISA Registration**                 | EISA Confirmation            | The registered-learner list per assessment centre.                                                   |
| **EISA Calendar / EISA Confirmation** | Marked & Moderated Scripts   | The sitting date, centres and marking/moderation dates (CR-050).                                     |
| **EISA Registration (RPL/ARPL flag)** | Site Visits & Monitoring hub | An automatically created monitoring item — the only automatic trigger into the hub (CR-042, CR-044). |
| **Marked & Moderated Scripts**        | Approval of Results          | The monitoring status for that sitting (CR-052).                                                     |
| **Approval of Results**               | Certification domain         | A recommendation to print certificates (CR-059).                                                     |
| **Approval of Results**               | Post EISA Monitoring         | The approved batch and its competency rate.                                                          |

# 5. What Stands Alone (not part of the main highway)

- **FISA track (maps 3 & 4) —** An entirely separate pathway for Skills Programmes, running in parallel to the whole QSA/EISA line — not a branch off it. Five stages: FISA Standards → evaluation/approval → instrument development → FISA Instrument Validation → FISA registration (CR-026). FISA is not a “failed QSA” fork.

- **RPL Toolkit Evaluation (map 5) —** Self-contained — no inbound or outbound links to the other maps. Its approved toolkits are used later by SDPs, which shows up only as the RPL/ARPL indicator on a registration. Not yet in the change request register.

- **EISA Date & Calendar (no map) —** Serves the highway but is its own standalone module — not a tab inside the QSA Addendum or Registration screens (CR-027).

- **Site Visits & Monitoring hub (no map) —** Serves the highway but is its own standalone module where officials see and schedule every type of visit (CR-044).

# 6. Where Other QCTO Domains Plug In

The Assessments domain doesn't work in isolation — it needs data and sign-off from other parts of QCTO's system at specific points.

| **Domain**                     | **Where it shows up**                                                                             | **What it provides**                                                                                                                                                                                                                                                                   |
|--------------------------------|---------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Qualifications Development** | QSA Addendum; FISA Standards                                                                      | Curriculum, SAQA and spec documents when a qualification isn't SAQA-registered yet; the final sign-off for FISA Standards. Its database structures are needed early so Assessments can use real data (CR-001, backend).                                                                |
| **Quality Assurance (QA)**     | EISA Registration; QP EISA Readiness; Post EISA Monitoring; EISA Instrument Validation scheduling | Learner enrolment records (CR-036) and SDP compliance status (CR-041) that gate registration — simulated until the QA backend exists. Joint readiness visits. Receives the PEM report and the Non-Trades SDP list. Its scheduling method is reused for instrument validation (CR-017). |
| **Certification**              | After Approval of Results                                                                         | Receives the recommendation to print certificates once results are approved (CR-059).                                                                                                                                                                                                  |
| **Accreditation**              | Post EISA Monitoring                                                                              | Receives the PEM report.                                                                                                                                                                                                                                                               |
| **SAQA (external)**            | Gate check in the QSA Addendum process                                                            | Confirms via API whether a qualification is already registered.                                                                                                                                                                                                                        |
| **Home Affairs (external)**    | QA-domain learner enrolment                                                                       | ID verification and detection of learners registered at multiple SDPs at once (“double dipping”) (CR-039, backend).                                                                                                                                                                    |
| **Legacy AIDB / item bank**    | EISA Instrument Validation                                                                        | Possible integration — architecture pending a QCTO internal decision (CR-020, backend).                                                                                                                                                                                                |

# 7. Where the Maps Don't Match What Was Agreed — Fix Before Building

These are places where the process maps QCTO sent still show the old/incorrect version, based on what was corrected in the 6 August meeting and the change request register. Don't build straight off the map in these spots. Map numbers match Section 3.

**Map 1 — QSA Addendum (acknowledgement letter)**

**Map shows:** The Acknowledgement Letter is shown going DD → CEO for approval.

**Should be:** The CEO should not be in that loop — it stops at DD level (CR-007). The letter is generated from a template (CR-005).

**Map 1 — QSA Addendum (CEO role)**

**Map shows:** The CEO is part of the evaluation/approval chain.

**Should be:** Evaluation approval (ASD → DD → IAC) and the outcome letter are separate flows; the CEO only signs the outcome letter (CR-008, CR-014).

**Maps 2 & 4 — EISA / FISA Instrument Validation**

**Map shows:** Both show the Deputy Director reviewing/recommending changes and being part of the validation outcome.

**Should be:** The outcome routes straight back to the QP (EISA, CR-023) or the SDP (FISA — no CR number yet) — no DD step.

**Maps 2 & 4 — naming**

**Map shows:** Both maps are titled “Validation of EISA/FISA.”

**Should be:** Rename to “EISA/FISA Instrument Validation” — “validation” on its own is ambiguous, and SDPs must never be involved in the EISA version (CR-018).

**Map 2 — EISA Instrument Validation (hand-off)**

**Map shows:** Validation flows straight on into registration.

**Should be:** Completing validation does not start registration (CR-024); registration is started by the SDP for a published calendar sitting.

**Maps 3 & 4 — FISA**

**Map shows:** FISA only covers the standard and instrument validation, and (in the current build) starts from a failed QSA gate check.

**Should be:** FISA is independent and has five stages, including instrument development and FISA registration (CR-026).

**Map 4 — FISA Instrument Validation (report name)**

**Map shows:** Its output document is labelled “EISA Validation Report” (a copy-paste leftover).

**Should be:** Should read “FISA Validation Report.”

**Map 6 — EISA Registration**

**Map shows:** Shows a simple SDP document upload (registration form, LEISA learner file, SOR & QA reports) with no other checks.

**Should be:** Learners are selected from the already-enrolled list with an SOR each (CR-036), plus an SOR compliance check (CR-038; CR-037 later), a duplicate-registration block (CR-040), an SDP compliance gate check (CR-041), an RPL/ARPL indicator (CR-042) and, later, a Home Affairs ID check at QA enrolment (CR-039).

**Maps 7 & 8 — naming**

**Map shows:** Both use the label “EISA Notification” for two different triggers (a readiness visit vs. a marking/moderation visit request).

**Should be:** That name was also used for the learner-list acknowledgement step, now renamed “EISA Confirmation” (CR-043). You need three distinct names, not one overloaded term.

**Map 8 — Marked & Moderated Scripts**

**Map shows:** Doesn't clearly separate “ASD submits” from “DD approves” as two distinct steps.

**Should be:** This matches the self-approval bug the client flagged in the build — it needs explicit two-step routing to the submitter's direct manager (CR-053).

**Map 9 — Post EISA Monitoring**

**Map shows:** Triggered by a low competency rate on an approved batch.

**Should be:** Not in the change request register. The register only limits the questionnaires to this visit type after results approval (CR-057), and makes RPL/ARPL the only automatic monitoring trigger (CR-044). Confirm the low-competency trigger and its threshold with QCTO.

**Map 10 — Approval of Results**

**Map shows:** Has no visible 21-working-day submission deadline and no hand-off to the Certification domain.

**Should be:** Both need to be added — this is the step that unlocks certificate printing (CR-059).

# 8. Processes the Meeting Described With No Map

These were discussed in detail in the meeting, but QCTO did not send a process map for them. They are designed from the meeting notes and the change request register — ask QCTO for any missing documentation before building.

## EISA Date & Calendar

**Triggered by:** A QP proposing EISA sitting dates for an approved qualification.

**Who's involved:** QP, QCTO officials (validate, approve, publish, cancel/postpone).

**What happens:** A standalone calendar QCTO can add to, edit and delete from at any time (CR-027). The QP submits dates through an in-system form instead of an external document (CR-029). QCTO validates and approves them, then they are published to the calendar (CR-028). The number of dates must match the qualification's approved number of sittings (CR-030), and one qualification can have several dates a year (CR-031). Dates on public holidays or inside the minimum lead time are rejected automatically, and QCTO can reject with a reason (CR-032). A visual calendar with in-app deadline alerts (CR-033; email/SMS later). Only QCTO can cancel or postpone a date, with a reason, notifications to SDPs and an audit trail (CR-034).

**Produces:** Published EISA sittings that registration and marking/moderation visits link to.

**Change requests:** CR-027 to CR-034.

**Still to confirm:** The lead-time figure and public-holiday source (CR-032); where the approved number of sittings is captured (CR-030).

## EISA Confirmation (formerly “EISA Notification”)

**Triggered by:** EISA Registration being complete for a sitting.

**Who's involved:** QCTO officials, QP.

**What happens:** QCTO shares a system-generated consolidated list of registered learners with the QP. The QP acknowledges it and confirms the assessment centres, learner counts and marking/moderation dates. It no longer pushes the record into Site Visits automatically.

**Produces:** Confirmed centres, learner counts and marking/moderation dates for the sitting.

**Change requests:** CR-043.

## Site Visits & Monitoring hub

**Triggered by:** An official scheduling a visit of any type — or an RPL/ARPL-flagged registration, which creates a monitoring item automatically.

**Who's involved:** Assistant Director / ASD, Deputy Director, Domain Director, Sub Domain Admin, QP (view only — their own visits).

**What happens:** One standalone dashboard where officials see and schedule every type of visit (readiness, marking & moderation, RPL/ARPL monitoring, post-EISA monitoring), independent of the registration pipeline (CR-044). Scheduling has its own tab; QPs only see their own visits (CR-047). The visit form changes with the visit type, using QCTO's templates (CR-048). The obsolete “schedules received” counter is removed and “results received” becomes “reports received” (CR-045); leftover tabs from the old build are removed (CR-046). Report visibility between units is decided and enforced (CR-054). Routing rules are as for Marked & Moderated Scripts (CR-053, CR-055, CR-056).

**Produces:** Visit plans, bookings and approved visit reports of every type.

**Change requests:** CR-044 to CR-058.

**Still to confirm:** Which tabs are “leftover” (CR-046); report visibility rules (CR-054); QCTO's visit-type templates (CR-048).

# 9. Still to Confirm With QCTO

Everything in this guide that still needs a decision before (or while) it is built:

- Who signs the approval letter, now that the CEO only signs the outcome letter.

- How the new-qualification (not SAQA-registered) pathway is handled in the gate check (CR-004).

- Where the approved number of EISA sittings per year is captured (CR-030), and the lead-time figure and public-holiday source for date validation (CR-032).

- How pre-filled instrument validation fields are re-validated or recaptured (CR-021).

- Whether EISA Readiness visits are still required, how QA takes part, and a CR for them.

- The Post-EISA Monitoring trigger: is it a low competency rate, and what is the threshold?

- Removing the DD step from FISA Instrument Validation and renaming the FISA screens/report — needs a CR or folding into CR-026.

- A change request for RPL Toolkit Evaluation.

- Names for the readiness notification and the marking/moderation visit request (EISA Confirmation is already named).

- The official on-screen name for the addendum (QSA / QAS / QASA), and using “IAC” instead of “AIC”.

- Which existing tab is wrongly labelled “Approval of Results” (CR-060), and which tabs are leftovers to remove (CR-046).

- Report visibility rules between units (CR-054) and the visit-type templates (CR-048).

- The differences between the Trades and Non-Trades registration paths.

# 10. What This Means for Your Frontend Build

- **Build the main highway as separate modules that share data —** QSA Addendum → EISA Instrument Validation → EISA Calendar → Registration → Confirmation → Marking/Moderation monitoring → Approval of Results → Post-EISA Monitoring. Each module hands real data to the next, but finishing one never automatically starts the next (CR-019, CR-024, CR-044). Don't build one record that keeps gaining tabs.

- **Build FISA and RPL Toolkit Evaluation as separate modules —** Don't nest them inside the EISA flow or make one a fallback of the other — they have their own triggers, participants and approvers. FISA needs all five stages (CR-026).

- **Reuse one evaluation-checklist component —** QSA evaluation, FISA Standards evaluation, RPL Toolkit evaluation and Instrument Validation all follow the same shape — evaluate → moderate → validate/endorse → approve — with a mandatory comment on every checklist line (CR-011). Keep the comment rule configurable per domain: Accreditation asked for the opposite.

- **Give EISA Date & Calendar and Site Visits & Monitoring their own standalone modules —** Both were explicitly flagged as needing to live outside the QSA Addendum and Registration screens. Site visits use a visit-type-driven form (CR-048).

- **Get the routing rules right —** The CEO only signs the outcome letter (CR-008); corrections go DD → ASD → QP (CR-012); nobody approves their own report (CR-053); approvers can send back or reject (CR-056); the IAC can decline (CR-016).

- **Generate letters from templates —** Acknowledgement, outcome and approval letters are generated from captured data with a view/print step — no manual upload (CR-005, CR-013). Digital signatures come later.

- **Assign work by process-stage team —** Not by QP portfolio ownership (CR-015).

- **Plan your data model around the cross-domain links —** Qualifications ↔ Modules (for SOR checks), Learner Enrolment (owned by QA, read by Assessments) and SDP Compliance Status (owned by QA, read by Assessments) — simulated for now, re-wired when the backend exists. Also allow several EISA dates per qualification per year (CR-031).

- **Use the agreed names —** Rename “AQP” to “QP” everywhere (CR-006). Don't reuse “EISA Notification” — use distinct names for the readiness trigger, the marking/moderation visit request and “EISA Confirmation”.
