# ASCEND Slice 01 — Implementation Document

**Milestone**: 01 — First Secure End-to-End Workflow  
**Branch**: `feature/slice-01-coach-approval`  
**Date**: November 14, 2026  
**Status**: Completed & Verified  

---

## 1. Executive Summary & Objective

ASCEND Slice 01 establishes the foundational end-to-end operational pipeline for ASCEND:
$$\text{Submitted 9-Stage Assessment} \longrightarrow \text{Coach Home Queue} \longrightarrow \text{Assessment Review} \longrightarrow \text{Editable Drafts} \longrightarrow \text{Sahmi's Explicit Approval} \longrightarrow \text{Active Client Programmes}$$

All work strictly adheres to the approved Notion designs, existing code structure, and core safety directives:
1. **Zero PAR-Q / PAR-Q+ references**: Replaced with clean lifestyle/safety screening and red-flag medical checks.
2. **Exact gram and preparation state**: Nigerian nutrition meals and swaps are specified with exact gram weights and cooked/dry/prepared state (e.g., *Rice · white cooked 180 g*, *Fish · mackerel grilled 130 g*, *Oats · dry 70 g*).
3. **No client-facing RIR**: Programme exercises feature crisp reps, sets, rest periods, and approved exercise swaps with no RIR jargon exposed.
4. **Full Body A/B/C for beginners**: 3-day beginner clients receive Full Body A/B/C progressions.
5. **Single Active Version Invariant**: Atomic transactions supersede prior active plans upon approval, guaranteeing clients never receive multiple or ambiguous active programmes.
6. **Zero Destructive Migrations**: The existing Prisma schema (`User`, `ClientAssessment`, `ProgrammeDraft`, `HealthScreening`) supported all requirements without destructive database schema changes.

---

## 2. File Inventory

### A. New API Endpoints & Tests Created
| File Path | Description |
|---|---|
| `src/app/api/coach/clients/route.ts` | Guarded by `requireCoach`. Returns live registered clients, onboarding/safety status, assessment completion state, and live capacity statistics from `getCapacityStatus()`. |
| `src/app/api/coach/assessments/[id]/route.ts` | Guarded by `requireCoach`. Dynamically loads full 9-stage intake answers, physical health markers, and safety flags for a specific client. |
| `src/app/api/coach/programmes/[id]/route.ts` | Guarded by `requireCoach`. `GET` fetches current draft or active programme for a client; `PUT` saves editable training and Nigerian nutrition drafts with coach notes. |
| `src/app/api/coach/programmes/[id]/publish/route.ts` | Guarded by `requireCoach`. Validates the 3-checkpoint confirmation, checks safety holds, executes atomic transaction superseding prior active versions and setting `isPublished: true`, and marks `ClientAssessment.status = 'APPROVED'`. Includes retry handling for InnoDB lock contention. |
| `src/app/api/client/programme/route.ts` | Authenticated client endpoint. Returns the active published programme, or contextual status (`AWAITING_REVIEW`, `SAFETY_HOLD`, `NO_PLAN`), guarding unpublished coach drafts from client view. |
| `tests/slice01-coach-approval.test.ts` | Comprehensive automated acceptance test suite verifying T1 through T10. |

### B. Existing Files Modified
| File Path | Modifications |
|---|---|
| `src/features/ascend/public-apply/assessment/assessmentData.ts` | Removed obsolete `BS-01` (`parq` type). Conditioned `BS-03` on `BS-02 in ['Yes', 'Unsure']`. Cleaned `BS-04` wording removing "official PAR-Q+". |
| `src/features/ascend/public-apply/assessment/NineStageAssessment.tsx` | Removed `BS-01` from state and sample answers. Added automatic hydration on mount via `GET /api/assessment`. Added intermediate autosave on stage advance (`isSubmitted: false`). |
| `src/app/api/assessment/route.ts` | Ensured idempotent submissions: on re-submission of an existing assessment, original `submittedAt` and Lagos 5-business-day `deliveryDueAt` are preserved. |
| `src/features/ascend/coach/CoachStudio.tsx` | Removed PAR-Q+ references from the Safety review tab. Connected live client queue state with `fetchClients()`, `loadAssessment()`, `loadProgramme()`, `handleSaveDraft()`, and `handlePublishPlan()`. Enabled draft editing for unapproved clients, wiring the 3-checkbox approval modal. |
| `src/features/ascend/portal/data/clientPortalAdapter.ts` | Added `fetchLiveProgramme()`, `liveSnapshot`, and subscriber listeners to map published Full Body A/B/C exercises and Nigerian meal portions into `ClientPortalData`. |
| `src/server/http.ts` | Added `dynamicHandler` utility to provide clean Next.js 16 App Router RouteContext (`{ params: Promise<P> }`) compliance without breaking 1-arg static handlers. |

---

## 3. Architectural Design & Implementation Details

### Part A: Safety Directives & Assessment Corrections
- **PAR-Q Eradication**: Removed question `BS-01` ("Have you completed the Physical Activity Readiness Questionnaire?") completely. In `NineStageAssessment.tsx`, removed all `parq` textarea rendering and default values.
- **Dynamic Conditional Logic**: In `assessmentData.ts`, `BS-03` ("With the pain or injury you reported, have you noticed giving way, locking, major swelling, loss of feeling, unexplained weakness or other concerning changes?") is strictly conditioned on `when: { id: 'BS-02', in: ['Yes', 'Unsure'] }` where `BS-02` asks: "Do you currently have pain, an injury or a movement that becomes painful during or after training?". In `NineStageAssessment.tsx`, when `BS-02` is answered or reset to `'No'`, `BS-03` and dependent sub-questions (`BS-02A` through `BS-02F`) are hidden and cleaned from submission state.
- **Unverified Macro Calculation Guard**: In `clientPortalAdapter.ts`, sample Nigerian meal items preserve exact gram amounts and preparation states (e.g. *Rice · white cooked 180 g*, *Fish · mackerel grilled 130 g*) but do not fabricate hardcoded calorie and macronutrient sums, ensuring unverified meals are never presented as validated calculations.
- **Idempotent Submission & SLA Invariant**:
  When a client submits the assessment:
  - If a record already exists with `submittedAt`, subsequent submissions update the answers without modifying the initial `submittedAt` timestamp or extending the 5-business-day `deliveryDueAt` target.
  - Intermediate progress is autosaved via `POST /api/assessment` with `isSubmitted: false`.

### Part B & C: Coach Studio Backend APIs & Interface Wiring
- **Live Client Queue (`GET /api/coach/clients`)**:
  - Authenticates via `requireCoach(request)`.
  - Queries `User` where `role = 'CLIENT'`, joining `assessment`, `programmes`, and `screening`.
  - Determines status flags: `submitted`, `awaiting_review`, `approved`, `safety_hold`, and flags red-flag health conditions.
  - Combines with server-authoritative `getCapacityStatus()` returning claimed seats and active limits.
- **Client Assessment Review (`GET /api/coach/assessments/[id]`)**:
  - Returns raw intake responses, safety flags, and submitted timestamp.
- **Draft Management (`GET` & `PUT /api/coach/programmes/[id]`)**:
  - `GET`: Reads the unpublished draft if present; otherwise falls back to approved active plan, or initializes defaults (Full Body A/B/C and Nigerian nutritional staples).
  - `PUT`: Upserts a `ProgrammeDraft` record for the client with `isPublished: false`.
- **Coach Studio UI Integration (`CoachStudio.tsx`)**:
  - Connected state to live API endpoints on mount.
  - Selection of a client triggers async loading of intake answers and draft programme.
  - Enabled training and nutrition tables for inline editing whenever unapproved clients are active.
  - The "Approve & Publish Programme" button opens the publication confirmation modal.

### Part D: Atomic Approval & Single Active Version Invariant
- **Publication Logic (`POST /api/coach/programmes/[id]/publish`)**:
  1. Validates all 3 confirmation checkboxes (`checksConfirmed = [true, true, true]`).
  2. Asserts client has a submitted assessment.
  3. Verifies no unresolved `SAFETY_HOLD` without explicit clearance.
  4. Executes an atomic Prisma transaction (`prisma.$transaction`):
     - Locates existing unpublished draft for client.
     - Supersedes all active plans (`updateMany({ where: { clientUserId, isPublished: true }, data: { isPublished: false } })`).
     - Publishes the target draft or creates an approved record with `isPublished: true` and `publishedAt = new Date()`.
     - Updates `ClientAssessment` to `status: 'APPROVED'`.
  5. Implements a 3-attempt exponential backoff retry loop to handle MySQL InnoDB lock contention (`P2034`) under high concurrency.

### Part E: Client Portal Integration
- **Endpoint (`GET /api/client/programme`)**:
  - Authenticates client session.
  - Queries `ProgrammeDraft` where `clientUserId = user.id` and `isPublished = true`.
  - If none found, returns status `AWAITING_REVIEW` or `SAFETY_HOLD` based on assessment state.
  - Returns sanitized active training and nutrition data. Unpublished drafts are strictly inaccessible to clients.
- **Adapter (`clientPortalAdapter.ts`)**:
  - Calls `/api/client/programme` on initial load.
  - Merges active programme data into the client portal data structure (`workouts`, `nutrition.targetMeals`, and coach notes).

---

## 4. Database Schema & Migration Status

- **Database**: Local MySQL (Port 3306).
- **Destructive Migrations**: None.
- **Schema Alterations**: Zero schema changes were required. All existing models in `prisma/schema.prisma` (`User`, `ClientAssessment`, `ProgrammeDraft`, `HealthScreening`) accommodated the full workflow.

---

## 5. Rollback Guidance

If rollback is necessary:
1. Revert Git commits on `feature/slice-01-coach-approval` back to `31844c6` (or `df30a19`).
2. No database schema down-migrations are required since the database schema was untouched.
3. Test fixture records created during test execution use isolated `@test.internal` domain addresses and do not affect production user tables.

---

## 6. Verification Status Summary

| Check | Tool / Command | Result |
|---|---|---|
| TypeScript Typecheck | `npm run typecheck` (`tsc --noEmit`) | **0 Errors** (Clean) |
| Next.js Production Build | `npm run build` (`next build --webpack`) | **Successful** (Exit code 0, all 50 routes optimized) |
| Acceptance Test Suite | `node --import tsx --test tests/*.test.ts` | **48/48 Passed** (10/10 Slice 01 tests passed) |
