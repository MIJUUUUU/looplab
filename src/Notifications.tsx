import React from 'react';
import {Pressable,Text,View} from 'react-native';
import type {RoomNotification} from './types';
import {C,s} from './theme';

export function notificationTitle(item:RoomNotification){
 return `${item.actor_name}님이 ${item.kind==='event_created'?'일정을 등록했어요':item.kind==='photo'?'사진을 남겼어요':item.body?'한마디를 남겼어요':'한마디를 지웠어요'}`;
}
export function Notifications({items,busy,onSelect}:{items:RoomNotification[];busy:boolean;onSelect:(item:RoomNotification)=>void}){
 return <>
  {!items.length&&<Text style={[s.muted,{textAlign:'center',paddingVertical:32}]}>아직 받은 알림이 없어요</Text>}
  {items.map(item=><Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.read_at?'읽음':'새 알림'}, ${notificationTitle(item)}, ${item.body}`} disabled={busy} onPress={()=>onSelect(item)} style={[s.card,{marginTop:10,backgroundColor:item.read_at?'#FFFFFF':'#F3F5F4',borderColor:'#EBEEEC'}]}>
   <View style={[s.row,{alignItems:'flex-start',gap:8}]}>
    {!item.read_at&&<View style={{width:6,height:6,borderRadius:3,backgroundColor:'#7C8F65',marginTop:6}}/>}
    <View style={{flex:1}}>
     <Text style={{fontSize:14,lineHeight:21,color:C.ink,fontWeight:item.read_at?'400':'600'}}>{notificationTitle(item)}</Text>
     {!!item.body&&<Text style={[s.muted,{marginTop:7,color:'#62686D'}]}>{item.body}</Text>}
     {item.event_date&&<Text style={[s.tiny,{marginTop:7}]}>일정 날짜 · {item.event_date}</Text>}
     <Text style={[s.tiny,{marginTop:10}]}>{new Date(item.created_at).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</Text>
    </View>
   </View>
  </Pressable>)}
 </>;
}
