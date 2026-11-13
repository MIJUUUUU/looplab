import React from 'react';
import Svg,{Rect,Path,Circle} from 'react-native-svg';
export function PhotoIcon({size=20,color='#62686D'}:{size?:number;color?:string}){
 return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" accessible={false}>
  <Rect x={3} y={4} width={18} height={16} rx={3}/><Circle cx={8} cy={9} r={1.3}/><Path d="m4 17 5-5 4 4 3-3 5 5"/>
 </Svg>;
}
