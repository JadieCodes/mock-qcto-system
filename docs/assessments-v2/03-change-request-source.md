QCTO Mock System Development

**To:** QCTO – Assessments Domain

**From:** Jade Klynsmith / Build Team (Dave Reevell)

**Date:** 7 August 2026

**Re:** Consolidated frontend change requests arising from the Assessments module review meeting held 6 August 2026

This document lists all confirmed change requests (CRs) from the 6 August 2026 Assessments module review that can be built now, on the frontend/simulated version of the system. There is no backend yet, so change requests that depend on real databases, external API integrations, or AI/automated validation have been left out of this list — they're tracked separately in the appendix at the end so nothing is lost. CR numbering matches the full change request register for traceability.

# Summary

**Total frontend change requests:** 52

**Total estimated effort:** approx. 21.25 working days (4.3 weeks / about 1 month), covering Sprint 1 plus Phase 2

**Backend-dependent items excluded from this list:** 8 (see appendix)

| **Priority** | **\# of Change Requests** | **Est. Days** |
|--------------|---------------------------|---------------|
| Critical     | 11                        | 7             |
| High         | 18                        | 7.25          |
| Medium       | 15                        | 5             |
| Low          | 8                         | 2             |

# Delivery Plan

**Sprint 1 window:** Tuesday 11 – Monday 17 August 2026 (4 working days)

**Target:** complete 37 of 52 frontend change requests (71%) by end of day Monday 17 August.

**Phase 2 (following week):** 15 change requests — the larger, multi-day screens/flows — carry over once Sprint 1 is complete.

Sprint 1 prioritises the smaller, high-impact fixes — routing corrections, terminology/labeling fixes, field and comment additions, decoupling and re-scoping items. Phase 2 covers the larger standalone screen/flow builds (e.g. the EISA Calendar module, the Approval of Results module, the Registration screen redesign, the FISA rebuild, and the Site Visits & Monitoring restructuring) which need more than the 4-day window regardless of sequencing. Each change request below is tagged Sprint 1 or Phase 2 in the Phase column.

# Frontend Change Requests by Module

## 2. QSA Addendum Submission

| **CR \#** | **Description**                                                                                                         | **Priority** | **Est. Days** | **Phase** | **Notes** |
|-----------|-------------------------------------------------------------------------------------------------------------------------|--------------|---------------|-----------|-----------|
| CR-003    | Remove the “Proposed EISA Date” field from the QSA addendum submission screen (belongs later, in the EISA Calendar).    | Low          | 0.25          | Sprint 1  | —         |
| CR-004    | Confirm and refine handling of the existing-qualification vs. new-qualification pathway in the QSA addendum gate check. | Medium       | 0.25          | Sprint 1  | —         |

## 3. Acknowledgement Letter

| **CR \#** | **Description**                                                                                                                               | **Priority** | **Est. Days** | **Phase** | **Notes** |
|-----------|-----------------------------------------------------------------------------------------------------------------------------------------------|--------------|---------------|-----------|-----------|
| CR-005    | Auto-generate the acknowledgement letter from a template using captured data, removing manual drafting/upload; retain a reviewer “view” step. | High         | 0.5           | Sprint 1  | —         |
| CR-006    | Global rename of “AQP” to “QP” throughout the system.                                                                                         | Low          | 0.25          | Sprint 1  | —         |

## 4. Approval Workflow Routing (DD / CEO)

| **CR \#** | **Description**                                                                                                   | **Priority** | **Est. Days** | **Phase** | **Notes** |
|-----------|-------------------------------------------------------------------------------------------------------------------|--------------|---------------|-----------|-----------|
| CR-007    | Remove all Deputy Director → CEO direct-routing steps in the QSA addendum evaluation/approval workflow.           | Critical     | 0.5           | Sprint 1  | —         |
| CR-008    | Remove the CEO “review and approve” evaluation step; limit CEO's role to the final outcome letter signature only. | Critical     | 0.25          | Sprint 1  | —         |

## 5. QSA Evaluation Checklist

| **CR \#** | **Description**                                                                                                             | **Priority** | **Est. Days** | **Phase** | **Notes** |
|-----------|-----------------------------------------------------------------------------------------------------------------------------|--------------|---------------|-----------|-----------|
| CR-011    | Add a mandatory comment/justification field to every checklist line item (evaluation and instrument validation checklists). | High         | 0.5           | Sprint 1  | —         |

## 6. Evaluation Report Routing

| **CR \#** | **Description**                                                                             | **Priority** | **Est. Days** | **Phase** | **Notes** |
|-----------|---------------------------------------------------------------------------------------------|--------------|---------------|-----------|-----------|
| CR-012    | Enforce DD → ASD → QP routing for evaluation corrections; remove the direct DD → QP option. | High         | 0.25          | Sprint 1  | —         |

