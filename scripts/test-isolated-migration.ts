import mysql from 'mysql2/promise';

async function run() {
  const connectionUrl = process.env.DATABASE_URL || 'mysql://root@127.0.0.1:3306/ascend';
  const url = new URL(connectionUrl);
  
  const host = url.hostname || '127.0.0.1';
  const port = parseInt(url.port || '3306', 10);
  const user = url.username || 'root';
  const password = url.password || '';

  const conn = await mysql.createConnection({ host, port, user, password });

  console.log('--- 1. Setting up isolated database ascend_test_migration ---');
  await conn.query('DROP DATABASE IF EXISTS ascend_test_migration');
  await conn.query('CREATE DATABASE ascend_test_migration');
  await conn.query('USE ascend_test_migration');

  console.log('--- 2. Creating exact pre-remediation schema ---');
  await conn.query(`
    CREATE TABLE User (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      email VARCHAR(191) NOT NULL UNIQUE,
      role ENUM('CLIENT', 'COACH') NOT NULL DEFAULT 'CLIENT',
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  await conn.query(`
    CREATE TABLE ProgrammeDraft (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      clientUserId VARCHAR(191) NOT NULL,
      version VARCHAR(32) NOT NULL,
      isPublished BOOLEAN NOT NULL DEFAULT false,
      trainingJson JSON NOT NULL,
      nutritionJson JSON NOT NULL,
      publishedAt DATETIME(3) NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      FOREIGN KEY (clientUserId) REFERENCES User(id) ON DELETE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  await conn.query(`
    CREATE TABLE ClientWorkoutSession (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      userId VARCHAR(191) NOT NULL,
      workoutId VARCHAR(64) NOT NULL,
      workoutName VARCHAR(128) NOT NULL,
      programmeVersion VARCHAR(32) NULL,
      programmeDraftId VARCHAR(191) NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'IN_PROGRESS',
      startedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      completedAt DATETIME(3) NULL,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
      CONSTRAINT ClientWorkoutSession_programmeDraftId_fkey FOREIGN KEY (programmeDraftId) REFERENCES ProgrammeDraft(id) ON DELETE SET NULL
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  // Notice: pre-remediation ClientWorkoutSetLog does NOT have slotId, only targetExerciseId and isSwap
  await conn.query(`
    CREATE TABLE ClientWorkoutSetLog (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      sessionId VARCHAR(191) NOT NULL,
      exerciseId VARCHAR(64) NOT NULL,
      exerciseName VARCHAR(128) NOT NULL,
      targetExerciseId VARCHAR(64) NULL,
      isSwap BOOLEAN NOT NULL DEFAULT false,
      setIndex INT NOT NULL,
      isWarmup BOOLEAN NOT NULL DEFAULT false,
      weightKg DECIMAL(6, 2) NOT NULL,
      reps INT NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT true,
      loggedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      FOREIGN KEY (sessionId) REFERENCES ClientWorkoutSession(id) ON DELETE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  await conn.query(`
    CREATE TABLE DailyMealLog (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      userId VARCHAR(191) NOT NULL,
      date VARCHAR(10) NOT NULL,
      mealType ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK') NOT NULL,
      mealName VARCHAR(64) NOT NULL,
      programmeVersion VARCHAR(32) NULL,
      programmeDraftId VARCHAR(191) NULL,
      status ENUM('NOT_RECORDED', 'PLANNED', 'CHANGED', 'SKIPPED') NOT NULL DEFAULT 'NOT_RECORDED',
      customFoods JSON NULL,
      recordedAt DATETIME(3) NULL,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
      CONSTRAINT DailyMealLog_programmeDraftId_fkey FOREIGN KEY (programmeDraftId) REFERENCES ProgrammeDraft(id) ON DELETE SET NULL,
      UNIQUE KEY DailyMealLog_userId_date_mealType_key (userId, date, mealType)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  console.log('--- 3. Inserting representative pre-remediation client records ---');
  await conn.query(`INSERT INTO User (id, email, role) VALUES ('u1', 'client_pre@test.internal', 'CLIENT')`);
  await conn.query(`INSERT INTO ProgrammeDraft (id, clientUserId, version, isPublished, trainingJson, nutritionJson, publishedAt) VALUES ('prog1', 'u1', 'Active v1', true, '[]', '[]', NOW())`);
  await conn.query(`INSERT INTO ClientWorkoutSession (id, userId, workoutId, workoutName, programmeVersion, programmeDraftId, status) VALUES ('sess1', 'u1', 'a', 'Full Body A', 'Active v1', 'prog1', 'IN_PROGRESS')`);

  // Insert pre-remediation set rows
  // Set 1: normal leg press
  await conn.query(`INSERT INTO ClientWorkoutSetLog (id, sessionId, exerciseId, exerciseName, targetExerciseId, isSwap, setIndex, isWarmup, weightKg, reps) VALUES ('set1', 'sess1', 'leg', 'Leg Press', NULL, false, 0, false, 80.0, 10)`);
  // Set 2: swapped goblet squat for target leg press
  await conn.query(`INSERT INTO ClientWorkoutSetLog (id, sessionId, exerciseId, exerciseName, targetExerciseId, isSwap, setIndex, isWarmup, weightKg, reps) VALUES ('set2', 'sess1', 'goblet', 'Goblet Squat', 'leg', true, 1, false, 24.0, 12)`);
  // Set 3: warmup bench press
  await conn.query(`INSERT INTO ClientWorkoutSetLog (id, sessionId, exerciseId, exerciseName, targetExerciseId, isSwap, setIndex, isWarmup, weightKg, reps) VALUES ('set3', 'sess1', 'bench', 'Bench Press', NULL, false, 0, true, 10.0, 12)`);
  // Set 4: working bench press
  await conn.query(`INSERT INTO ClientWorkoutSetLog (id, sessionId, exerciseId, exerciseName, targetExerciseId, isSwap, setIndex, isWarmup, weightKg, reps) VALUES ('set4', 'sess1', 'bench', 'Bench Press', NULL, false, 0, false, 20.0, 10)`);

  // Insert pre-remediation meal rows
  await conn.query(`INSERT INTO DailyMealLog (id, userId, date, mealType, mealName, programmeVersion, programmeDraftId, status) VALUES ('meal1', 'u1', '2026-11-10', 'BREAKFAST', 'Oats', 'Active v1', 'prog1', 'PLANNED')`);
  await conn.query(`INSERT INTO DailyMealLog (id, userId, date, mealType, mealName, programmeVersion, programmeDraftId, status) VALUES ('meal2', 'u1', '2026-11-10', 'LUNCH', 'Rice', 'Active v1', 'prog1', 'CHANGED')`);

  console.log('Pre-remediation data inserted. Total sets:', 4, 'Total meals:', 2);

  console.log('--- 4. Executing Migration SQL (202611140001_m02_integrity_remediation) ---');
  // 1. Add slotId column
  await conn.query(`ALTER TABLE ClientWorkoutSetLog ADD COLUMN slotId VARCHAR(64) NOT NULL DEFAULT ''`);
  // 2. Backfill slotId
  await conn.query(`UPDATE ClientWorkoutSetLog SET slotId = COALESCE(NULLIF(targetExerciseId, ''), exerciseId) WHERE slotId = '' OR slotId IS NULL`);
  // 3. Unique index
  await conn.query(`ALTER TABLE ClientWorkoutSetLog ADD UNIQUE INDEX ClientWorkoutSetLog_sessionId_slotId_setIndex_isWarmup_key (sessionId, slotId, setIndex, isWarmup)`);
  // 4. Create MealAuditLog
  await conn.query(`
    CREATE TABLE IF NOT EXISTS MealAuditLog (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      userId VARCHAR(191) NOT NULL,
      date VARCHAR(10) NOT NULL,
      mealType ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK') NOT NULL,
      action VARCHAR(32) NOT NULL,
      previousStatus ENUM('NOT_RECORDED', 'PLANNED', 'CHANGED', 'SKIPPED') NULL,
      newStatus ENUM('NOT_RECORDED', 'PLANNED', 'CHANGED', 'SKIPPED') NOT NULL,
      programmeVersion VARCHAR(32) NULL,
      payload JSON NULL,
      recordedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      INDEX MealAuditLog_userId_date_idx(userId, date)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);
  // 5. Foreign keys restrict
  await conn.query(`ALTER TABLE ClientWorkoutSession DROP FOREIGN KEY ClientWorkoutSession_programmeDraftId_fkey`);
  await conn.query(`ALTER TABLE ClientWorkoutSession ADD CONSTRAINT ClientWorkoutSession_programmeDraftId_fkey FOREIGN KEY (programmeDraftId) REFERENCES ProgrammeDraft(id) ON DELETE RESTRICT`);
  await conn.query(`ALTER TABLE DailyMealLog DROP FOREIGN KEY DailyMealLog_programmeDraftId_fkey`);
  await conn.query(`ALTER TABLE DailyMealLog ADD CONSTRAINT DailyMealLog_programmeDraftId_fkey FOREIGN KEY (programmeDraftId) REFERENCES ProgrammeDraft(id) ON DELETE RESTRICT`);

  console.log('--- 5. Verifying Post-Migration Invariants ---');
  const [sets]: [any[], any] = await conn.query(`SELECT id, exerciseId, targetExerciseId, slotId, isSwap, setIndex, isWarmup FROM ClientWorkoutSetLog ORDER BY id ASC`);
  console.log('Migrated set records:');
  for (const s of sets) {
    console.log(`  Set ID ${s.id}: exerciseId=${s.exerciseId}, targetExerciseId=${s.targetExerciseId}, slotId=${s.slotId}, isSwap=${Boolean(s.isSwap)}, setIndex=${s.setIndex}, isWarmup=${Boolean(s.isWarmup)}`);
  }

  // Verifications
  const normalSet = sets.find(s => s.id === 'set1');
  if (normalSet.slotId !== 'leg') throw new Error(`Normal set slotId mismatch: expected 'leg', got '${normalSet.slotId}'`);

  const swappedSet = sets.find(s => s.id === 'set2');
  if (swappedSet.slotId !== 'leg') throw new Error(`Swapped set slotId mismatch: expected 'leg', got '${swappedSet.slotId}'`);

  const warmupSet = sets.find(s => s.id === 'set3');
  const workingSet = sets.find(s => s.id === 'set4');
  if (warmupSet.slotId !== 'bench' || workingSet.slotId !== 'bench') throw new Error('Bench sets slotId mismatch');

  console.log('✓ Every existing set received the exact correct slotId!');

  // Verify duplicate prevention via unique constraint
  console.log('--- 6. Verifying Unique Constraint Prevents Duplicate Set Rows ---');
  let dupPrevented = false;
  try {
    // Attempt inserting duplicate set for same session, slotId='leg', setIndex=0, isWarmup=false
    await conn.query(`INSERT INTO ClientWorkoutSetLog (id, sessionId, exerciseId, exerciseName, targetExerciseId, slotId, isSwap, setIndex, isWarmup, weightKg, reps) VALUES ('set_dup', 'sess1', 'leg', 'Leg Press', NULL, 'leg', false, 0, false, 80.0, 10)`);
  } catch (err: any) {
    dupPrevented = true;
    console.log('✓ Unique constraint successfully rejected duplicate set insert:', err.message);
  }
  if (!dupPrevented) throw new Error('Unique constraint failed to reject duplicate set!');

  // Verify ON DELETE RESTRICT on ProgrammeDraft
  console.log('--- 7. Verifying ON DELETE RESTRICT on ProgrammeDraft ---');
  let restrictEnforced = false;
  try {
    await conn.query(`DELETE FROM ProgrammeDraft WHERE id = 'prog1'`);
  } catch (err: any) {
    restrictEnforced = true;
    console.log('✓ Foreign key restrict successfully prevented deletion of referenced programme:', err.message);
  }
  if (!restrictEnforced) throw new Error('RESTRICT failed to prevent deletion of referenced ProgrammeDraft!');

  // Clean up test database
  console.log('--- 8. Cleanup test database ---');
  await conn.query('DROP DATABASE IF EXISTS ascend_test_migration');
  await conn.end();

  console.log('=== ISOLATED MIGRATION VERIFICATION COMPLETE: ALL CHECKS PASSED ===');
}

run().catch((err) => {
  console.error('Migration verification failed:', err);
  process.exit(1);
});
