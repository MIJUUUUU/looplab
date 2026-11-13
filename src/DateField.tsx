import React,{useEffect,useState} from 'react';
import {Keyboard,Modal,Pressable,ScrollView,Text,View} from 'react-native';
import {C,s} from './theme';

export function DateField({value,onChange,disabled,active}:{value:string;onChange:(date:string)=>void;disabled:boolean;active:boolean}){
 const [expanded,setExpanded]=useState(false);
 const [month,setMonth]=useState(()=>new Date());
 useEffect(()=>{if(!active)setExpanded(false)},[active]);
 const year=month.getFullYear(),m=month.getMonth();
 const offset=new Date(year,m,1).getDay(),days=new Date(year,m+1,0).getDate();
 function toggle(){
  Keyboard.dismiss();
  if(!expanded){const [y,n]=value.split('-').map(Number);setMonth(new Date(y,n-1,1))}
  setExpanded(!expanded);
 }
 return <>
  <Pressable disabled={disabled} accessibilityRole="button" accessibilityLabel={`날짜 ${value}, 달력에서 선택`} accessibilityState={{disabled,expanded}} onPress={toggle} style={[s.input,s.between]}>
   <Text style={{fontSize:14,color:C.ink}}>{value}</Text><Text style={s.muted}>▦</Text>
  </Pressable>
  <Modal visible={active&&expanded&&!disabled} transparent animationType="fade" onRequestClose={()=>setExpanded(false)}>
   <View style={{flex:1,justifyContent:'center',alignItems:'center',padding:24}}>
    <Pressable accessibilityRole="button" accessibilityLabel="달력 닫기" onPress={()=>setExpanded(false)} style={{position:'absolute',top:0,bottom:0,left:0,right:0,backgroundColor:'rgba(0,0,0,0.3)'}}/>
    <View accessibilityViewIsModal style={{width:'100%',maxWidth:380,maxHeight:'90%',backgroundColor:'#FFFFFF',borderRadius:24,overflow:'hidden'}}>
     <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:16}}>
      <View style={s.between}><Text style={s.heading}>날짜 선택</Text><Pressable accessibilityRole="button" accessibilityLabel="달력 닫기" onPress={()=>setExpanded(false)} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:24,color:C.muted}}>×</Text></Pressable></View>
   <View style={s.between}>
    <Pressable accessibilityRole="button" accessibilityLabel="이전 달" onPress={()=>setMonth(new Date(year,m-1,1))} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:26,color:C.ink}}>‹</Text></Pressable>
    <Text accessibilityLiveRegion="polite" style={s.heading}>{year}년 {m+1}월</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="다음 달" onPress={()=>setMonth(new Date(year,m+1,1))} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:26,color:C.ink}}>›</Text></Pressable>
   </View>
   <View style={{flexDirection:'row'}}>{['일','월','화','수','목','금','토'].map(day=><Text key={day} style={[s.tiny,{width:'14.285%',textAlign:'center',paddingVertical:8}]}>{day}</Text>)}</View>
   <View style={{flexDirection:'row',flexWrap:'wrap'}}>{Array.from({length:Math.ceil((offset+days)/7)*7},(_,i)=>{
    const day=i-offset+1;
    if(day<1||day>days)return <View key={i} style={{width:'14.285%',height:44}}/>;
    const date=`${year}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const selected=value===date;
    return <Pressable key={date} accessibilityRole="button" accessibilityLabel={`${year}년 ${m+1}월 ${day}일`} accessibilityState={{selected}} onPress={()=>{onChange(date);setExpanded(false)}} style={{width:'14.285%',height:44,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:selected?'#454B50':'transparent'}}><Text style={{fontSize:14,color:selected?'#FFFFFF':C.ink}}>{day}</Text></Pressable>;
   })}</View>
     </ScrollView>
    </View>
   </View>
  </Modal>
 </>;
}
