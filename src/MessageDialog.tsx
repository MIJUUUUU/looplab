import React from 'react';
import {KeyboardAvoidingView,Modal,Platform,Pressable,ScrollView,Text,TextInput,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {C,s} from './theme';

export function MessageDialog({visible,value,busy,onChange,onClose,onSave}:{visible:boolean;value:string;busy:boolean;onChange:(value:string)=>void;onClose:()=>void;onSave:()=>void}){
 return <Modal visible={visible} transparent animationType="fade" onRequestClose={()=>!busy&&onClose()}>
  <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
   <Pressable accessibilityRole="button" accessibilityLabel="한마디 팝업 닫기" disabled={busy} onPress={onClose} style={{position:'absolute',top:0,bottom:0,left:0,right:0,backgroundColor:'rgba(0,0,0,0.3)'}}/>
   <SafeAreaView pointerEvents="box-none" style={{flex:1,justifyContent:'center',alignItems:'center',paddingHorizontal:24}}>
    <View accessibilityViewIsModal style={{width:'100%',maxWidth:420,maxHeight:'90%',backgroundColor:'#FFFFFF',borderRadius:24,padding:22}}>
     <View style={s.between}><Text style={s.heading}>한마디 남기기</Text><Pressable accessibilityRole="button" accessibilityLabel="한마디 닫기" disabled={busy} onPress={onClose} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:24,color:C.muted}}>×</Text></Pressable></View>
     <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingBottom:16}}>
      <Text style={[s.muted,{marginBottom:12}]}>내 캐릭터 위 말풍선에 보여요</Text>
      <TextInput accessibilityLabel="한마디 내용" editable={!busy} multiline maxLength={60} value={value} onChangeText={onChange} style={[s.input,{height:120,textAlignVertical:'top'}]} placeholder="친구들에게 한마디 남겨보세요"/>
      <Text style={[s.tiny,{textAlign:'right',marginTop:8}]}>{value.length}/60</Text>
     </ScrollView>
     <Pressable accessibilityRole="button" disabled={busy} onPress={onSave} style={[s.button,busy&&s.disabled]}><Text style={s.buttonText}>{busy?'저장 중…':'저장하기'}</Text></Pressable>
    </View>
   </SafeAreaView>
  </KeyboardAvoidingView>
 </Modal>;
}
