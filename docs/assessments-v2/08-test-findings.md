# Assessments v2 — test findings (round 1)

Source: the user's walk-through of the 162-case test script. This file is the list Claude Code works from.
Rules for every fix prompt: read the row(s) named in the prompt; the 'Test ID' column points to the raw tester notes in the appendix.
Where Decision = **Ask QCTO**, do NOT stop: build the stated default, keep it behind a config value or label, and record it in progress.md as an open question.
Where a row says *Blocked until QCTO document*, skip it in that round and list it as blocked in progress.md.

## Changes to build

| # | What is wrong or missing | Test ID | Area | CR/PM | Type | Priority | Decision | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | FOUNDATION: add named demo users per role (e.g. 2–3 people per role, plus named QPs and SDPs) and switch by person, not only by role. Use the person for self-approval, re-route, allocation to an ASD and 'my items' filtering. | B-26, G-05, G-18, K-04, K-11 | Whole system | CR-015, CR-053, CR-054, CR-055 | Missing feature | High | Build now | Do this first. Many items below depend on it: QP/SDP only seeing their own records, re-route, allocating to a named ASD, true 'different person' approval. |
| 2 | Agree the role-visibility matrix: for every role, which modules, lists and records it may see (and which actions). Today every internal role sees everything and the QP/SDP sees other parties' records. | C-14, C-15, K-11, G-19, B-19 | Whole system | CR-015, CR-054 | Question for QCTO | High | Ask QCTO | Claude drafts the matrix from the 'who is involved' lines in the flow document; you and QCTO correct it. The next row builds it. |
| 3 | Build the role-visibility matrix once agreed: hide menu items, lists and records a role should not see, and block the routes. | C-14, C-15, K-11, G-19 | Whole system | CR-015, CR-054 | Flow is wrong | High | Build now | Depends on the matrix above and on demo users. |
| 4 | SDP can see all QP-submitted QSA Addendums. The SDP should not see the QSA Addendum section at all (menu, dashboard, direct URL). | B-26 | QSA Addendum | CR-015 | Bug | High | Build now | Test failed. |
| 5 | Duplicate action buttons: at the DD review stage there is a second pair of buttons the DD can use without completing the review; the IAC stage shows three sets of buttons (only the bottom pair is correct). These bypass the mandatory-comment and presentation-upload rules. Remove the extra sets and check every other module for the same pattern. | B-10, B-11, B-15 | QSA Addendum | CR-011, CR-016 | Bug | High | Build now | Serious: breaks the guards that tests B-09, B-15 rely on. |
| 6 | The ASD can see the DD review checklist and the DD's button while doing the evaluation. Each role must only see its own stage's checklist and buttons. | B-10 | QSA Addendum | CR-012, CR-015 | Bug | High | Build now |  |
| 7 | Evaluation outcome should be generated automatically from the checklist (simulated AI): a negative outcome goes to the QP (ASD sends the report back), a positive outcome goes to the DD for review. | B-10, B-13 | QSA Addendum | CR-009, CR-010, CR-012 | Flow is wrong | High | Build now | Confirm with QCTO what makes an outcome negative (e.g. any 'No' on a mandatory line?). Real AI stays a backend stub. |
| 8 | When the DD sends work back to the ASD (and when the IAC sends it for remediation) the ASD must see the DD/IAC review notes and be able to redo the report and send it again. If the redone report is negative it goes to the QP with the report; if positive it goes to the DD again and on. | B-11, B-13, B-18 | QSA Addendum | CR-012, CR-016 | Flow is wrong | High | Build now |  |
| 9 | A negative evaluation report must reach the QP together with the report, and the QP must be able to correct and resubmit it. | B-13, B-14 | QSA Addendum | CR-012 | Flow is wrong | Medium | Build now | Your question on B-14: yes, per CR-012 the QP can correct and resubmit. |
| 10 | Acknowledgement letter: 'Send back to ASD' has no note field. Add a mandatory note. | B-08 | QSA Addendum | CR-007, CR-056 | Bug | Medium | Build now |  |
| 11 | Form validation: when required fields are empty the Submit button is blocked but no message says why. Show clear messages next to the missing fields (here and on every form). | B-05 | QSA Addendum | — | Bug | Medium | Build now |  |
| 12 | CEO should only see applications waiting for an outcome-letter signature, not a full list of applications. | B-19 | QSA Addendum | CR-008 | Flow is wrong | Medium | Build now | Part of the visibility matrix. |
| 13 | Approval letter flow is wrong. New flow: ASD sees the drafted approval letter and can edit it, then submits to the DD. The DD reviews and signs, or declines it (back to the ASD to edit and resubmit). Once signed it goes back to the ASD, who sends it to the QP. | B-21 | QSA Addendum | CR-013, CR-007/008 follow-up | Flow is wrong | High | Build now | Test failed. Also answers the open question about who signs: the DD. |
| 14 | Move the audit trail out of the Details tab into its own tab. On the QP view put each letter (acknowledgement, outcome, approval) in its own tab. | B-24, B-25 | QSA Addendum | — | Other | Medium | Build now | Same pattern for instrument validation (see styling notes). |
| 15 | Format and fields of the evaluation report and checklist must match the QCTO checklist/report documents sent to you. | B-09 | QSA Addendum | CR-011 | Flow is wrong | High | Build now | Blocked until you give Claude the QCTO document (see 'documents needed'). |
| 16 | New-qualification pathway in the gate check: confirm how QCTO wants a brand-new qualification handled. | B-04 | QSA Addendum | CR-004 | Question for QCTO | Low | Ask QCTO | Already on the QCTO Questions sheet. |
| 17 | 'Approved with conditions' does not let the ASD write the conditions. Add a mandatory conditions note that the QP sees. | C-11 | EISA Instrument Validation | CR-023 | Bug | Medium | Build now |  |
| 18 | Instrument validation, external side (QP) needs tabs like the internal side (scheduling, instrument, validation outcome, details, audit trail). | C-06, C-07 | EISA Instrument Validation | CR-017 | Missing feature | Medium | Build now |  |
| 19 | Instrument validation checklist wording and fields must match the QCTO instrument-validation document sent to you. | C-09 | EISA Instrument Validation | CR-011, CR-022 | Flow is wrong | High | Build now | Blocked until you give Claude the QCTO document. |
| 20 | Required documents list: the QP only sees the instrument they uploaded. The old build had six required documents. Confirm whether QCTO still wants a required-documents list. | C-16 | EISA Instrument Validation | CR-009, CR-010 | Question for QCTO | Low | Ask QCTO |  |
| 21 | Rejected date batch: the QP cannot edit and resubmit. Allow the QP to correct and resubmit a rejected batch. | D-08 | EISA Date & Calendar | CR-032 | Flow is wrong | Medium | Build now |  |
| 22 | Postpone / cancel a sitting: should the ASD propose a new date that the QP accepts or counters, or can the sitting simply be cancelled? Decide the rule. | D-11, D-12 | EISA Date & Calendar | CR-034 | Question for QCTO | Medium | Ask QCTO | Suggestion: postpone carries an optional proposed new date in the notification; no negotiation. |
| 23 | What do Edit and Delete do for the ASD? (Edit changes a sitting's date/details; Delete removes it.) Decide whether Delete should be blocked or warn when a sitting already has registrations. | D-17 | EISA Date & Calendar | CR-027 | Question for QCTO | Medium | Ask QCTO | Answered in the review message; the rule for sittings with registrations is the open part. |
| 24 | Blocked concurrent registration leaves a duplicate registration stuck in 'Building registration' with no learners left to add. Add a way to delete/withdraw a draft registration and stop a second registration for the same SDP and sitting. | E-07 | EISA Registration | CR-040 | Bug | Medium | Build now |  |
| 25 | SOR status never changes except when flagged. Add statuses: Uploaded, Under review, Accepted, Flagged, Replaced. | E-10 | EISA Registration | CR-038 | Missing feature | Medium | Build now |  |
| 26 | SOR upload: per learner or one per registration? (Register says an SOR element per learner, which is how it is built.) Confirm. | E-12 | EISA Registration | CR-036 | Question for QCTO | Low | Ask QCTO |  |
| 27 | Add a short help line on each screen saying what it is for (EISA Confirmation vs Site Visits, etc.). | F-02, F-05 | EISA Confirmation | CR-043 | Other | Low | Build now | Confirmation = after registration, QP confirms centres, learner counts and marking/moderation dates. The RPL monitoring item in Site Visits comes from the registration, not from Confirmation. |
| 28 | QP view of Site Visits filters by qualification, not by QP. A QP must only see their own visits. | G-05 | Site Visits & Monitoring | CR-047 | Bug | Medium | Build now | Depends on demo users. |
| 29 | An AD can pick an SDP when planning a visit, but the SDP has no access to Site Visits. Should an SDP see visits that involve them (e.g. a notified marking/moderation visit)? | G-06 | Site Visits & Monitoring | CR-047 | Question for QCTO | Medium | Ask QCTO |  |
| 30 | Confirm that officials may still plan an RPL/ARPL monitoring visit by hand from the hub (today they can). | G-07 | Site Visits & Monitoring | CR-044 | Question for QCTO | Low | Ask QCTO |  |
| 31 | Visit types and each execution form must match the QCTO documents/templates sent to you (readiness, marking & moderation, RPL/ARPL, post-EISA). | G-01, G-12 | Site Visits & Monitoring | CR-048 | Flow is wrong | High | Build now | Blocked until you give Claude the QCTO documents. |
| 32 | Planning section: after the AD submits the plan it disappears, and the DD (and later roles) see nothing to review. Keep the plan visible, read-only, to every later approver. | G-08 | Site Visits & Monitoring | CR-044 | Bug | High | Build now |  |
| 33 | No Reject (or Send back) button at any stage of visit planning. | G-09 | Site Visits & Monitoring | CR-056 | Bug | High | Build now | Test failed. |
| 34 | Execution tab has no QP and qualification selectors at the top of the form. | G-13 | Site Visits & Monitoring | CR-049 | Bug | High | Build now | Test failed. |
| 35 | Re-route: decide where a report can be re-routed to and what happens (today it only writes an audit note). Re-route to another named person with the same role, shown as the new owner. | G-18 | Site Visits & Monitoring | CR-055 | Flow is wrong | Medium | Build now | Needs demo users. Confirm the allowed targets with QCTO. |
| 36 | Report visibility between units: agree the rules for who can see which visit reports (today every internal user sees every visit). | G-19 | Site Visits & Monitoring | CR-054 | Question for QCTO | Medium | Ask QCTO | Part of the role-visibility matrix. |
| 37 | The DD cannot 'Share Visit Outcome' after approving the report, so the QP receives nothing. | G-23 | Site Visits & Monitoring | CR-058, PM-07 | Bug | High | Build now | Test failed. |
| 38 | Where does an approved visit report go: to the QP, saved on the record, shown on Approval of Results? Decide and show it to the QP after sharing. | G-26 | Site Visits & Monitoring | CR-052, PM-07 | Question for QCTO | Medium | Ask QCTO | Today Approval of Results only shows the visit's status, not the report. |
| 39 | Names for the readiness notice and the marking/moderation visit request are still placeholders. | G-25 | Site Visits & Monitoring | PM-04, PM-05 | Question for QCTO | Low | Ask QCTO | Needs the two official names. |
| 40 | Results submission: replace the single competent-count with a per-learner result (Competent / Not yet competent) so the competency rate is calculated, and make clear where the submission comes from (the QP after marking). | H-05, H-11, H-12, G-24 | Approval of Results | CR-059, PM-06 | Flow is wrong | High | Build now | Also makes the low-competency and PEM tests possible without editing a number by hand. |
| 41 | Approval of Results review forms (compliance review, evidence evaluation, folder checks) must match the QCTO digital forms sent to you. | H-12 | Approval of Results | CR-059 | Flow is wrong | High | Build now | Blocked until you give Claude the QCTO documents. |
| 42 | FISA Standards and FISA Instrument Validation: captured information and evaluation checklists must match the QCTO forms sent to you. | I-02, I-03, I-07 | FISA | PM-01, PM-10 | Flow is wrong | High | Build now | Blocked until you give Claude the QCTO documents. |
| 43 | After FISA validation the SDP and officials cannot see the full completed evaluation. Show the full FISA Validation Report. | I-08 | FISA | PM-02, PM-03 | Missing feature | High | Build now |  |
| 44 | FISA registration: an SDP can create a registration but cannot add learners; there is no learner source. Add learner selection from the simulated enrolled-learner list for Skills Programmes. | I-10 | FISA | CR-026 | Bug | High | Build now | Test failed. Confirm with QCTO that learners come from Quality Assurance enrolment. |
| 45 | RPL Toolkit has no outcome letter for the CEO to sign. Generate an outcome letter from a template (like the QSA Addendum) so letters are generated everywhere. | J-04, K-08 | RPL Toolkit Evaluation | PM-09, CR-013, CR-008 | Bug | High | Build now |  |
| 46 | RPL Toolkit approval chain: add moderation checks at team level, and the IAC reviews and endorses the report. | J-03 | RPL Toolkit Evaluation | PM-09 | Flow is wrong | Medium | Ask QCTO | Confirm the exact step order. |
| 47 | RPL Toolkit evaluation report information must match the QCTO forms sent to you. | J-02 | RPL Toolkit Evaluation | PM-09 | Flow is wrong | High | Build now | Blocked until you give Claude the QCTO documents. |
| 48 | When a QP updates a toolkit, let them pick from the existing approved toolkits to update. | J-05 | RPL Toolkit Evaluation | PM-09 | Missing feature | Medium | Build now |  |
| 49 | Re-test after fixes: E-06 (duplicate block), E-15, G-22, G-24, H-11, H-12 and the other tests still marked Not tested. | E-06, E-15, G-22, G-24, H-11, H-12 | Whole system | — | Other | Medium | Build now | Test steps for these are in the review message. |

## Appendix — raw tester notes (Test Script)

| Test | Result | Tester note |
|---|---|---|
| A-01 | Pass | Needs Styling  |
| A-04 | Not tested |  |
| A-05 | Not tested |  |
| B-01 | Pass | Styling for New QASA Addendum Application modal . Styling for view modal of submitted QASA Addendum Application |
| B-02 | Pass | Styling for New QASA Addendum Application modal . Styling for view modal of submitted QASA Addendum Application |
| B-05 | Partial | The submission button is blocked but no message appears when data is missing from fields . |
| B-06 | Pass | Style the letters information .  |
| B-08 | Partial | Can send it back but no note option is avalible . |
| B-09 | Pass | Check format, information and styling of Evaluation report vs Checklist QCTO has sent us at this stage. |
| B-10 | Pass | Should not can see the DD review checklist at ASD level when doing review . Buttonof DD is avalible .Once evaluation reports outcome is generated with AI If report is negative it goes to QP if positvie it goes to DD for further review. |
| B-11 | Pass | If sent back to ASD , ASD should redo the report.There is a 2nd pair of buttons avalible that the DD can access without completing the evaluation ontop of the DD evaluation section  |
| B-13 | Partial | If DD sends back to ASD ,ASD at this level should see the DD evaluation review and be able to redo the report and send again to the DD . If ASD redo the report and get a negative outcome then ASD can send that report back to QP ,QP will recive the report . |
| B-14 | Pass | If thr report was negative and sent to the QP QP shuld not can correct and resubmit it ? |
| B-15 | Partial | There is 3 sets of buttns for AIC that they can access and click at the top of the AIC section , the bottom pair of buttons are correct. |
| B-16 | Pass | Style the info and layout of the outcome letter  |
| B-17 | Pass | Style info and layout of outcome letter  |
| B-18 | Partial | Again if sent back to ASD , ASD will redo the evaluation report , if negatie outcome it will go back to QP with the report , if positive ASD can send again to the DD and then so on  |
| B-19 | Partial | CEO should only see the applications that requires Outcome letter sighning and no other dump of applications that can clutter the CEOs space  |
| B-21 | Fail | The user ASD sould first see the drafted Approval letter and can edit the Approval letter then submit the DD , DD then reviews and can sighn the apprval letter , if approved and sighned the letter the approval letter goesback to ASD , ASD then submits the Approval letter to the QP. If DD reviews approval letter and declins it it goes back to ASD for editing and then be able to resubmit. |
| B-24 | Pass | Move the audit trail from the details tab to its owns separate tab  |
| B-25 | Pass | Move each letter into its own tab  |
| B-26 | Fail | SDP sees all the QP submitted QASA Addendums  |
| C-03 | Pass | I see not in progress addedndums , stylethe view modal of this section  |
| C-04 | Pass | style this section |
| C-05 | Pass | style modal  |
| C-06 | Pass | style modal add tabs for ecternals side  |
| C-07 | Pass | style and add tabs  |
| C-08 | Pass | style this section stage of conformaton  |
| C-09 | Pass | maske sure the evaluation of the instrument info is the same as QCTO doc they sent us  |
| C-11 | Partial | cant make notes  |
| C-12 | Pass | have audit taril in its own modal tab  |
| C-14 | Partial | all users can see the lists of addendums and validations  |
| C-15 | Partial | all internal usrs see the Instrument validation section and the QP sees this valsidation section and details ? Clarifie what they should and should not can see  |
| C-16 | Partial | the QP only sees the instrumen they have uploaded , unsure what to look here for  |
| D-02 | Pass | edit the styling  |
| D-08 | Partial | once rejected the QP cannot edit it and resubmit , I think we should allow this here |
| D-09 | Pass | edit button layout and styling  |
| D-11 | Pass | if ASD postpone they should propose a new date and QP should accept or counter ? If that is what maybe should happen  |
| D-12 | Pass | if ASD cancelles they should propose a new date and QP shoul accept or counter or just cancel the entire stitting ? If that is how it should work  |
| D-17 | Pass | find out what the delete and edit button does for the ASD  |
| E-04 | Pass | edit styling of modal  |
| E-06 | Pass | need to test verify  |
| E-07 | Pass | but now there is a duplicated resistration sitting with the status of "building registartion" and not learner can be added because all of them are added othe the other one ? Possible fix  |
| E-10 | Pass | the sor status never changes except when its flagged we should look at this  |
| E-12 | Partial | Clarifiy if each user needs an uploaded SOR or just one for the entire registration (qualification) .I see it listed at sitvisits and monitoring and at EISA Confirmation .  |
| E-15 | Not tested | not sure how to test this  |
| F-02 | Pass | why is the confirmation there ? If the qualification is already in the sitvisit section ? What does tthis section do  |
| F-05 | Partial | it was already listed at sitvisits but it did not create a new one  |
| F-06 | Not tested |  |
| G-01 | Pass | make sure the types of sitevisits are correct  |
| G-05 | Partial | I see separate qualificatios to choose from but not a selection from a QP name  |
| G-06 | Pass | but why when an AD creates a sitevsit they can slect an spd if an spd cant acess this section |
| G-07 | Pass | clarify if we can still create a RPL monitoring sitevisit from here  |
| G-08 | Partial | edit info on planning section , after AD submits the planning is no longer there and when DD gets it there is also nothing to review and the same for the other users  |
| G-09 | Fail | there is not reject buton at any stage of the planning of each user  |
| G-12 | Partial | make sure we are using the correct document info for each visit QCTO has supplied us with  |
| G-13 | Fail | I don’t see any QP and qualification selectors in the execution tab other than the document  |
| G-18 | Pass | find out where the re-rout can go and what happens  |
| G-19 | Partial | On the externals side you can oly see visits pre (Qualification selection) But seen as per QP in the internals side all users cabsee all sitevisits .  |
| G-22 | Not tested | not sure how to test this  |
| G-23 | Fail | the DD can not share out come after approval so QP recives nothing .  |
| G-24 | Not tested | don’t know how to test this  |
| G-25 | Pass | not sure what this is for clarify  |
| G-26 | Pass | find out if the report stops here ? Does ot go to the QP is the report saved some where does It feed into Approval of results ? |
| H-05 | Pass | not sure where this submission comes from or how it comes there , and how do we mesure the compentency rate because I see is 4 learners were added then its 4/4 100% compentency rate . So how do we get a low one  |
| H-11 | Not tested | I don’t know how to test this because im not sure where the informtion is coming from  |
| H-12 | Not tested | don’t know how to test this .Make sure we know how this flow works with everything else and that we have the correct documentation information for the digital forms QCTO has sent us  |
| I-02 | Pass | make sure the information captured is correct and styling |
| I-03 | Pass | make sure the correct information of the evaluation is captured that QCTO has sent us  |
| I-07 | Pass | make surethe information on the evaluation doc is what qcto sent us  |
| I-08 | Pass | but I don’t see the full evaluation report that was done apter approving and so on we need to see the full report  |
| I-10 | Fail | you can create the FISA registration but not add learners as an sdp and so on ,clarify how this should be done because I don’t know where the learners are supposed to come from  |
| I-11 | Pass | it looks separate to me  |
| J-02 | Pass | edit information to what qcto sent us and styling udate and the correct evaluation report information is done  |
| J-03 | Pass | and moderation checks at team level and at AIC review and endorse the report  |
| J-04 | Partial | there is no outcome letter generated for the ceo to sighn  |
| J-05 | Not tested | when a toolkit is a new toolkit an is approved , once the QP wants to add another toolkit and chooses the option update toolkit ,there should be an option to selcet from existing toolkits to update from  |
| K-08 | Partial | everywhere except at RPL toolkit  |
| K-11 | Fail | in inernal every role can see everything , but the action they can take is correct and the same for the external users  |
