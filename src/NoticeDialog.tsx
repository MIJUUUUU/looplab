import React from 'react';
import {KeyboardAvoidingView,Modal,Platform,Pressable,ScrollView,Text,TextInput,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {C,s} from './theme';

type Props={visible:boolean;editing:boolean;title:string;value:string;onEdit:()=>void;onTitleChange:(title:string)=>void;editor?:string|null;updatedAt?:number|null;busy:boolean;onChange:(value:string)=>void;onClose:()=>void;onSave:()=>void};
export function NoticeDialog({visible,editing,title,value,onEdit,onTitleChange,editor,updatedAt,busy,onChange,onClose,onSave}:Props){
 return <Modal visible={visible} transparent animationType="fade" onRequestClose={()=>!busy&&onClose()}>
  <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
   <Pressable accessibilityRole="button" accessibilityLabel="공지사항 팝업 닫기" disabled={busy} onPress={onClose} style={{position:'absolute',top:0,bottom:0,left:0,right:0,backgroundColor:'rgba(0,0,0,0.3)'}}/>
   <SafeAreaView pointerEvents="box-none" style={{flex:1,justifyContent:'center',alignItems:'center',paddingHorizontal:24}}>
    <View accessibilityViewIsModal style={{width:'100%',maxWidth:420,maxHeight:'90%',backgroundColor:'#FFFFFF',borderRadius:24,padding:22}}>
     <View style={s.between}><Text style={s.heading}>{editing?'공지사항 수정':'공지사항'}</Text><Pressable accessibilityRole="button" accessibilityLabel="공지사항 닫기" disabled={busy} onPress={onClose} hitSlop={8} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:24,color:C.muted}}>×</Text></Pressable></View>
     <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingBottom:16}}>
      <Text style={[s.muted,{marginBottom:12}]}>{editor?`${editor}님이 마지막으로 수정했어요`:'아직 수정 기록이 없어요'}</Text>
      {!!updatedAt&&<Text style={[s.tiny,{marginBottom:14}]}>{new Date(updatedAt).toLocaleString('ko-KR',{year:'numeric',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</Text>}
      {editing?<><Text style={s.label}>제목</Text><TextInput accessibilityLabel="공지사항 제목" editable={!busy} maxLength={40} value={title} onChangeText={onTitleChange} style={s.input} placeholder="공지 제목을 입력해 주세요"/><Text style={s.label}>내용</Text><TextInput accessibilityLabel="공지사항 내용" editable={!busy} multiline maxLength={200} value={value} onChangeText={onChange} style={[s.input,{height:150,textAlignVertical:'top'}]} placeholder="방 멤버들에게 알려 주세요"/>
      <Text style={[s.tiny,{textAlign:'right',marginTop:8}]}>{value.length}/200</Text></>:<View style={{paddingVertical:12}}><Text style={{fontSize:18,fontWeight:'600',lineHeight:26,color:C.ink,marginBottom:14}}>{title||'공지사항'}</Text><Text selectable style={{fontSize:14,lineHeight:24,color:'#62686D'}}>{value||'등록된 공지사항이 없어요'}</Text></View>}
     </ScrollView>
     <Pressable accessibilityRole="button" disabled={busy} onPress={editing?onSave:onEdit} style={[s.button,busy&&s.disabled]}><Text style={s.buttonText}>{busy?'저장 중…':editing?'저장':'수정하기'}</Text></Pressable>
    </View>
   </SafeAreaView>
  </KeyboardAvoidingView>
 </Modal>;
}
