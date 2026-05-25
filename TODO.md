# TODO

Ordered by severity: bugs/data issues first, then type safety, then cleanup.

---

## 1. Bugs & Data Issues

### 1.1 `queryClient` recreated on every render
**File:** `src/App.tsx:101`

`new QueryClient()` is instantiated inside the `App` component body. Every re-render of `App` creates a fresh client, wiping the entire query cache. Move it outside the component.

```ts
// Fix: move above the App function definition
const queryClient = new QueryClient();

const App = () => { ... }
```

---

### 1.2 Outcome letter workflow silently broken
**File:** `src/pages/accreditation/OutcomeLettersPage.tsx:111, 115, 144, 176`

`outcomeLetterWorkflow` and `generatedOutcomeLetter` are accessed via `(app as any).outcomeLetterWorkflow` / `(app as any).generatedOutcomeLetter`, but neither field exists anywhere in `AppContext`. Both calls return `undefined` at runtime. The entire outcome letter workflow state is non-functional as a result.

Fix: add `outcomeLetterWorkflow` and `generatedOutcomeLetter` as proper typed state to `AppContext`, or confirm the intended source and wire it up correctly.

---

### 1.3 `SiteVisitEvaluationTool` writes fields that don't exist on `SiteVisitReport`
**File:** `src/components/ui/SiteVisitEvaluationTool.tsx:684–699`

Six fields — `visitExecution`, `sections`, `deliveryMode`, `recommendation`, `additionalComments`, `headerFields` — are written via `(report as any).field = ...`. None of these exist on `SiteVisitReport` in `src/types/index.ts`. The data is saved to localStorage but is invisible to TypeScript, so any code reading these fields also needs `as any` (seen in `QPDashboard.tsx:351–416` and `VerifierDashboard.tsx:487`, `SiteVisitManagement.tsx:2886`).

Fix: add the missing fields to the `SiteVisitReport` type and remove all `as any` casts referencing them.

---

### 1.4 Data migration has an impossible condition
**File:** `src/contexts/AppContext.tsx:1377`

```ts
if (rawStatus === 'Allocated to QP' && enrolment.status !== 'Allocated to QP')
```

`rawStatus` is assigned from `enrolment.status as string` on line 1367 — they are the same value. This condition can never be true. The migration for `'Allocated to QP'` is dead code and will never run.

---

### 1.5 Data migration runs on every cold start with no guard
**File:** `src/contexts/AppContext.tsx:1363–1399`

The `'Allocated' → 'Allocated to QA'` migration fires every time the app loads and reads from localStorage. There is no version flag to mark it as done. If old data ever gets written back (e.g. from a second tab), the migration will re-run. Add a migration version key to localStorage (e.g. `enrolment_migration_v1 = true`) and skip the migration if it's already been applied.

---

### 1.6 Debug `useEffect` logs all enrolments on every update
**File:** `src/contexts/AppContext.tsx:1402–1408`

A `useEffect` with `[enrolments]` dependency runs `console.log('Current enrolments in AppContext:', ...)` every time any enrolment changes. This is a performance drain in addition to being a console pollution issue. Remove the entire `useEffect`.

---

### 1.7 `alert()` used for user feedback in 50+ locations
Blocking `alert()` calls are spread across the accreditation, qualifications, research, QA, and assessment domains. These block the UI thread, can't be styled, and are disruptive on mobile. All should be replaced with `toast()` from `sonner` (already installed and wired up).

Key files with the most occurrences:
- `src/pages/accreditation/SiteVisitManagement.tsx` — 9 alerts
- `src/pages/accreditation/QPDashboard.tsx` — 6 alerts
- `src/pages/accreditation/VerifierDashboard.tsx` — 4 alerts
- `src/pages/accreditation/applicationDashboard.tsx` — 3 alerts
- `src/pages/research/AgendaInformation.tsx` — 6 alerts
- `src/contexts/AppContext.tsx:218, 224, 271, 854, 989` — 5 alerts
- `src/pages/qualifications/internal/ResolutionPhase.tsx:423, 425, 474` — 3 alerts
- `src/services/mockAccreditationService.ts:26` — 1 alert (for localStorage quota exceeded — this one actually warrants a proper error UI, not just a toast)

