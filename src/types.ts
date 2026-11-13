export type RoomNotification={id:string;actor_name:string;kind:'message'|'event_created'|'photo';body:string;target_id:string;event_date:string|null;created_at:number;read_at:number|null};
export type Member={photo_version?:string|null;id:string;user_id:string;name:string;hair:number;outfit:number;x:number;y:number;message:string;seen:number;coins:number;checked_day:string};
export type Room={notice_editor:string|null;notice_updated_at:number|null;notice_revision:number;notice:string;id:string;name:string;code:string;capacity:number;owner_id:string;started_at:number|null;theme:string;furniture:string[];revision:number};
export type RoomEvent={id:string;title:string;date:string;time:string;note:string;participants:string[];author_id:string;version:number};
export type State={notifications?:RoomNotification[];unreadCount?:number;userId:string;room:Room|null;members?:Member[];events?:RoomEvent[];serverTime?:number;today?:string;reward?:number};
