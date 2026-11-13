import React from 'react';
import {ActivityIndicator,Image,Modal,Pressable,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {PendingPhoto} from './roomCamera';

export function PhotoPreview({photo,busy,onCancel,onSave}:{photo:PendingPhoto|null;busy:boolean;onCancel:()=>void;onSave:()=>void}){
 return <Modal visible={!!photo} animationType="fade" onRequestClose={()=>!busy&&onCancel()}>
  <SafeAreaView style={{flex:1,backgroundColor:'#17191B'}}>
   <Text style={{color:'#FFFFFF',fontSize:16,textAlign:'center',padding:20}}>이 사진을 남길까요?</Text>
   {photo&&<Image accessibilityLabel="촬영한 사진 미리보기" source={{uri:photo.uri}} resizeMode="contain" style={{flex:1,width:'100%'}}/>}
   <Text style={{color:'#BDC1C5',fontSize:12,textAlign:'center',padding:16}}>저장하면 방 멤버들이 볼 수 있어요</Text>
   <View style={{flexDirection:'row',justifyContent:'space-evenly',paddingBottom:18}}>
    <Pressable accessibilityRole="button" accessibilityLabel="사진 취소" disabled={busy} onPress={onCancel} style={{width:60,height:60,borderRadius:30,backgroundColor:'#34383C',alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:30,color:'#FFFFFF'}}>×</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="사진 저장" disabled={busy} onPress={onSave} style={{width:60,height:60,borderRadius:30,backgroundColor:'#FFFFFF',alignItems:'center',justifyContent:'center'}}>{busy?<ActivityIndicator color="#454B50"/>:<Text style={{fontSize:28,color:'#454B50'}}>✓</Text>}</Pressable>
   </View>
  </SafeAreaView>
 </Modal>;
}
export type PhotoView={name:string;image?:string;error?:string};
export function PhotoViewer({photo,onClose}:{photo:PhotoView|null;onClose:()=>void}){
 return <Modal visible={!!photo} animationType="fade" onRequestClose={onClose}>
  <SafeAreaView style={{flex:1,backgroundColor:'#17191B'}}>
   <View style={{flexDirection:'row',alignItems:'center',paddingHorizontal:22,paddingVertical:8}}><Text style={{flex:1,fontSize:16,color:'#FFFFFF'}}>{photo?.name}님의 사진</Text><Pressable accessibilityRole="button" accessibilityLabel="사진 닫기" onPress={onClose} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:28,color:'#FFFFFF'}}>×</Text></Pressable></View>
   {photo?.image?<Image accessibilityLabel={`${photo.name}님이 남긴 사진`} source={{uri:photo.image}} resizeMode="contain" style={{flex:1,width:'100%'}}/>:<View style={{flex:1,alignItems:'center',justifyContent:'center'}}>{photo?.error?<Text style={{color:'#FFFFFF',padding:24,textAlign:'center'}}>{photo.error}</Text>:<ActivityIndicator color="#FFFFFF"/>}</View>}
  </SafeAreaView>
 </Modal>;
}