---

### 1.8 localStorage quota exceeded handled with `alert()` only
**File:** `src/services/mockAccreditationService.ts:26`

When saving fails (storage full), the app calls `alert('Failed to save... file may be too large')`. There's no recovery path, no attempt to clean up old data, and the user is left in an inconsistent state. Needs a proper error boundary / toast + guidance to the user.

---

## 2. Type Safety

### 2.1 Duplicate `ApplicationStatus` interface
**File:** `src/types/index.ts:550` and `src/types/index.ts:687`

`ApplicationStatus` is exported twice. TypeScript merges duplicate interface declarations, so both definitions are active simultaneously — but this is confusing, error-prone, and hides which fields are canonical. The first definition (line 550) has fields not in the second: `paymentAllocatedToApplicationId`, `paymentReferenceUsed`, `paymentVerifiedForCorrectApplication`, `paymentVerificationNotes`, `initialQualificationChecks`, `requiredApplicantDocuments`, `applicantRequiredUploads`, `financeVerificationRequested`, `financeVerificationRequestedAt`. The stale comment markers (`// Update ApplicationStatus interface`, `// Add to ApplicationStatus interface if not already there`) confirm these were incremental edits where the old definition was never removed.

Fix: merge both into a single definition and delete the duplicate. Also remove the stale comments at lines ~501, ~549, ~686.

---

### 2.2 `SiteVisitReport` type is missing fields used throughout the codebase
**File:** `src/types/index.ts` (the `SiteVisitReport` interface)

`visitExecution`, `sections`, `deliveryMode`, `recommendation`, `additionalComments`, and `headerFields` are written and read on `SiteVisitReport` objects across `SiteVisitEvaluationTool.tsx`, `QPDashboard.tsx`, `VerifierDashboard.tsx`, and `SiteVisitManagement.tsx` — all via `as any` because the type doesn't include them. Add these fields to `SiteVisitReport` directly; this single fix will unblock removing ~20 `as any` casts downstream.

---

### 2.3 `OutcomeLetterWorkflow` and `GeneratedOutcomeLetter` not in `AppContextType`
**File:** `src/contexts/AppContext.tsx` (the `AppContextType` interface) and `src/pages/accreditation/OutcomeLettersPage.tsx:111–176`

`OutcomeLettersPage` casts `app` to `any` to access workflow state that isn't in the context. Either add these fields to `AppContextType` with proper types, or refactor the page to manage this state locally if it truly doesn't need to be global.

---

### 2.4 `details?: any` in `AuditEntry`
**File:** `src/contexts/AppContext.tsx:17`

The `AuditEntry` interface has `details?: any`. Since audit entries are persisted to localStorage and displayed in the audit trail UI, this field should have a defined shape. Define a `AuditEntryDetails` type or use `Record<string, unknown>` at minimum.

---

### 2.5 131 remaining `as any` casts — by file
All other casts that remain after fixing 2.2 and 2.3 above:

**Accreditation domain (highest risk — data persistence paths):**
- `src/pages/accreditation/AccreditationInternalDashboard.tsx:1010` — form data cast
- `src/pages/accreditation/applicationDashboard.tsx:653, 1158` — application object and type cast
- `src/pages/accreditation/applicationRegistration.tsx:220, 307` — form submission casts
- `src/users/dashboardTabs/AccreditationDomain.tsx:58` — document type cast

