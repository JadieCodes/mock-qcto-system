# Assessments v2 — swap plan (replacing the old Assessments)

## Why this is safe

- All v2 code lives in ONE folder: `src/features/assessments-v2/`. Nothing else in the app imports from it except the router.
- v2 imports nothing from the old assessment code or from other domains — only shadcn UI, `src/lib/utils` and npm packages.
- The only edit outside the v2 folders is ONE lazy-loaded route in the router.

So the old Assessments and every other domain keep working exactly as before while v2 is built.

## While v2 is being built

- v2 is mounted at `/assessments-v2`. Reach it by typing the URL (no link on the department picker).
- The old route is untouched.
- Work on the `assessments-v2` branch. Commit at the end of every phase.

## Before the swap — checks

1. Phase 8 register check-off is complete (every CR Done / Stubbed / explained).
2. QCTO has walked through v2 and signed it off.
3. Find everything that still depends on the OLD code:
   ```
   git grep -n "pages/assessment"
   ```
   Anything outside `src/pages/assessment/` that shows up must be dealt with before the old folder is deleted (some of the loose files in `src/pages/` may use old assessment components).
4. `npm run build` and `npm run lint` pass on the branch.

## The swap (two small steps, in this order)

**Step 1 — point the live Assessments route at v2** (keep the old one as a fallback)
- Merge `assessments-v2` into your main integration branch. Because v2 is one new folder plus one router line, merge conflicts should be minimal.
- In the router, make the real Assessments route render `AssessmentsV2Routes`.
- Move the old Assessments to a temporary path such as `/assessments-legacy`.
- Let QCTO use it for a sprint or two.

**Step 2 — retire the old code**
- Tag the commit first so you can always go back: `git tag before-assessments-swap`
- Delete `src/pages/assessment/` (after the `git grep` check above is clean).
- Rename `src/features/assessments-v2` to `src/features/assessments`, update the one router import, and remove the `-v2` from labels/paths if any are visible to users.
- Remove the `/assessments-legacy` route.

## Rollback

- Before Step 2: change the router line back to the old component. Nothing else needs to change.
- After Step 2: `git revert` the retire commit, or check out the `before-assessments-swap` tag.

## What does NOT change in the swap

The other domains (Accreditation, QA, Qualifications, Research), the portals, login and shared UI are never touched.

## Later: connecting the real backend

All v2 data goes through `mock/api`, and backend-only items sit behind typed stubs in `mock/integrations/`. When the backend exists, replace the functions in those two places; the screens do not change.
