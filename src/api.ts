import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import {Platform} from 'react-native';
import type {State} from './types';
export const API=process.env.EXPO_PUBLIC_API_URL||'https://looplab-playground.dlalwnjenny.chatgpt.site';
let credential='';
const storage={get:()=>Platform.OS==='web'?Promise.resolve(sessionStorage.getItem('moyeo-token')):SecureStore.getItemAsync('moyeo-token'),set:(value:string)=>Platform.OS==='web'?Promise.resolve(sessionStorage.setItem('moyeo-token',value)):SecureStore.setItemAsync('moyeo-token',value)};
export async function request<T=State>(path:string,data?:unknown):Promise<T>{const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);try{const response=await fetch(API+path,{method:data===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(credential?{Authorization:`Bearer ${credential}`}:{})},...(data===undefined?{}:{body:JSON.stringify(data)}),signal:controller.signal});const result=await response.json();if(!response.ok)throw new Error(result.error||'서버에 연결할 수 없어요.');return result;}catch(e){if(e instanceof Error&&e.name==='AbortError')throw new Error('연결이 늦어지고 있어요. 인터넷 연결을 확인해 주세요.');throw e;}finally{clearTimeout(timeout)}}
export async function connect(recovery?:string){let token=recovery?.trim()||await storage.get();const create=!token;if(!token){const bytes=await Crypto.getRandomBytesAsync(32);token='moyeo_'+Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');await storage.set(token)}const result=await request<State>('/api/session',{token,create:create||!recovery});credential=token;await storage.set(token);return result;}
export const recoveryCode=()=>credential;
