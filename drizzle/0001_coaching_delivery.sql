CREATE TABLE `program_assignments` (
  `id` text PRIMARY KEY NOT NULL,
  `person_id` text NOT NULL,
  `title` text NOT NULL,
  `phase` text DEFAULT 'Taming the Flesh' NOT NULL,
  `days_per_week` integer DEFAULT 3 NOT NULL,
  `status` text DEFAULT 'draft' NOT NULL,
  `starts_on` text DEFAULT '' NOT NULL,
  `ends_on` text DEFAULT '' NOT NULL,
  `coach_instructions` text DEFAULT '' NOT NULL,
  `athlete_instructions` text DEFAULT '' NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX `assignments_person_idx` ON `program_assignments` (`person_id`);
CREATE TABLE `workout_sessions` (
  `id` text PRIMARY KEY NOT NULL,
  `person_id` text NOT NULL,
  `assignment_id` text DEFAULT '' NOT NULL,
  `workout_date` text NOT NULL,
  `workout_name` text NOT NULL,
  `completion_status` text DEFAULT 'planned' NOT NULL,
  `duration_minutes` integer DEFAULT 0 NOT NULL,
  `effort_rating` integer DEFAULT 0 NOT NULL,
  `athlete_note` text DEFAULT '' NOT NULL,
  `coach_feedback` text DEFAULT '' NOT NULL,
  `exercise_log` text DEFAULT '[]' NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX `workouts_person_date_idx` ON `workout_sessions` (`person_id`,`workout_date`);
CREATE TABLE `progress_entries` (
  `id` text PRIMARY KEY NOT NULL,
  `person_id` text NOT NULL,
  `recorded_on` text NOT NULL,
  `bodyweight` text DEFAULT '' NOT NULL,
  `waist` text DEFAULT '' NOT NULL,
  `chest` text DEFAULT '' NOT NULL,
  `hips` text DEFAULT '' NOT NULL,
  `note` text DEFAULT '' NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX `progress_person_date_idx` ON `progress_entries` (`person_id`,`recorded_on`);
CREATE TABLE `subscriptions` (
  `id` text PRIMARY KEY NOT NULL,
  `person_id` text NOT NULL,
  `plan_name` text DEFAULT 'Get Divine Coaching' NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `amount_minor` integer DEFAULT 0 NOT NULL,
  `currency` text DEFAULT 'NGN' NOT NULL,
  `renews_on` text DEFAULT '' NOT NULL,
  `provider_reference` text DEFAULT '' NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX `subscriptions_person_idx` ON `subscriptions` (`person_id`);
