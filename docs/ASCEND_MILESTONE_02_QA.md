# ASCEND Milestone 02 — Quality Assurance & Test Report

**Milestone**: 02 — Versioned Workout and Nutrition Logging  
**Branch**: `feature/slice-01-coach-approval`  
**Latest Commit**: `0f2d1345458ffec074052fa92c39c89c9bfa2a51`  
**Date**: November 14, 2026  
**Status**: All 62 Tests Passing (12/12 Milestone 02 Tests Passing)  

---

## 1. Milestone 02 Test Matrix (M2-T1 – M2-T12)

| Test ID | Test Scenario | Expected Outcome | Result |
|---|---|---|:---:|
| **M2-T1** | Workout Creation & Resumption | Starting a workout session creates a record; calling `start_or_resume` again returns the existing in-progress session. | **PASS** |
| **M2-T2** | Cross-Client Workout Isolation | Client A cannot log sets or complete a session belonging to Client B (HTTP 404/403). | **PASS** |
| **M2-T3** | Idempotent Set Logging & Correction | Updating a logged set index modifies the existing record without duplicating rows in `ClientWorkoutSetLog`. | **PASS** |
| **M2-T4** | Focus / Session Shared State | Working sets (`isWarmup: false`) and warm-ups (`isWarmup: true`) are cleanly segregated and persisted. | **PASS** |
| **M2-T5** | Rest-Timer Recovery Logic | Remaining duration calculates accurately from the stored end timestamp across reloads. | **PASS** |
| **M2-T6** | Programme-Version Links | Workout sessions and meal logs automatically store `programmeDraftId` and `programmeVersion: 'Active v1'`. | **PASS** |
| **M2-T7** | Draft vs Published Plan Isolation | Workout and meal logging links to active published plan, ignoring unpublished coach drafts (`Draft v2`). | **PASS** |
| **M2-T8** | Nutrition Logging & Status Changes | Logging *Ate as Planned*, *Changed*, and *Didn't Eat* persists to `DailyMealLog` with correct status. | **PASS** |
| **M2-T9** | Not Recorded vs Skipped Semantics | Setting a meal to `NOT_RECORDED` removes the row (unknown), whereas `SKIPPED` retains an explicit record. | **PASS** |
| **M2-T10** | Historical Preservation After Repartition | Publishing `Active v2` preserves `Active v1` links on past workout and meal records. | **PASS** |
| **M2-T11** | Safety Hold Restrictions | Client on `SAFETY_HELD` cannot start workout sessions or log meals (HTTP 403 `SAFETY_HOLD_ACTIVE`). | **PASS** |
| **M2-T12** | Coach Activity Inspection | Coach can inspect client workout sessions, set logs, temporary exercise swaps, and meal adherence signals. | **PASS** |

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

