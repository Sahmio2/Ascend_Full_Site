# ASCEND Slice 01 — Quality Assurance & Test Report

**Milestone**: 01 — First Secure End-to-End Workflow  
**Branch**: `feature/slice-01-coach-approval`  
**Date**: November 14, 2026  
**Test Suite**: `tests/slice01-coach-approval.test.ts` & full test suite (`tests/*.test.ts`)  
**Status**: All 50 Tests Passing (12/12 Milestone 01 Acceptance Tests Passing)  

---

## 1. Acceptance Test Matrix (T1 – T12)

| ID | Test Scenario | Expected Outcome | Result | Evidence |
|---|---|---|---|---|
| **T1** | Assessment Idempotence & Delivery Due Date | Submitting assessment twice preserves original `submittedAt` and 5-business-day `deliveryDueAt` | **PASS** | Initial submission and re-submission share identical `submittedAt` and `deliveryDueAt` timestamps. |
| **T2** | Coach Route RBAC & Unauthorized Rejection | Client session or unauthenticated request to Coach API endpoints rejected with 401/403 | **PASS** | Client user gets HTTP 403 on `/api/coach/clients`, `/api/coach/assessments/[id]`, `/api/coach/programmes/[id]`. |
| **T3** | Cross-Client Isolation | Client cannot access another client's assessment data or active programme | **PASS** | Client A receives HTTP 403 trying to access Coach assessment endpoints; `/api/client/programme` strictly scopes by session userId. |
| **T4** | Incomplete / Blocked Client Gate | Client without submitted assessment or on hold cannot see active coaching | **PASS** | Client without published plan receives `status: 'AWAITING_REVIEW'` or `NO_PLAN` with null programme data. |
| **T5** | Draft Plan Concealment | Saving draft plan keeps client portal in awaiting review state | **PASS** | Coach `PUT /api/coach/programmes/[id]` saves draft (`isPublished: false`). Client `GET /api/client/programme` returns `hasActiveProgramme: false`. |
| **T6** | Approval & v1 Publication | Sahmi publishes draft; client portal transitions to active plan | **PASS** | Single active plan published with exact Nigerian macros and Full Body exercises. Client `GET /api/client/programme` returns active plan. |
| **T7** | Version Superseding & History Retention | Publishing v2 marks v1 superseded (`isPublished: false`) while keeping it in DB | **PASS** | After v2 publication, v1 has `isPublished: false`, v2 has `isPublished: true`, total records = 2, client receives v2. |
| **T8** | Concurrent Double-Publish Race Resilience | Concurrent publish calls cannot result in multiple active plans | **PASS** | Two concurrent publish requests result in serialization/retry. Client has exactly 1 active plan in DB (`activeCount === 1`). |
| **T9** | Medical / Safety Hold Gate | Client on medical/safety hold cannot have plan published without clearance | **PASS** | Publish request for client on `SAFETY_HOLD` without clearance throws HTTP 403 (`SAFETY_HOLD_ACTIVE`). |
| **T10** | Mandatory 3-Checkpoint Confirmation | Missing any of the 3 confirmation checkboxes rejects publication | **PASS** | Passing `[true, false, true]` returns HTTP 400 (`ALL_PUBLICATION_CHECKS_REQUIRED`). |
| **T11** | Saved Draft Isolation | Modifying/saving a draft does NOT alter an already active published programme until Sahmi republishes | **PASS** | Active v1 remains untouched and published while draft v2 is edited in isolation; client continues seeing v1 until Sahmi executes publish transaction. |
| **T12** | Assessment Autosave Resumption & Queue Visibility | Client autosaves intermediate progress, resumes via GET, completes, and appears in Coach Queue | **PASS** | Client autosaves partial answers (`isSubmitted: false`), resumes with answers intact, submits (`isSubmitted: true`), and appears in `GET /api/coach/clients` with `deliveryDueAt`. |

---

## 2. Full Test Execution Evidence

### Command
```bash
node --import tsx --test tests/*.test.ts
```

