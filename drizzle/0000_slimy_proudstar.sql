CREATE TABLE `bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`name` text NOT NULL,
	`room` text NOT NULL,
	`contact` text NOT NULL,
	`is_public` integer DEFAULT false NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`edit_token_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_bookings_starts_at` ON `bookings` (`starts_at`);--> statement-breakpoint
CREATE INDEX `idx_bookings_ends_at` ON `bookings` (`ends_at`);