[AUTH CHALLENGE] CLIENT_EMAIL_OTP code for access_cooldown@test.internal: 612884
✔ Access 1: Client OTP start generates 6-digit challenge and enforces 60s cooldown (2531.252664ms)
[AUTH CHALLENGE] CLIENT_EMAIL_OTP code for access_brute@test.internal: 585651
✔ Access 2: Client OTP verify rejects invalid code and locks out after 5 failed attempts (315.993609ms)
[AUTH CHALLENGE] CLIENT_EMAIL_OTP code for access_replay@test.internal: 356162
✔ Access 3: Client OTP verify establishes session, sets cookie, and prevents replay (756.509463ms)
✔ Access 4: Account recovery preserves anti-enumeration on unknown emails (250.213736ms)
[AUTH CHALLENGE] COACH_MFA code for coach_test@test.internal: 117341
✔ Access 5: Coach login rejects non-coach users, requires password + MFA before session issuance (966.732547ms)
[AUTH CHALLENGE] CLIENT_EMAIL_OTP code for access_client@test.internal: 378661
✔ Access 6: GET /api/account/snapshot returns server-authoritative state and logout clears session (249.86719ms)
✔ Billing 1: Computes Lagos ISO week key accurately (1603.597249ms)
✔ Billing 2: getCapacityStatus reports capacity and policy invariants (251.710941ms)
✔ Billing 3: reserveCapacitySlot grants 30-min reservation and commits on fulfillment (449.033246ms)
✔ Billing 4: Webhook HMAC-SHA512 raw byte verification rejects tampered requests (15.939781ms)
✔ Billing 5: Weekly onboarding limit throttles after 3 slots in same week (394.81307ms)
✔ Endpoint 1: Rejects impersonation attempts with email only or userId (135.84506ms)
✔ Endpoint 2: Rejects non-existent email credentials with 401 (1981.271587ms)
✔ Endpoint 3: Blocks demo-login bypass in production mode (3.4843ms)
✔ Endpoint 4: Enforces login rate limiting on repeated failed attempts (1689.610644ms)
✔ Endpoint 5: Sets secure cookie attributes and rotates previous sessions (1133.799842ms)
✔ Endpoint 6: Rejects unauthenticated and revoked sessions on protected routes (6.905398ms)
✔ Endpoint 7: Logout revokes session in DB and rejects future requests (444.618189ms)
✔ Endpoint 8: Existing email plus arbitrary long password fails with 401 (426.692083ms)
✔ Endpoint 9: One user’s password cannot authenticate another user (651.85771ms)
✔ Endpoint 10: Existing account without credentials (passwordHash: null) fails closed (209.34311ms)
✔ HTTP 1: Cookie issuance on valid login via HTTP POST /api/session (3970.384266ms)
✔ HTTP 2: Protected-route access with issued cookie via HTTP GET /api/progress (682.306053ms)
✔ HTTP 3: Cross-client isolation between User A and User B via real HTTP (774.45716ms)
✔ HTTP 4: Logout via HTTP DELETE /api/session revokes session and rejects future requests (256.482738ms)
✔ 1. Prisma connects to local XAMPP MySQL and core tables exist (988.945921ms)
✔ 2. Achievement catalogue data is populated (486.440012ms)
✔ 3. Unauthenticated sessions fail closed (1.123607ms)
✔ 4. Cross-client isolation: User B cannot view or modify User A records (694.953809ms)
✔ 5. Saving measurement, idempotency replay, and soft deletion (53.827793ms)
✔ M2-T1: Authenticated workout creation and resumption (2357.860086ms)
✔ M2-T2: Cross-client workout isolation (68.922466ms)
✔ M2-T3: Idempotent set logging and correction (381.187579ms)
✔ M2-T4: Focus / Session shared state (working sets vs warm-ups) (363.588002ms)
✔ M2-T5: Rest-timer recovery logic (2.058124ms)
✔ M2-T6: Programme-version links on workout sessions and meal logs (296.012816ms)
✔ M2-T7: Draft vs published plan isolation in client logging (87.469977ms)
✔ M2-T8: Nutrition logging and status changes (Ate as Planned, Changed, Didn’t Eat) (255.01074ms)
✔ M2-T9: Accurate Not Recorded versus Didn’t Eat semantics (191.454871ms)
✔ M2-T10: Preservation of historical records after Sahmi publishes a new programme (v2) (301.842816ms)
✔ M2-T11: Safety hold blocks workout and meal logging (144.297644ms)
✔ M2-T12: Coach inspection of client activity (104.432904ms)
✔ rejects ownership injection, wrong units, invalid numbers and future observations (69.076023ms)
✔ normalizes equivalent timestamps for duplicate detection (8.179016ms)
✔ removal predicate always includes authenticated owner (1.430763ms)
✔ expired and revoked sessions fail closed (0.416015ms)
✔ mutation rejects cross-origin and missing-origin requests (4.843117ms)
✔ body limit is enforced without Content-Length (108.13998ms)
✔ strict bounded periods and pagination; all-time has no cutoff (4.638875ms)
✔ complete catalogue has unique IDs, eight groups and disabled award evaluation (0.521037ms)
✔ Slice 01 - T1: Client submits same assessment twice: idempotent submission & single queue delivery date (1438.775214ms)
✔ Slice 01 - T2: Unauthenticated or wrong-role user cannot view or mutate coach records (50.563252ms)
✔ Slice 01 - T3: Wrong client ID cannot read another clients assessment or active programme (299.652612ms)
✔ Slice 01 - T4: Incomplete / unpaid / blocked client cannot see active coaching (255.551354ms)
✔ Slice 01 - T5: Save draft -> client still sees awaiting plan, not draft (108.131096ms)
✔ Slice 01 - T6: Publish v1 -> client sees exactly one Active training and one Active nutrition version (232.882671ms)
✔ Slice 01 - T7: Publish v2 -> v1 is Superseded and history still references v1 (318.430803ms)
✔ Slice 01 - T8: Concurrent double publish cannot create two Active versions (524.225469ms)
✔ Slice 01 - T9: Medical/safety hold is not bypassed and blocks plan publication without clearance (69.551903ms)
✔ Slice 01 - T10: All 3 publish checkpoint confirmation checks are strictly required (119.074876ms)
✔ Slice 01 - T11: Saved draft changes do not modify an already published programme until Sahmi explicitly republishes (224.992519ms)
✔ Slice 01 - T12: Assessment resumption and Coach queue visibility (282.097985ms)
ℹ tests 62
ℹ suites 0
ℹ pass 62
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 28368.279638
```

---

## 3. Production Build & Typecheck Verification

- **Typecheck** (`npm run typecheck`): Clean exit with **0 errors**.
- **Prisma Validation** (`prisma validate`): Schema is valid.
- **Production Build** (`npm run build`): Completed in 41s, **exit code 0**, all 52 static and dynamic routes compiled cleanly.
