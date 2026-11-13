export type Member={id:string;user_id:string;name:string;hair:number;outfit:number;x:number;y:number;message:string;seen:number;coins:number;checked_day:string};
export type Room={id:string;name:string;code:string;capacity:number;owner_id:string;started_at:number|null;theme:string;furniture:string[];revision:number};
export type RoomEvent={id:string;title:string;date:string;time:string;note:string;participants:string[];author_id:string;version:number};
export type State={userId:string;room:Room|null;members?:Member[];events?:RoomEvent[];serverTime?:number;today?:string;reward?:number};
