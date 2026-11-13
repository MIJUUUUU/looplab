import React from 'react';
import Svg,{Circle,Path} from 'react-native-svg';

export function CoinIcon({size=20}:{size?:number}){
 return <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
  <Circle cx={12} cy={12} r={10} fill="#F3DF9E" stroke="#B79B58" strokeWidth={1.4}/>
  <Circle cx={12} cy={12} r={7.1} fill="none" stroke="#D2B96F" strokeWidth={1}/>
  <Path d="M12 7.5 13.5 10.5 16.5 12 13.5 13.5 12 16.5 10.5 13.5 7.5 12 10.5 10.5Z" fill="#B79B58"/>
 </Svg>;
}
