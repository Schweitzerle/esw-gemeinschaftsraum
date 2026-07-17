ALTER TABLE `bookings` DROP COLUMN `room`;--> statement-breakpoint
ALTER TABLE `bookings` ADD `open_end` integer DEFAULT false NOT NULL;