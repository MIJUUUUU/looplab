CREATE TABLE `member_photos` (
	`user_id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`data` text NOT NULL,
	`version` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `member_photos_room_idx` ON `member_photos` (`room_id`);
--> statement-breakpoint
CREATE TRIGGER photo_insert_notifications AFTER INSERT ON member_photos
BEGIN
 INSERT INTO notifications(id,room_id,recipient_id,actor_name,kind,body,target_id,event_date,created_at)
 SELECT lower(hex(randomblob(16))),NEW.room_id,user_id,
 (SELECT name FROM members WHERE user_id=NEW.user_id AND room_id=NEW.room_id),
 'photo','',NEW.user_id,NULL,NEW.updated_at
 FROM members WHERE room_id=NEW.room_id AND user_id<>NEW.user_id;
END;

--> statement-breakpoint
CREATE TRIGGER photo_update_notifications AFTER UPDATE ON member_photos
BEGIN
 INSERT INTO notifications(id,room_id,recipient_id,actor_name,kind,body,target_id,event_date,created_at)
 SELECT lower(hex(randomblob(16))),NEW.room_id,user_id,
 (SELECT name FROM members WHERE user_id=NEW.user_id AND room_id=NEW.room_id),
 'photo','',NEW.user_id,NULL,NEW.updated_at
 FROM members WHERE room_id=NEW.room_id AND user_id<>NEW.user_id;
END;
