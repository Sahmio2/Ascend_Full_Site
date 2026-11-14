# ASCEND Milestone 02 — Implementation Document: Versioned Workout and Nutrition Logging

**Milestone**: 02 — Versioned Workout & Nutrition Logging  
**Branch**: `feature/slice-01-coach-approval`  
**Latest Commit**: `0f2d1345458ffec074052fa92c39c89c9bfa2a51`  
**Date**: November 14, 2026  
**Status**: Completed & Verified (All 62 Tests Passing)  

---

## 1. Executive Summary & Objectives

Milestone 02 connects the client's day-to-day training and nutrition reality to ASCEND's persistent backend and Sahmi's Coach Studio:
1. **Workouts Focus & Session Modes**: Fully integrated Full Body A/B/C workout execution, supporting horizontal swipe mode switching, separate warmups, automatic rest timer with countdown persistence, previous-session performance reference, and Sahmi-approved temporary swaps.
2. **Today's Meals Nutrition Tracking**: Grams-only Nigerian food tracking with explicit preparation states across Simple, Structured, and Precision modes, supporting *Ate as Planned*, *Changed*, *Didn't Eat*, and explicit *Not Recorded* states without fabricated calories.
3. **Database Version Integrity**: Every workout session, set log, and meal record permanently links to the approved `ProgrammeDraft` version under which it was logged.
4. **Coach Studio Inspection**: Sahmi can inspect real workout executions, partial completions, weights, reps, temporary exercise substitutions, and meal adherence without automated penalties or silent programme alterations.

---

## 2. File Inventory

### A. New API Endpoints & Tests
| File Path | Description |
|---|---|
| `src/app/api/client/workouts/route.ts` | Guarded by client session. `GET` fetches active Full Body A/B/C exercises, in-progress session, previous set performance, and active programme version. `POST` handles `start_or_resume`, `log_set` (working sets and warmups), and `complete_session` (COMPLETED or PARTIAL). |
| `src/app/api/client/meals/route.ts` | Guarded by client session. `GET` fetches daily meal logs for a date and planned meals from active programme. `POST` upserts meal logs (`PLANNED`, `CHANGED`, `SKIPPED`) with active `programmeVersion` and `programmeDraftId`, or cleanly removes records when reset to `NOT_RECORDED`. |
| `src/app/api/coach/clients/[id]/activity/route.ts` | Guarded by `requireCoach`. Returns client's full workout sessions (sets, weights, reps, temporary swaps) and daily meal logs with linked programme versions. |
| `tests/milestone02-logging.test.ts` | 12 automated integration tests verifying M2-T1 through M2-T12. |

### B. Modified Files
| File Path | Modifications |
|---|---|
| `prisma/schema.prisma` | Added `programmeVersion` and `programmeDraftId` to `ClientWorkoutSession` and `DailyMealLog`. Added `targetExerciseId` and `isSwap` to `ClientWorkoutSetLog`. Added relations to `ProgrammeDraft`. |
| `src/features/ascend/portal/pages/WorkoutsFocusPage.tsx` | Connected real session hydration, `start_or_resume` API, working/warmup set persistence, completion handler, and rest timer `localStorage` recovery. |
| `src/features/ascend/portal/pages/NutritionMealsPage.tsx` | Added 3-mode switcher (`simple`, `structured`, `precision`). Added real hydration from `/api/client/meals`, `recordPlanned`, `recordSkipped`, and `undoRecord` (resets to `NOT_RECORDED`). |
| `src/features/ascend/coach/CoachStudio.tsx` | Integrated `clientActivity` state. Renders real logged workout sessions (with swap indicators) and meal logs in client drawer and displays real signals in Scheduled Reviews view. |
| `src/features/ascend/portal/data/clientPortalAdapter.ts` | Updated `addFood` and `saveWorkout` to safely update live snapshots and notify listeners without throwing runtime errors when `liveBridge` is uninitialized. |
| `src/app/api/assessment/route.ts` | Enhanced safety flag audit across `BS-02` through `BS-07`, recording detailed reasons in `safetyFlags.reasons` and locking safety holds. |
| `src/features/ascend/public-apply/assessment/NineStageAssessment.tsx` | Synchronized comprehensive safety flag checks across all health intake questions. |

---

## 3. Database Schema Migration Results

The schema update was applied cleanly to MySQL using `prisma db push` (0 data loss, 0 resets, execution time 418ms):

```prisma
model ClientWorkoutSession {
  id               String                @id @default(cuid())
  userId           String
  user             User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  workoutId        String                @db.VarChar(64)
  workoutName      String                @db.VarChar(128)
  programmeVersion String?               @db.VarChar(32)
  programmeDraftId String?
  programmeDraft   ProgrammeDraft?       @relation("ProgrammeWorkoutSessions", fields: [programmeDraftId], references: [id], onDelete: SetNull)
  startedAt        DateTime              @default(now())
  completedAt      DateTime?
  status           String                @default("IN_PROGRESS") @db.VarChar(32)
  notes            String?               @db.Text
  setLogs          ClientWorkoutSetLog[]

  @@index([userId, startedAt])
  @@index([programmeDraftId])
}

model ClientWorkoutSetLog {
  id               String               @id @default(cuid())
  sessionId        String
  session          ClientWorkoutSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  exerciseId       String               @db.VarChar(64)
  exerciseName     String               @db.VarChar(128)
  targetExerciseId String?              @db.VarChar(64)
  isSwap           Boolean              @default(false)
  setIndex         Int
  isWarmup         Boolean              @default(false)
  weightKg         Decimal              @db.Decimal(6, 2)
  reps             Int
  completed        Boolean              @default(true)
  loggedAt         DateTime             @default(now())

  @@index([sessionId, exerciseId])
}

model DailyMealLog {
  id               String          @id @default(cuid())
  userId           String
  user             User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  date             String          @db.VarChar(10)
  mealType         MealType
  mealName         String          @db.VarChar(64)
  programmeVersion String?         @db.VarChar(32)
  programmeDraftId String?
  programmeDraft   ProgrammeDraft? @relation("ProgrammeMealLogs", fields: [programmeDraftId], references: [id], onDelete: SetNull)
  status           MealStatus      @default(NOT_RECORDED)
  customFoods      Json?
  notes            String?         @db.Text
  recordedAt       DateTime?
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  @@unique([userId, date, mealType])
  @@index([userId, date])
  @@index([programmeDraftId])
}
```

---

## 4. Verification & Invariant Proofs

1. **Focus/Session Shared State**: Sets logged in Focus Mode appear in Session Mode and vice versa because both render from a shared `rows` and `warm` state synchronized with `/api/client/workouts`.
2. **Rest Timer Resilience**: Rest timer end timestamp is stored in `localStorage` under key `ascend_rest_timer`. On page refresh or resumption, the remaining duration is recalculated from `Date.now()`.
3. **Idempotent Set Logging**: Updating working weight or reps for set $i$ updates the existing set log row via Prisma `update`, preventing row duplication.
4. **Draft Plan Isolation**: Client logging endpoints strictly stamp records with the client's currently active `ProgrammeDraft` (`isPublished: true`). Unpublished drafts authored by Sahmi are never linked or leaked.
5. **Historical Retention**: When Sahmi publishes `Active v2`, past workout sessions and meal logs continue pointing to `Active v1`.
6. **Not Recorded vs Skipped Semantics**: Setting a meal to `NOT_RECORDED` deletes the row in `DailyMealLog`, leaving it unrecorded (unknown). Setting it to `SKIPPED` saves an explicit record with `status: 'SKIPPED'` (Didn't Eat).
