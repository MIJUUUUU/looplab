import {Alert,Linking} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {ImageManipulator,SaveFormat} from 'expo-image-manipulator';

export type PendingPhoto={uri:string;base64:string};
export async function takeRoomPhoto():Promise<PendingPhoto|null>{
 const permission=await ImagePicker.requestCameraPermissionsAsync();
 if(!permission.granted){
  Alert.alert('카메라 접근이 필요해요','사진을 촬영하려면 설정에서 카메라 접근을 허용해 주세요.',[
   {text:'취소',style:'cancel'},...(!permission.canAskAgain?[{text:'설정 열기',onPress:()=>{void Linking.openSettings()}}]:[]),
  ]);
  return null;
 }
 const result=await ImagePicker.launchCameraAsync({mediaTypes:['images'],allowsEditing:false,quality:1,exif:false});
 if(result.canceled)return null;
 const asset=result.assets[0];
 const context=ImageManipulator.manipulate(asset.uri);
 if(Math.max(asset.width,asset.height)>1024)context.resize(asset.width>=asset.height?{width:1024}:{height:1024});
 const rendered=await context.renderAsync();
 try{
  let photo=await rendered.saveAsync({format:SaveFormat.JPEG,compress:0.7,base64:true});
  if(photo.base64&&photo.base64.length>1400000)photo=await rendered.saveAsync({format:SaveFormat.JPEG,compress:0.4,base64:true});
  if(!photo.base64||photo.base64.length>1400000)throw new Error('사진 용량이 커요. 다시 촬영해 주세요.');
  return {uri:photo.uri,base64:photo.base64};
 }finally{rendered.release();context.release()}
}