**Research domain status strings (root cause: status union types are too narrow):**
- `src/pages/research/subtabs/ApprovalWorkspace.tsx` — 8 casts, all status string literals
- `src/pages/research/subtabs/SubmissionApproval.tsx` — 16 casts, all status string literals
- `src/pages/research/subtabs/ReviewRecommendation.tsx` — 12 casts, all status string literals
- `src/pages/research/subtabs/ResearchWorkspace.tsx` — 10 casts, all status string literals
- `src/pages/research/subtabs/DesignLayoutWorkspace.tsx` — 3 casts
- `src/pages/research/subtabs/Publishing.tsx` — 5 casts
- `src/pages/research/subtabs/SLAPreparation.tsx` — 2 casts
- `src/pages/research/subtabs/TORDevelopment.tsx` — 4 casts
- `src/pages/research/subtabs/SubmissionWorkspace.tsx` — 9 casts

The pattern for the research subtabs is identical: a status string literal like `'TOR In Progress'` is cast to `as any` because it isn't in the relevant union type. The fix is to add the missing string literals to the status union type in `src/types/index.ts` rather than casting each individual assignment.

**Form/select value casts (low risk, easy fix):**
- `src/pages/Dashboard.tsx:211` — `v as any` in Select `onValueChange`
- `src/pages/Batches.tsx:371` — `v as any` in Tabs `onValueChange`
- `src/pages/internalCorrections.tsx:355, 370, 538` — `v as any` in Select/Tabs
- `src/components/modals/CyclePlanModal.tsx:401, 541` — `e.target.value as any`
- `src/pages/QA/subtabs/MonitoringSkillsProgrammes.tsx:564` — `e.target.value as any`
- `src/pages/QA/subtabs/SiteVisitManagement.tsx:523, 536` — `e.target.value as any`
- `src/pages/qualifications/RegisteredQualificationsModal.tsx:52` — tab id cast
- `src/users/dashboardTabs/InternalQualificationsDomain.tsx:191, 282` — tab id cast
- `src/users/dashboardTabs/QualificationsDomain.tsx:109` — tab id cast

For all of these: define the allowed values as a union type or enum and let the select/tab component be typed accordingly instead of casting the output.

**Role checks:**
- `src/users/dashboardTabs/ProfileIntake.tsx:230, 378` — `currentRole as any` in `includes()` check

Fix: type `allowedReplaceRoles` as `AppRole[]` so `includes()` accepts `AppRole` without casting.

**Assessment status casts:**
- `src/pages/assessment/QualityAssurance.tsx:314, 327, 344, 998, 1000` — status and type casts on form data

---

### 2.6 Research status union types are incomplete
**File:** `src/types/index.ts` — the union types for `ResearchRequest.internalStatus`, `BulletinSubmission.status`, etc.

At least 15 string literals used in the research subtabs (`'TOR In Progress'`, `'Ready for SLA Preparation'`, `'Pending Legal Review'`, `'Under Legal Review'`, `'Pending CEO Approval (SLA)'`, `'Under CEO Approval (SLA)'`, `'Pending Research'`, `'Layout In Progress'`, `'Internal Approval Pending'`, `'Under Internal Approval'`, `'Under CEO Approval'`, `'Pending CEO Approval'`, `'Approved – Final Submission'`, `'Ready for Publishing'`, `'Submission In Progress'`, etc.) are not in the declared union. Add them all. This will eliminate the bulk of the research subtab casts from item 2.5.

---

## 3. Cleanup & Polish

### 3.1 Remove debug `console.log` statements
60+ console statements remain across production code. Remove all of them. The ones with meaningful context (errors, migrations) should stay as `console.error` or be replaced with a proper logger.

