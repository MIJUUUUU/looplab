ALTER TABLE `rooms` ADD `notice_editor` text;--> statement-breakpoint
ALTER TABLE `rooms` ADD `notice_updated_at` integer;--> statement-breakpoint
ALTER TABLE `rooms` ADD `notice_revision` integer DEFAULT 0 NOT NULL;