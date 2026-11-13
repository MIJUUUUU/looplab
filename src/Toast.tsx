import React,{createContext,useCallback,useContext,useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Text,View} from 'react-native';

const ToastContext=createContext({message:'',show:(_message:string)=>{}});
export function ToastProvider({children}:{children:React.ReactNode}){
 const [message,setMessage]=useState('');
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const show=useCallback((text:string)=>{
  if(timer.current)clearTimeout(timer.current);
  setMessage(text);
  AccessibilityInfo.announceForAccessibility(text);
  timer.current=setTimeout(()=>setMessage(''),1600);
 },[]);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
 return <ToastContext.Provider value={{message,show}}>{children}</ToastContext.Provider>;
}
export const useToast=()=>useContext(ToastContext).show;
// Render inside each native Modal so confirmations appear above that screen.
export function ToastViewport({top=78}:{top?:number}){
 const {message}=useContext(ToastContext);
 if(!message)return null;
 return <View pointerEvents="none" style={{position:'absolute',top,left:22,right:22,zIndex:100,alignItems:'center'}}>
  <View style={{backgroundColor:'#454B50',borderRadius:14,paddingHorizontal:16,paddingVertical:9,maxWidth:'100%'}}>
   <Text style={{fontSize:12,lineHeight:18,color:'#FFFFFF',textAlign:'center'}}>{message}</Text>
  </View>
 </View>;
}
