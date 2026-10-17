CREATE TABLE `assessment_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`version` text DEFAULT '1.0.0' NOT NULL,
	`pos_number` integer NOT NULL,
	`pos_name` text NOT NULL,
	`pos_description` text,
	`indicators_json` text DEFAULT '[]' NOT NULL,
	`red_flags_json` text DEFAULT '[]' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `batches` (
	`id` text PRIMARY KEY NOT NULL,
	`batch_name` text NOT NULL,
	`batch_date` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`notes` text,
	`created_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `class_placements` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`batch_id` text NOT NULL,
	`assigned_class` text NOT NULL,
	`algorithm_version` text DEFAULT 'v1.0' NOT NULL,
	`balance_score` real,
	`manual_override` integer DEFAULT false NOT NULL,
	`override_by` text,
	`override_reason` text,
	`override_at` text,
	`assigned_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `evaluations` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`batch_id` text NOT NULL,
	`pos_number` integer NOT NULL,
	`evaluator_id` text NOT NULL,
	`config_id` text,
	`scores_json` text DEFAULT '{}' NOT NULL,
	`reading_level` text,
	`red_flags_json` text DEFAULT '{}' NOT NULL,
	`has_red_flag` integer DEFAULT false NOT NULL,
	`anecdotal_note` text,
	`total_score` real,
	`is_complete` integer DEFAULT false NOT NULL,
	`client_id` text,
	`synced_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `parent_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`batch_id` text NOT NULL,
	`responses_json` text DEFAULT '{}' NOT NULL,
	`submitted_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`registration_no` text NOT NULL,
	`full_name` text NOT NULL,
	`nickname` text NOT NULL,
	`birth_date` text NOT NULL,
	`gender` text NOT NULL,
	`parent_name` text,
	`phone` text,
	`batch_id` text,
	`avatar_seed` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `students_registration_no_unique` ON `students` (`registration_no`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`pin_hash` text,
	`pos_number` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
