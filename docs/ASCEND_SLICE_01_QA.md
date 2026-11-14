# ASCEND Slice 01 — Quality Assurance & Test Report

**Milestone**: 01 — First Secure End-to-End Workflow  
**Branch**: `feature/slice-01-coach-approval`  
**Date**: November 14, 2026  
**Test Suite**: `tests/slice01-coach-approval.test.ts` & full test suite (`tests/*.test.ts`)  
**Status**: All 48 Tests Passing (10/10 Milestone 01 Acceptance Tests Passing)  

---

## 1. Acceptance Test Matrix (T1 – T10)

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
| **T9** | Medical / Safety Hold Gate | Client on medical/safety hold cannot have plan published without clearance | **PASS** | Publish request for client on `SAFETY_HOLD` without clearance throws HTTP 400 (`CANNOT_PUBLISH_SAFETY_HOLD`). |
| **T10** | Mandatory 3-Checkpoint Confirmation | Missing any of the 3 confirmation checkboxes rejects publication | **PASS** | Passing `[true, false, true]` returns HTTP 400 (`ALL_PUBLICATION_CHECKS_REQUIRED`). |

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

[AUTH CHALLENGE] CLIENT_EMAIL_OTP code for access_cooldown@test.internal: 911147
✔ Access 1: Client OTP start generates 6-digit challenge and enforces 60s cooldown (587.804872ms)
[AUTH CHALLENGE] CLIENT_EMAIL_OTP code for access_brute@test.internal: 919623
✔ Access 2: Client OTP verify rejects invalid code and locks out after 5 failed attempts (120.392685ms)
[AUTH CHALLENGE] CLIENT_EMAIL_OTP code for access_replay@test.internal: 290072
✔ Access 3: Client OTP verify establishes session, sets cookie, and prevents replay (376.99583ms)
✔ Access 4: Account recovery preserves anti-enumeration on unknown emails (63.679097ms)
[AUTH CHALLENGE] COACH_MFA code for coach_test@test.internal: 650197
✔ Access 5: Coach login rejects non-coach users, requires password + MFA before session issuance (359.599346ms)
[AUTH CHALLENGE] CLIENT_EMAIL_OTP code for access_client@test.internal: 124896
✔ Access 6: GET /api/account/snapshot returns server-authoritative state and logout clears session (86.263943ms)
✔ Billing 1: Computes Lagos ISO week key accurately (487.080164ms)
✔ Billing 2: getCapacityStatus reports capacity and policy invariants (67.546902ms)
✔ Billing 3: reserveCapacitySlot grants 30-min reservation and commits on fulfillment (98.893626ms)
✔ Billing 4: Webhook HMAC-SHA512 raw byte verification rejects tampered requests (1.207436ms)
✔ Billing 5: Weekly onboarding limit throttles after 3 slots in same week (126.86579ms)
✔ Endpoint 1: Rejects impersonation attempts with email only or userId (24.214224ms)
✔ Endpoint 2: Rejects non-existent email credentials with 401 (660.150482ms)
✔ Endpoint 3: Blocks demo-login bypass in production mode (1.926903ms)
✔ Endpoint 4: Enforces login rate limiting on repeated failed attempts (362.744205ms)
✔ Endpoint 5: Sets secure cookie attributes and rotates previous sessions (340.791355ms)
✔ Endpoint 6: Rejects unauthenticated and revoked sessions on protected routes (2.752154ms)
✔ Endpoint 7: Logout revokes session in DB and rejects future requests (175.845654ms)
✔ Endpoint 8: Existing email plus arbitrary long password fails with 401 (135.408649ms)
✔ Endpoint 9: One user’s password cannot authenticate another user (258.199583ms)
✔ Endpoint 10: Existing account without credentials (passwordHash: null) fails closed (77.558436ms)
✔ HTTP 1: Cookie issuance on valid login via HTTP POST /api/session (8572.258181ms)
✔ HTTP 2: Protected-route access with issued cookie via HTTP GET /api/progress (179.110691ms)
✔ HTTP 3: Cross-client isolation between User A and User B via real HTTP (288.715241ms)
✔ HTTP 4: Logout via HTTP DELETE /api/session revokes session and rejects future requests (77.257269ms)
✔ 1. Prisma connects to local XAMPP MySQL and core tables exist (358.379912ms)
✔ 2. Achievement catalogue data is populated (49.318987ms)
✔ 3. Unauthenticated sessions fail closed (0.947537ms)
✔ 4. Cross-client isolation: User B cannot view or modify User A records (180.134154ms)
✔ 5. Saving measurement, idempotency replay, and soft deletion (51.562457ms)
✔ rejects ownership injection, wrong units, invalid numbers and future observations (4.936393ms)
✔ normalizes equivalent timestamps for duplicate detection (9.521262ms)
✔ removal predicate always includes authenticated owner (1.340041ms)
✔ expired and revoked sessions fail closed (0.663879ms)
✔ mutation rejects cross-origin and missing-origin requests (13.499764ms)
✔ body limit is enforced without Content-Length (3.813641ms)
✔ strict bounded periods and pagination; all-time has no cutoff (1.021934ms)
✔ complete catalogue has unique IDs, eight groups and disabled award evaluation (0.253431ms)
✔ Slice 01 - T1: Client submits same assessment twice: idempotent submission & single queue delivery date (404.547022ms)
✔ Slice 01 - T2: Unauthenticated or wrong-role user cannot view or mutate coach records (12.663435ms)
✔ Slice 01 - T3: Wrong client ID cannot read another clients assessment or active programme (87.454251ms)
✔ Slice 01 - T4: Incomplete / unpaid / blocked client cannot see active coaching (76.690231ms)
✔ Slice 01 - T5: Save draft -> client still sees awaiting plan, not draft (42.814786ms)
✔ Slice 01 - T6: Publish v1 -> client sees exactly one Active training and one Active nutrition version (58.310169ms)
✔ Slice 01 - T7: Publish v2 -> v1 is Superseded and history still references v1 (69.357414ms)
✔ Slice 01 - T8: Concurrent double publish cannot create two Active versions (174.283546ms)
✔ Slice 01 - T9: Medical/safety hold is not bypassed and blocks plan publication without clearance (27.348838ms)
✔ Slice 01 - T10: All 3 publish checkpoint confirmation checks are strictly required (25.265526ms)
ℹ tests 48
ℹ suites 0
ℹ pass 48
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 12270.795193
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