## 7. Outcome Letter & Approval Letter Process

| **CR \#** | **Description**                                                                                                                                            | **Priority** | **Est. Days** | **Phase** | **Notes**                                                                          |
|-----------|------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|---------------|-----------|------------------------------------------------------------------------------------|
| CR-013    | Auto-generate the outcome letter and approval letter from a template using captured data, with an in-app view/print step, removing manual drafting/upload. | High         | 0.5           | Sprint 1  | Digital signature capability deferred until backend/security infrastructure exists |
| CR-014    | Split the evaluation-approval workflow and the outcome-letter-approval workflow into two separate flows; remove CEO from the evaluation flow.              | Critical     | 0.5           | Phase 2   | —                                                                                  |
| CR-015    | Restructure the Assessments role/assignment model around process-stage teams rather than QP-portfolio ownership.                                           | Medium       | 0.5           | Sprint 1  | —                                                                                  |
| CR-016    | Merge the Internal Assessment Committee (IAC) decline/remediation branch into the main build and demonstrate it to the client.                             | High         | 0.25          | Sprint 1  | —                                                                                  |

## 8. EISA Instrument Validation — Scheduling

| **CR \#** | **Description**                                                                                                                                                    | **Priority** | **Est. Days** | **Phase** | **Notes** |
|-----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|---------------|-----------|-----------|
| CR-017    | Remove QP self-scheduling for instrument validation; build a joint ASD/QP scheduling process (reuse the scheduling methodology from the Quality Assurance module). | High         | 0.5           | Phase 2   | —         |

## 9. EISA Instrument Validation — Terminology & Structure

| **CR \#** | **Description**                                                                                              | **Priority** | **Est. Days** | **Phase** | **Notes** |
|-----------|--------------------------------------------------------------------------------------------------------------|--------------|---------------|-----------|-----------|
| CR-018    | Rename “EISA Validation” to “EISA Instrument Validation” and remove SDP visibility/access from this process. | High         | 0.25          | Sprint 1  | —         |
| CR-019    | Separate “EISA Instrument Validation” and “EISA Registration” into two distinct, correctly labeled sections. | High         | 0.5           | Sprint 1  | —         |

## 11. EISA Instrument Validation Checklist

| **CR \#** | **Description**                                                                                          | **Priority** | **Est. Days** | **Phase** | **Notes** |
|-----------|----------------------------------------------------------------------------------------------------------|--------------|---------------|-----------|-----------|
| CR-021    | Confirm and build a process for re-validating or recapturing pre-populated instrument validation fields. | Medium       | 0.25          | Sprint 1  | —         |

## 12. EISA Instrument Validation — Outcome Routing

| **CR \#** | **Description**                                                                                                              | **Priority** | **Est. Days** | **Phase** | **Notes** |
|-----------|------------------------------------------------------------------------------------------------------------------------------|--------------|---------------|-----------|-----------|
| CR-023    | Correct instrument validation outcome routing to go directly to QP, removing the Deputy Director step from this sub-process. | High         | 0.25          | Sprint 1  | —         |
| CR-024    | Decouple instrument validation completion from automatically triggering EISA registration.                                   | High         | 0.25          | Sprint 1  | —         |
| CR-025    | Build a status-visibility dashboard for internal officials (QSA agenda / instrument validation status).                      | Medium       | 0.5           | Phase 2   | —         |

## 13. FISA — Structural Separation From EISA

| **CR \#** | **Description**                                                                                                                                                                                | **Priority** | **Est. Days** | **Phase** | **Notes** |
|-----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|---------------|-----------|-----------|
| CR-026    | Rebuild FISA as a fully independent process (FISA Standards → evaluation/approval → instrument development → instrument validation → registration), decoupled from the EISA/QSA addendum flow. | Critical     | 1             | Phase 2   | —         |

## 14. EISA Date & Calendar Management

