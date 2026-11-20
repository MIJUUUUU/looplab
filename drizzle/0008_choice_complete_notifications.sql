CREATE TRIGGER choice_complete_notifications AFTER INSERT ON mini_games
WHEN NEW.kind='choice' AND
 (SELECT count(*) FROM mini_games WHERE room_id=NEW.room_id AND day=NEW.day AND kind='choice') =
 (SELECT count(*) FROM members WHERE room_id=NEW.room_id)
BEGIN
 INSERT INTO notifications(id,room_id,recipient_id,actor_name,kind,body,target_id,created_at)
 SELECT lower(hex(randomblob(16))),NEW.room_id,user_id,'사이로','choice_complete',
 '모두 투표했어요. 친구들의 선택과 비율을 확인해 보세요.',NEW.day,CAST(strftime('%s','now') AS INTEGER)*1000
 FROM members WHERE room_id=NEW.room_id;
 INSERT OR IGNORE INTO game_rewards(id,user_id,kind,day)
 SELECT NEW.room_id||':'||NEW.day||':'||user_id,user_id,'choice',NEW.day FROM members WHERE room_id=NEW.room_id;
END;
