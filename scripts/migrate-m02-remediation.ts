import { db } from '../src/server/db';

async function main() {
  const prisma = db();

  // 1. Unique index on ClientWorkoutSetLog
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE ClientWorkoutSetLog 
      ADD UNIQUE INDEX ClientWorkoutSetLog_sessionId_slotId_setIndex_isWarmup_key (sessionId, slotId, setIndex, isWarmup)
    `);
    console.log('Successfully added unique index on ClientWorkoutSetLog');
  } catch (e: any) {
    if (e.message?.includes('Duplicate key name')) {
      console.log('Unique index already exists on ClientWorkoutSetLog');
    } else {
      console.error('Error adding unique index:', e.message);
    }
  }

  // 2. Create MealAuditLog table
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS MealAuditLog (
        id VARCHAR(191) NOT NULL,
        userId VARCHAR(191) NOT NULL,
        date VARCHAR(10) NOT NULL,
        mealType ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK') NOT NULL,
        action VARCHAR(32) NOT NULL,
        previousStatus ENUM('NOT_RECORDED', 'PLANNED', 'CHANGED', 'SKIPPED') NULL,
        newStatus ENUM('NOT_RECORDED', 'PLANNED', 'CHANGED', 'SKIPPED') NOT NULL,
        programmeVersion VARCHAR(32) NULL,
        payload JSON NULL,
        recordedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX MealAuditLog_userId_date_idx(userId, date),
        PRIMARY KEY (id)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    console.log('Successfully created/verified MealAuditLog table');
  } catch (e: any) {
    console.error('Error creating MealAuditLog table:', e.message);
  }

  // 3. Update foreign key constraints to ON DELETE RESTRICT
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE ClientWorkoutSession DROP FOREIGN KEY ClientWorkoutSession_programmeDraftId_fkey;
    `);
  } catch {}
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE ClientWorkoutSession 
      ADD CONSTRAINT ClientWorkoutSession_programmeDraftId_fkey 
      FOREIGN KEY (programmeDraftId) REFERENCES ProgrammeDraft(id) ON DELETE RESTRICT;
    `);
    console.log('Updated ClientWorkoutSession FK to RESTRICT');
  } catch (e: any) {
    console.error('Error updating ClientWorkoutSession FK:', e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE DailyMealLog DROP FOREIGN KEY DailyMealLog_programmeDraftId_fkey;
    `);
  } catch {}
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE DailyMealLog 
      ADD CONSTRAINT DailyMealLog_programmeDraftId_fkey 
      FOREIGN KEY (programmeDraftId) REFERENCES ProgrammeDraft(id) ON DELETE RESTRICT;
    `);
    console.log('Updated DailyMealLog FK to RESTRICT');
  } catch (e: any) {
    console.error('Error updating DailyMealLog FK:', e.message);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