| **CR \#** | **Description**                                                                                                                     | **Priority** | **Est. Days** | **Phase** | **Notes**                                                                   |
|-----------|-------------------------------------------------------------------------------------------------------------------------------------|--------------|---------------|-----------|-----------------------------------------------------------------------------|
| CR-027    | Build a standalone, continuously updatable EISA calendar module (QCTO-managed add/edit/delete).                                     | Critical     | 0.75          | Phase 2   | —                                                                           |
| CR-028    | Build the QP date-proposal → QCTO validation/approval → publish-to-calendar workflow.                                               | Critical     | 0.5           | Phase 2   | —                                                                           |
| CR-029    | Build an in-system EISA date submission form for QP, replacing the external document process.                                       | High         | 0.5           | Sprint 1  | —                                                                           |
| CR-030    | Build validation linking a qualification's approved EISA frequency to calendar submissions, enforcing the correct date count.       | High         | 0.5           | Sprint 1  | —                                                                           |
| CR-031    | Redesign the data model to support multiple EISA dates per qualification per year.                                                  | High         | 0.25          | Sprint 1  | —                                                                           |
| CR-032    | Build automated date-rejection validation (public holidays, lead time) plus a formal QCTO review/rejection-with-reason workflow.    | Medium       | 0.5           | Phase 2   | —                                                                           |
| CR-033    | Build in-app notification banners/alerts for approaching calendar deadlines, plus a visual calendar UI.                             | Medium       | 0.5           | Sprint 1  | Real email/SMS delivery deferred until backend exists — in-app only for now |
| CR-034    | Build a formal EISA date cancellation/postponement workflow (QCTO-initiated only, reason required, SDP notifications, audit trail). | High         | 0.5           | Phase 2   | —                                                                           |

## 15. EISA Registration — Architecture Overhaul

| **CR \#** | **Description**                                                                                                                                                  | **Priority** | **Est. Days** | **Phase** | **Notes**                                                                                             |
|-----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|---------------|-----------|-------------------------------------------------------------------------------------------------------|
| CR-035    | Separate registration from validation; build synced learner/SOR/document visibility on registration records.                                                     | Critical     | 0.5           | Phase 2   | —                                                                                                     |
| CR-036    | Redesign the EISA registration screen to select learners from a simulated “already-enrolled” list rather than a spreadsheet upload; add a SOR upload UI element. | Critical     | 0.5           | Phase 2   | AI/gate-check validation and virus scanning deferred until backend exists — upload is UI-only for now |
| CR-038    | Build non-compliant SOR flagging/notification workflow to the SDP.                                                                                               | Medium       | 0.25          | Sprint 1  | —                                                                                                     |
| CR-040    | Build a control to block duplicate/concurrent EISA registrations for the same learner.                                                                           | High         | 0.25          | Sprint 1  | —                                                                                                     |

## 16. EISA Registration — Compliance Gate Checks

| **CR \#** | **Description**                                                                                                                                                                | **Priority** | **Est. Days** | **Phase** | **Notes**                                                        |
|-----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|---------------|-----------|------------------------------------------------------------------|
| CR-041    | Add a compliance/monitoring-status indicator on the EISA registration screen (using simulated SDP status data) that visually blocks registration when status is non-compliant. | Medium       | 0.25          | Sprint 1  | Status is simulated/mock data until the QA-domain backend exists |
| CR-042    | Add an RPL/ARPL indicator field to the registration data model, triggering the Assessments-specific monitoring workflow.                                                       | Medium       | 0.25          | Sprint 1  | —                                                                |

## 17. EISA Confirmation (formerly “EISA Notification”)

| **CR \#** | **Description**                                                                                                                                                                                       | **Priority** | **Est. Days** | **Phase** | **Notes** |
|-----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|---------------|-----------|-----------|
| CR-043    | Rename “EISA Notification” to “EISA Confirmation”; build the system-generated consolidated learner list view and confirmation capture (assessment centres, learner counts, marking/moderation dates). | High         | 0.5           | Phase 2   | —         |

## 18. Site Visits & Monitoring — Restructuring

