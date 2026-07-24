CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`type` text NOT NULL,
	`summary` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `check_ins` (
	`id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`week_of` text NOT NULL,
	`workouts_completed` integer DEFAULT 0 NOT NULL,
	`workouts_planned` integer DEFAULT 0 NOT NULL,
	`average_bodyweight` text DEFAULT '' NOT NULL,
	`protein_days` integer DEFAULT 0 NOT NULL,
	`average_sleep` text DEFAULT '' NOT NULL,
	`recovery` text DEFAULT 'Normal' NOT NULL,
	`pain_soreness` text DEFAULT '' NOT NULL,
	`coach_response` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `people` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text DEFAULT 'lead' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`whatsapp` text DEFAULT '' NOT NULL,
	`city_country` text DEFAULT '' NOT NULL,
	`age` text DEFAULT '' NOT NULL,
	`height` text DEFAULT '' NOT NULL,
	`bodyweight` text DEFAULT '' NOT NULL,
	`primary_goal` text DEFAULT '' NOT NULL,
	`goal_detail` text DEFAULT '' NOT NULL,
	`goal_urgency` integer DEFAULT 5 NOT NULL,
	`training_age` text DEFAULT '' NOT NULL,
	`preferred_frequency` text DEFAULT '' NOT NULL,
	`session_length` text DEFAULT '' NOT NULL,
	`access_type` text DEFAULT '' NOT NULL,
	`days_available` text DEFAULT '[]' NOT NULL,
	`equipment` text DEFAULT '[]' NOT NULL,
	`pain_context` text DEFAULT '' NOT NULL,
	`consistency_barrier` text DEFAULT '' NOT NULL,
	`tracking_readiness` text DEFAULT '[]' NOT NULL,
	`phase` text DEFAULT 'Unassigned' NOT NULL,
	`training_level` text DEFAULT 'To assess' NOT NULL,
	`next_check_in` text DEFAULT '' NOT NULL,
	`coach_note` text DEFAULT '' NOT NULL,
	`application_data` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