Files with the most logs to remove:
- `src/contexts/AppContext.tsx` — 25 statements (lines: 365, 794, 1371, 1378, 1388, 1403–1407, 1425, 1430, 1431, 1437, 1579, 1710, 1716, 1735)
- `src/departments/DepartmentLogin.tsx:76–98` — 8 debug statements logging credentials
- `src/components/ProtectedDepartmentRoute.tsx:18, 26, 46, 51` — 4 auth flow logs
- `src/pages/accreditation/applicationDashboard.tsx:190–192` — logs full application + documents
- `src/pages/qualifications/internal/DevelopmentWorkspace.tsx:92–96, 193, 215` — filter debug logs
- `src/pages/qualifications/internal/InternalApplications.tsx:49, 61, 67, 80` — workflow logs
- `src/pages/qualifications/internal/ResolutionPhase.tsx:161, 170, 172, 187, 208` — storage logs
- `src/pages/research/subtabs/ApprovalWorkspace.tsx:81, 92, 94, 135, 145, 147, 187` — approval flow logs
- `src/pages/accreditation/applicationRegistration.tsx:344` — logs submitted form data
- `src/users/ProfilesLogin.tsx:18, 25` — logs all stored profiles
- `src/pages/QA/subtabs/*` — 10+ data-shape debug logs

---

### 3.2 Remove duplicate config files
The following files are stale and should be deleted. The `.js` versions take precedence and are the ones actually used:

- **Delete:** `vite.config.ts` (keep `vite.config.js`)
- **Delete:** `tailwind.config.ts` (keep `tailwind.config.js`)

Also: `tsconfig.json` and `tsconfig.app.json` both configure TypeScript with different strictness settings (`tsconfig.app.json` has `noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly` while `tsconfig.json` does not). Vite uses `tsconfig.app.json` for the build; `tsconfig.json` is used by editor tooling. Align them so editor and build see the same rules.

---

### 3.3 Centralise localStorage keys as constants
30+ localStorage keys are bare string literals scattered across files with no single source of truth. If a key is renamed or mistyped, nothing warns you.

Create `src/lib/storageKeys.ts`:
```ts
export const STORAGE_KEYS = {
  PROFILES: 'profiles',
  CURRENT_USER: 'currentUser',
  CURRENT_PROFILE: 'currentProfile',
  LEARNER_ENROLMENTS: 'learner_enrolments',
  ACCREDITATION_APPLICATIONS: 'accreditationApplications',
  RESEARCH_PROJECTS: 'research_projects',
  RESEARCH_AGENDAS: 'research_agendas',
  // ... all others
} as const;
```

Full list of keys to include (found across the codebase):
`profiles`, `currentUser`, `currentProfile`, `currentUserRole`, `accreditationApplications`, `applications`, `learner_enrolments`, `research_projects`, `research_agendas`, `research_audit_trail`, `research_approved_requests`, `approved_research_requests`, `bulletin_calls`, `bulletin_submissions`, `external_applications`, `cyclePlans`, `internalCyclePlans`, `registeredQualifications`, `publicInputQualifications`, `approvalQualifications`, `resolutionProjects`, `scheduledVisits`, `siteVisitAllocations`, `desktopReports`, `categoryAllocations`, `assignments`, `all_availability_slots`, `fisa_validation_submissions`, `submittedPhaseReports`, `publicSubmissions`

---

### 3.4 Remove stale comments from `src/types/index.ts`
Lines ~501, ~549, ~686 have inline comments like `// Update ApplicationStatus interface` and `// Add to ApplicationStatus interface if not already there` — these are work-in-progress edit notes, not documentation. Remove them when fixing item 2.1.

---

### 3.5 `App.tsx` has a duplicate import comment
**File:** `src/App.tsx:66–67`

```ts
// Research domain pages
// Research domain pages   ← duplicate
```

Minor, but tidy it up.

---

### 3.6 Assessment site-visit routes all render the same component
**File:** `src/App.tsx:240–263`

Six routes under `site-visits/*` all render `<InternalSiteVisitsAndMonitoringPage />`. The component presumably reads `useLocation()` to decide what to show. This is fine but should be documented (add a one-line comment explaining the pattern) so it doesn't look like a routing error.
