CREATE TRIGGER room_capacity_guard BEFORE INSERT ON members
WHEN (SELECT count(*) FROM members WHERE room_id=NEW.room_id) >= (SELECT capacity FROM rooms WHERE id=NEW.room_id)
BEGIN SELECT RAISE(ABORT, 'room_full'); END;
--> statement-breakpoint
CREATE TRIGGER room_start_latch AFTER INSERT ON members
WHEN (SELECT count(*) FROM members WHERE room_id=NEW.room_id) = (SELECT capacity FROM rooms WHERE id=NEW.room_id)
BEGIN UPDATE rooms SET started_at=CAST(strftime('%s','now') AS INTEGER)*1000 WHERE id=NEW.room_id AND started_at IS NULL; END;
