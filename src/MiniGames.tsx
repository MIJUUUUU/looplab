import React,{useEffect,useRef,useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import {request} from './api';
import {s,C} from './theme';
type Lobby={day:string;question:string[];answered:number;total:number;own:number|null;complete:boolean;answers:{name:string;choice:number}[];rewarded:string[]};
type Memory={id:string;version:number;cards:(number|null)[];matched:number[];open:number[];moves:number;complete:boolean;reward?:number};
const pictures=['🌷','🍓','⭐','🍀','🐱','🍑'];
export function MiniGames({mode,onExit,onReward}:{mode:'memory'|'choice';onExit:()=>void;onReward:()=>void}){
 const [lobby,setLobby]=useState<Lobby|null>(null),[memory,setMemory]=useState<Memory|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[result,setResult]=useState('');
 const [boardWidth,setBoardWidth]=useState(0);
 const cardSize=Math.max(0,Math.floor((boardWidth-16)/3));
 const locked=useRef(false),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[]);
 useEffect(()=>{let current=true;const refresh=async()=>{try{const next=await request<Lobby>('/api/games');if(current){setLobby(next);onReward()}}catch(e){if(current)setError((e as Error).message)}};void refresh();const timer=setInterval(refresh,4000);return()=>{current=false;clearInterval(timer)}},[]);
 async function perform(action:()=>Promise<void>){if(locked.current)return;locked.current=true;setBusy(true);setError('');try{await action()}catch(e){if(alive.current)setError((e as Error).message)}finally{locked.current=false;if(alive.current)setBusy(false)}}
 async function startMemory(){await perform(async()=>{const next=await request<Memory>('/api/games/memory/start',{});if(alive.current){setMemory(next);setResult('')}})}
 useEffect(()=>{if(mode==='memory')void startMemory()},[mode]);
 const mismatched=!!memory&&memory.open.length===2&&memory.open.some(index=>!memory.matched.includes(index));
 useEffect(()=>{
  if(!mismatched||!memory)return;
  const version=memory.version;
  const timer=setTimeout(()=>setMemory(current=>current&&current.version===version?{...current,open:[],cards:current.cards.map((value,index)=>current.matched.includes(index)?value:null)}:current),800);
  return()=>clearTimeout(timer);
 },[mismatched,memory?.version]);
 const button=(label:string,onPress:()=>void,disabled=false)=><Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[s.button,{marginTop:12},disabled&&s.disabled]}><Text style={s.buttonText}>{label}</Text></Pressable>;
 return <View>
 {error?<Text accessibilityRole="alert" style={s.errorText}>{error}</Text>:null}
 {mode==='memory'&&memory?<>
 <Text style={s.heading}>짝 맞추기</Text><Text style={s.subtitle}>{memory.matched.length/2} / 6쌍 · {memory.moves}번 시도</Text>
 <View onLayout={event=>setBoardWidth(event.nativeEvent.layout.width)} style={{width:'100%',height:cardSize*4+24,flexDirection:'row',flexWrap:'wrap',alignContent:'flex-start',gap:8,marginTop:20}}>{boardWidth>0&&memory.cards.map((value,index)=><Pressable key={index} accessibilityRole="button" accessibilityLabel={value===null?`카드 ${index+1} 뒤집기`:`카드 ${index+1} ${pictures[value]}`} disabled={busy||mismatched||memory.complete||memory.matched.includes(index)||(memory.open.length===1&&memory.open.includes(index))} onPress={()=>{if(mismatched)return;void perform(async()=>{const next=await request<Memory>('/api/games/memory/flip',{index,version:memory.version});if(!alive.current)return;setMemory(next);if(next.complete){setResult(next.reward?'완성! 5코인을 받았어요':'완성! 오늘 보상은 이미 받았어요');onReward()}})}} style={{width:cardSize,height:cardSize,flexGrow:0,flexShrink:0,overflow:'hidden',borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:memory.matched.includes(index)?'#E7EDD9':value===null?'#EEF0F2':'#FFF5E4',borderWidth:1,borderColor:C.line}}><Text allowFontScaling={false} numberOfLines={1} style={{width:44,height:44,lineHeight:44,textAlign:'center',includeFontPadding:false,fontSize:28,color:C.muted}}>{value===null?'?':pictures[value]}</Text></Pressable>)}</View>
 <Text style={[s.muted,{marginTop:16,minHeight:38}]}>{result||'카드 두 장을 고르세요. 틀린 쌍은 잠시 후 다시 가려져요.'}</Text>
 <View style={{height:64}}>{memory.complete&&button('내 코인으로 돌아가기',onExit)}</View>
 </>:mode==='choice'?<>
 <Text style={s.heading}>같은 답 고르기</Text>
 {!lobby?<Text style={s.subtitle}>질문을 불러오는 중이에요.</Text>:<><Text style={[s.heading,{marginTop:24}]}>{lobby.question[0]}</Text><Text style={s.subtitle}>{lobby.answered} / {lobby.total}명 참여 · 답은 제출 후 바꿀 수 없어요.</Text>
 {[0,1].map(choice=>{const count=lobby.answers.filter(a=>a.choice===choice).length,percent=Math.round(count/lobby.total*100);return <View key={choice}>{lobby.complete?<View accessibilityLabel={lobby.question[choice+1]+', '+count+'명, '+percent+'퍼센트'} style={{marginTop:12,minHeight:64,borderRadius:16,overflow:'hidden',backgroundColor:'#EEF0F2',borderWidth:1,borderColor:lobby.own===choice?'#7C8F65':'#E1E4E8'}}><View style={{position:'absolute',left:0,top:0,bottom:0,width:`${percent}%`,backgroundColor:'#DDE7D2'}}/><View style={[s.between,{padding:16,gap:10}]}><Text style={{flex:1,color:C.ink,fontSize:14}}>{lobby.own===choice?'✓ ':''}{lobby.question[choice+1]}</Text><Text style={{color:C.ink,fontSize:13,fontWeight:'600'}}>{count}명 · {percent}%</Text></View></View>:button((lobby.own===choice?'✓ ':'')+lobby.question[choice+1],()=>void perform(async()=>{const next=await request<Lobby>('/api/games/choice',{day:lobby.day,choice});if(alive.current){setLobby(next);onReward()}}),busy||lobby.own!==null)}</View>})}
 {lobby.complete?<View style={s.card}><Text style={s.heading}>{lobby.answers.every(a=>a.choice===lobby.answers[0].choice)?'모두 같은 마음이에요!':'서로의 취향을 알아봤어요'}</Text>{lobby.answers.map((a,i)=><Text key={i} style={[s.muted,{marginTop:12}]}>{a.name} · {lobby.question[a.choice+1]}</Text>)}<Text style={[s.muted,{marginTop:16}]}>참여한 모두에게 5코인이 지급됐어요.</Text></View>:<Text style={[s.muted,{marginTop:20}]}>{lobby.own===null?'각자 하나씩 골라 주세요.':'답을 남겼어요. 친구들이 답하면 여기서 결과를 볼 수 있어요.'}</Text>}
 </>}
 </>:<View><Text style={s.subtitle}>{busy?'카드를 준비하고 있어요.':'카드를 불러오지 못했어요.'}</Text>{!busy&&button('다시 시도',()=>void startMemory())}</View>}
 </View>;
}
