-- Migration: 202611140001_m02_integrity_remediation
-- Description: Add slotId column and composite unique index to ClientWorkoutSetLog, create MealAuditLog table, and enforce restrict on referenced ProgrammeDraft deletions.

-- 1. Alter Table ClientWorkoutSetLog: Add slotId
ALTER TABLE `ClientWorkoutSetLog` ADD COLUMN IF NOT EXISTS `slotId` VARCHAR(64) NOT NULL DEFAULT '';

-- 2. Backfill slotId on existing rows: slotId = targetExerciseId (if swapped) OR exerciseId (if normal)
UPDATE `ClientWorkoutSetLog` SET `slotId` = COALESCE(NULLIF(`targetExerciseId`, ''), `exerciseId`) WHERE `slotId` = '' OR `slotId` IS NULL;

-- 3. Add Unique Index on (sessionId, slotId, setIndex, isWarmup) to prevent duplicate sets
ALTER TABLE `ClientWorkoutSetLog` ADD UNIQUE INDEX `ClientWorkoutSetLog_sessionId_slotId_setIndex_isWarmup_key` (`sessionId`, `slotId`, `setIndex`, `isWarmup`);

-- 4. Create Table MealAuditLog for immutable meal state transition tracking
CREATE TABLE IF NOT EXISTS `MealAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `date` VARCHAR(10) NOT NULL,
    `mealType` ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK') NOT NULL,
    `action` VARCHAR(32) NOT NULL,
    `previousStatus` ENUM('NOT_RECORDED', 'PLANNED', 'CHANGED', 'SKIPPED') NULL,
    `newStatus` ENUM('NOT_RECORDED', 'PLANNED', 'CHANGED', 'SKIPPED') NOT NULL,
    `programmeVersion` VARCHAR(32) NULL,
    `payload` JSON NULL,
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MealAuditLog_userId_date_idx`(`userId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. Enforce ON DELETE RESTRICT on ProgrammeDraft relations
ALTER TABLE `ClientWorkoutSession` DROP FOREIGN KEY `ClientWorkoutSession_programmeDraftId_fkey`;
ALTER TABLE `ClientWorkoutSession` ADD CONSTRAINT `ClientWorkoutSession_programmeDraftId_fkey` FOREIGN KEY (`programmeDraftId`) REFERENCES `ProgrammeDraft`(`id`) ON DELETE RESTRICT;

ALTER TABLE `DailyMealLog` DROP FOREIGN KEY `DailyMealLog_programmeDraftId_fkey`;
ALTER TABLE `DailyMealLog` ADD CONSTRAINT `DailyMealLog_programmeDraftId_fkey` FOREIGN KEY (`programmeDraftId`) REFERENCES `ProgrammeDraft`(`id`) ON DELETE RESTRICT;