### Complete Test Output
```text
> ascend-full-stack@1.0.0 test
> node --import tsx --test tests/*.test.ts

[AUTH CHALLENGE] CLIENT_EMAIL_OTP code for access_cooldown@test.internal: 360518
✔ Access 1: Client OTP start generates 6-digit challenge and enforces 60s cooldown (1442.543068ms)
[AUTH CHALLENGE] CLIENT_EMAIL_OTP code for access_brute@test.internal: 319242
✔ Access 2: Client OTP verify rejects invalid code and locks out after 5 failed attempts (420.604797ms)
[AUTH CHALLENGE] CLIENT_EMAIL_OTP code for access_replay@test.internal: 164330
✔ Access 3: Client OTP verify establishes session, sets cookie, and prevents replay (534.721528ms)
✔ Access 4: Account recovery preserves anti-enumeration on unknown emails (83.281879ms)
[AUTH CHALLENGE] COACH_MFA code for coach_test@test.internal: 132019
✔ Access 5: Coach login rejects non-coach users, requires password + MFA before session issuance (575.581217ms)
[AUTH CHALLENGE] CLIENT_EMAIL_OTP code for access_client@test.internal: 511622
✔ Access 6: GET /api/account/snapshot returns server-authoritative state and logout clears session (128.103355ms)
✔ Billing 1: Computes Lagos ISO week key accurately (1202.929694ms)
✔ Billing 2: getCapacityStatus reports capacity and policy invariants (106.027032ms)
✔ Billing 3: reserveCapacitySlot grants 30-min reservation and commits on fulfillment (87.952994ms)
✔ Billing 4: Webhook HMAC-SHA512 raw byte verification rejects tampered requests (78.886041ms)
✔ Billing 5: Weekly onboarding limit throttles after 3 slots in same week (508.250384ms)
✔ Endpoint 1: Rejects impersonation attempts with email only or userId (73.179796ms)
✔ Endpoint 2: Rejects non-existent email credentials with 401 (1252.397454ms)
✔ Endpoint 3: Blocks demo-login bypass in production mode (3.544637ms)
✔ Endpoint 4: Enforces login rate limiting on repeated failed attempts (705.965544ms)
✔ Endpoint 5: Sets secure cookie attributes and rotates previous sessions (485.942327ms)
✔ Endpoint 6: Rejects unauthenticated and revoked sessions on protected routes (9.535201ms)
✔ Endpoint 7: Logout revokes session in DB and rejects future requests (280.020142ms)
✔ Endpoint 8: Existing email plus arbitrary long password fails with 401 (309.054959ms)
✔ Endpoint 9: One user’s password cannot authenticate another user (661.173108ms)
✔ Endpoint 10: Existing account without credentials (passwordHash: null) fails closed (117.272897ms)
✔ HTTP 1: Cookie issuance on valid login via HTTP POST /api/session (1975.303076ms)
✔ HTTP 2: Protected-route access with issued cookie via HTTP GET /api/progress (183.382387ms)
✔ HTTP 3: Cross-client isolation between User A and User B via real HTTP (646.369137ms)
✔ HTTP 4: Logout via HTTP DELETE /api/session revokes session and rejects future requests (305.767485ms)
✔ 1. Prisma connects to local XAMPP MySQL and core tables exist (496.737561ms)
✔ 2. Achievement catalogue data is populated (255.572687ms)
✔ 3. Unauthenticated sessions fail closed (3.949729ms)
✔ 4. Cross-client isolation: User B cannot view or modify User A records (464.734234ms)
✔ 5. Saving measurement, idempotency replay, and soft deletion (67.321966ms)
✔ rejects ownership injection, wrong units, invalid numbers and future observations (22.73869ms)
✔ normalizes equivalent timestamps for duplicate detection (2.646272ms)
✔ removal predicate always includes authenticated owner (1.291563ms)
✔ expired and revoked sessions fail closed (0.537339ms)
✔ mutation rejects cross-origin and missing-origin requests (8.373329ms)
✔ body limit is enforced without Content-Length (43.966175ms)
✔ strict bounded periods and pagination; all-time has no cutoff (2.001734ms)
✔ complete catalogue has unique IDs, eight groups and disabled award evaluation (0.333481ms)
✔ Slice 01 - T1: Client submits same assessment twice: idempotent submission & single queue delivery date (1251.702061ms)
✔ Slice 01 - T2: Unauthenticated or wrong-role user cannot view or mutate coach records (41.656969ms)
✔ Slice 01 - T3: Wrong client ID cannot read another clients assessment or active programme (63.466979ms)
✔ Slice 01 - T4: Incomplete / unpaid / blocked client cannot see active coaching (161.069045ms)
✔ Slice 01 - T5: Save draft -> client still sees awaiting plan, not draft (89.190987ms)
✔ Slice 01 - T6: Publish v1 -> client sees exactly one Active training and one Active nutrition version (171.961024ms)
✔ Slice 01 - T7: Publish v2 -> v1 is Superseded and history still references v1 (58.866797ms)
✔ Slice 01 - T8: Concurrent double publish cannot create two Active versions (334.534961ms)
✔ Slice 01 - T9: Medical/safety hold is not bypassed and blocks plan publication without clearance (42.752372ms)
✔ Slice 01 - T10: All 3 publish checkpoint confirmation checks are strictly required (28.367695ms)
✔ Slice 01 - T11: Saved draft changes do not modify an already published programme until Sahmi explicitly republishes (191.502757ms)
✔ Slice 01 - T12: Assessment resumption and Coach queue visibility (173.035125ms)
ℹ tests 50
ℹ suites 0
ℹ pass 50
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 14894.413607
```

---

## 3. Production Build & Typecheck Verification

### Typecheck
```bash
npm run typecheck
```
**Result**: Clean run with 0 errors (`tsc --noEmit` exited code 0).

### Build
```bash
npm run build
```
**Result**: Next.js 16.4.6 production build completed successfully with webpack.
- All 50 routes compiled (including all 4 dynamic coach routes and 1 dynamic client programme route).
- Prerendering and dynamic server route generation verified.
- Static page generation verified.