| **CR \#** | **Description**                                                                                                                    | **Priority** | **Est. Days** | **Phase** | **Notes** |
|-----------|------------------------------------------------------------------------------------------------------------------------------------|--------------|---------------|-----------|-----------|
| CR-044    | Decouple Site Visits & Monitoring into a standalone module; auto-trigger monitoring only for RPL/ARPL cases.                       | Critical     | 0.75          | Phase 2   | —         |
| CR-045    | Remove the obsolete “schedules received” metric; rename “results received” to “reports received.”                                  | Low          | 0.25          | Sprint 1  | —         |
| CR-046    | Remove deprecated/leftover UI tabs from the previous build version.                                                                | Low          | 0.25          | Sprint 1  | —         |
| CR-047    | Restrict QP visibility to only their own relevant visits/schedules; move scheduling into its own standalone tab.                   | High         | 0.5           | Sprint 1  | —         |
| CR-048    | Build a dynamic, visit-type-driven site visit execution form using QCTO's existing templates.                                      | High         | 0.5           | Phase 2   | —         |
| CR-049    | Add QP and qualification selection fields at the top of the visit execution form.                                                  | Low          | 0.25          | Sprint 1  | —         |
| CR-050    | Link marking/moderation sessions to a specific EISA sitting/calendar date, with auto-populate.                                     | Medium       | 0.25          | Sprint 1  | —         |
| CR-051    | Build a notification-type flag (notified / unannounced) with configurable lead time for site visits.                               | Medium       | 0.25          | Sprint 1  | —         |
| CR-052    | Surface the linked marking/moderation monitoring status on the approval-of-results screen.                                         | Medium       | 0.25          | Sprint 1  | —         |
| CR-053    | Fix the site visit report approval workflow — remove the self-approval/login-context bug; route to the submitter's direct manager. | Critical     | 0.5           | Sprint 1  | —         |
| CR-054    | Decide and implement cross-unit report visibility rules within the Assessment domain.                                              | Medium       | 0.25          | Sprint 1  | —         |
| CR-055    | Build flexible approval routing with manual override and a mandatory audit note for workload-sharing scenarios.                    | Medium       | 0.5           | Phase 2   | —         |
| CR-056    | Add “send back for clarification” and “reject” actions to report approval screens.                                                 | Medium       | 0.25          | Sprint 1  | —         |
| CR-057    | Restrict Facilitator & Learner Questionnaires to the Post-EISA-Monitoring visit type, gated on results approval.                   | Low          | 0.25          | Sprint 1  | —         |
| CR-058    | Rename/redesign the “submit approved results” step to reflect the actual outcome-sharing process.                                  | Low          | 0.25          | Sprint 1  | —         |

## 19. Approval of Results (Missing Process)

| **CR \#** | **Description**                                                                                                                                                           | **Priority** | **Est. Days** | **Phase** | **Notes** |
|-----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|---------------|-----------|-----------|
| CR-059    | Build the full “Approval of Results” module: QP result submission within a 21-working-day SLA, QCTO evaluate/approve/decline, recommendation to the Certification domain. | Critical     | 1.25          | Phase 2   | —         |
| CR-060    | Rename the incorrectly-labeled existing “Approval of Results” tab to free up the correct naming.                                                                          | Low          | 0.25          | Sprint 1  | —         |

# Estimate Assumptions

Estimates are in developer-days for a single developer working sequentially through the list; total elapsed calendar time could be shorter if items are parallelised or if additional development capacity is added.

Several items are simulated with mock/placeholder data (e.g. compliance status, enrolled-learner lists, SOR uploads) since there is no backend yet — these will need to be re-wired to real data sources once backend development begins.

Estimates cover build and internal testing of each change; they exclude client review cycles, UAT, and sign-off time.

This list reflects only the Assessments module. Change requests from the Accreditation and Quality Assurance review sessions are tracked separately.

# Appendix — Backend-Dependent Change Requests (Not in Scope Yet)

These change requests were raised in the same review but require real backend infrastructure (databases, external APIs, AI/automated validation) that doesn't exist yet. They're parked here for later scoping once backend development starts, rather than dropped from the record.

| **CR \#** | **Original Description**                                                                                                                                              | **Why It's Excluded**                                                                                                |
|-----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| CR-001    | Build database structures for dependent domains (e.g. Qualifications Development) ahead of their front-end builds, so Assessments can integrate with real data early. | Requires real database structures for another domain — no backend yet.                                               |
| CR-002    | Implement a data-quality gate-check at the point of data entry across the system.                                                                                     | Backend data-quality validation infrastructure, not a screen.                                                        |
| CR-009    | Add gate-check / AI-assisted validation to reduce fully manual steps in the DD/ASD evaluation flow.                                                                   | Requires real AI-assisted/automated validation logic.                                                                |
| CR-010    | Build a hybrid automatic/manual validation model for the QSA evaluation checklist (auto-check objective data, manual review with commentary for subjective items).    | Requires real automated (AI) checking of objective data.                                                             |
| CR-020    | Confirm integration architecture for the legacy AIDB / item-bank system once QCTO has made an internal decision.                                                      | Legacy system integration architecture — pending decision, backend scope.                                            |
| CR-022    | Apply the checklist comment-field and hybrid validation logic (see Module 5) to the instrument validation checklist.                                                  | Depends on the same automated validation logic as CR-010 (backend); comment-field portion already covered by CR-011. |
| CR-037    | Build the Qualifications ↔ Modules database relationship and AI validation of an uploaded SOR against required modules.                                               | Requires a real Qualifications↔Modules database relationship and AI validation.                                      |
| CR-039    | Integrate the Home Affairs ID-validation API at the learner enrolment stage (Quality Assurance domain).                                                               | Requires a live Home Affairs government API integration.                                                             |

**Prepared by:** Jade Klynsmith

**Reviewed by:** Dave Reevell

**For sign-off by:** QCTO – Assessments Domain
