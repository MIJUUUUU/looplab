CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`recipient_id` text NOT NULL,
	`actor_name` text NOT NULL,
	`kind` text NOT NULL,
	`body` text NOT NULL,
	`target_id` text NOT NULL,
	`event_date` text,
	`created_at` integer NOT NULL,
	`read_at` integer,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_recipient_idx` ON `notifications` (`recipient_id`,`created_at`);
--> statement-breakpoint
CREATE TRIGGER message_notifications AFTER UPDATE OF message ON members
WHEN OLD.message <> NEW.message
BEGIN
 INSERT INTO notifications(id,room_id,recipient_id,actor_name,kind,body,target_id,event_date,created_at)
 SELECT lower(hex(randomblob(16))),NEW.room_id,user_id,NEW.name,'message',NEW.message,NEW.user_id,NULL,CAST(strftime('%s','now') AS INTEGER)*1000
 FROM members WHERE room_id=NEW.room_id AND user_id<>NEW.user_id;
END;
--> statement-breakpoint
CREATE TRIGGER event_created_notifications AFTER INSERT ON events
BEGIN
 INSERT INTO notifications(id,room_id,recipient_id,actor_name,kind,body,target_id,event_date,created_at)
 SELECT lower(hex(randomblob(16))),NEW.room_id,user_id,
 (SELECT name FROM members WHERE user_id=NEW.author_id AND room_id=NEW.room_id),
 'event_created',NEW.title,NEW.id,NEW.date,CAST(strftime('%s','now') AS INTEGER)*1000
 FROM members WHERE room_id=NEW.room_id AND user_id<>NEW.author_id;
END;
