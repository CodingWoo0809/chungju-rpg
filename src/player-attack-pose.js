import {HOLD_POSE,swingProfile} from './weapon-motion.js';
import {weaponArt} from './weapon-art.js';

// Pixel landmarks on the approved idle art. The same landmarks cut and animate the sleeves.
export const ATTACK_SOURCE={
 front:{key:'idle',index:0,top:39,bottom:348,width:1,waist:[190,230],neck:126,
  arms:[[[146,146],[139,188],[140,235]],[[230,146],[239,188],[236,235]]]},
 back:{key:'backWalk',index:0,top:25,bottom:372,width:1,waist:[186,232],neck:126,
  arms:[[[145,145],[129,181],[128,222]],[[232,147],[244,184],[246,228]]]},
 right:{key:'right',index:3,top:31,bottom:349,width:.87,waist:[191,235],neck:134,
  arms:[[[162,156],[147,194],[149,244]],[[209,154],[213,192],[201,240]]]},
};
export function sourcePoint(view,p){
 const s=ATTACK_SOURCE[view],scale=24/(s.bottom-s.top);
 return {x:(p[0]-192)*scale*s.width,y:(p[1]-s.bottom)*scale};
}
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
function sample(keys,t){
 for(let i=1;i<keys.length;i++)if(t<=keys[i][0]){
  const a=keys[i-1],b=keys[i],u=smooth(Math.max(0,(t-a[0])/(b[0]-a[0])));
  return a.slice(1).map((v,j)=>mix(v,b[j+1],u));
 }
 return keys.at(-1).slice(1);
}
function joint(shoulder,target,length1,length2,bend){
 const dx=target.x-shoulder.x,dy=target.y-shoulder.y;
 const distance=Math.hypot(dx,dy),d=Math.min(length1+length2-.04,Math.max(Math.abs(length1-length2)+.04,distance));
 const angle=Math.atan2(dy,dx),a=Math.acos(Math.max(-1,Math.min(1,(length1*length1+d*d-length2*length2)/(2*length1*d))));
 return {shoulder,elbow:{x:shoulder.x+Math.cos(angle+bend*a)*length1,y:shoulder.y+Math.sin(angle+bend*a)*length1},
  hand:{x:shoulder.x+Math.cos(angle)*d,y:shoulder.y+Math.sin(angle)*d}};
}
export function playerAttackPose(family,dir,progress,id){
 if(!['swing','thrust'].includes(family))return null;
 const view=dir==='left'?'right':dir,s=ATTACK_SOURCE[view],p=Math.max(0,Math.min(1,progress));
 const art=weaponArt(id),profile=swingProfile(id),heavy=!!art?.heavy;
 const rest=s.arms.map(a=>a.map(pt=>sourcePoint(view,pt)));
 let hold=HOLD_POSE[art?.hold||(heavy?'heavy':family)][view];
 if(family==='swing'&&hold>0)hold-=Math.PI*2;
 const hit=family==='thrust'?.46:heavy?.46:.4,wind=family==='thrust'?.25:heavy?.33:.23;
 const side=view==='right',back=view==='back',forward=back?-1:1;
 const main=rest[0][2];
 // x/y are the grip, not the tip: the complete weapon follows the hand through space.
 const swingKeys=[
  [0,main.x,main.y,hold,0,0],
  [wind,side?-5.2:-5.6,-18,side?-2.8:-2.4,-.34,heavy?-1.9:-1.5],
  [hit,side?3.5:1.2,-15,side?-.08:forward*.45,.24,heavy?2.2:1.9],
  [heavy?.68:.57,side?-1.2:5,-10.5,side?1.95:2.1,.36,heavy?2.5:2.1],
  [1,main.x,main.y,hold+Math.PI*2,0,0],
 ];
 if(heavy){swingKeys[1][1]-=.5;swingKeys[1][3]-=profile.follow*.3;}
 const thrustAngle=side?-.08:back?-1.95:1.05;
 const thrustKeys=[
  [0,main.x,main.y,hold,0,0],
  [wind,side?-1.5:-1.2,back?-13.7:-13.1,thrustAngle,-.06,-.45],
  [hit,side?4.5:back?-3.85:3.8,side?-13.6:back?-16:-11.7,thrustAngle,.16,back?-1.7:1.7],
  [.58,side?4.3:back?-3.7:3.6,side?-13.6:back?-16:-11.7,thrustAngle,.16,back?-1.7:1.7],
  [.8,side?-1.5:-1.2,back?-13.7:-13.1,thrustAngle,-.025,-.2],
  [1,main.x,main.y,hold,0,0],
 ];
 const [x,y,angle,drive,weightShift]=sample(family==='swing'?swingKeys:thrustKeys,p);
 const waist=sourcePoint(view,s.waist),rotation=drive*.14,shift=weightShift*.28;
 // Rigid lean preserves cloth volume. The head stays upright at its original height.
 const transform=q=>({x:waist.x+(q.x-waist.x)*Math.cos(rotation)-(q.y-waist.y)*Math.sin(rotation)+shift,
  y:waist.y+(q.x-waist.x)*Math.sin(rotation)+(q.y-waist.y)*Math.cos(rotation)});
 const neck=sourcePoint(view,[s.waist[0],s.neck]);
 const headShift=transform(neck).x-neck.x;
 const arms=rest.map((a,i)=>{
  const shoulder=transform(a[0]),l1=Math.hypot(a[1].x-a[0].x,a[1].y-a[0].y),l2=Math.hypot(a[2].x-a[1].x,a[2].y-a[1].y);
  shoulder.y+=(i===0?-1:1)*drive*.65;
  let target=i===0?{x,y}:transform(a[2]);
  if(i===1){
   const weight=smooth(Math.min(1,p/.18))*smooth(Math.min(1,(1-p)/.16));
   const support=family==='thrust'?{x:x-Math.cos(angle)*3.1,y:y-Math.sin(angle)*3.1}:{x:side?-1.4:3.5,y:-13.8};
   target={x:mix(target.x,support.x,weight),y:mix(target.y,support.y,weight)};
  }
  return {...joint(shoulder,target,l1,l2,i===0?1:-1),rest:a};
 });
 // Keep both spear grips collinear after IK limits the leading arm's reach.
 if(family==='thrust'&&p>=wind&&p<=.8){
  const a=arms[1],target={x:arms[0].hand.x-Math.cos(angle)*3.1,y:arms[0].hand.y-Math.sin(angle)*3.1};
  arms[1]={...joint(a.shoulder,target,Math.hypot(a.rest[1].x-a.rest[0].x,a.rest[1].y-a.rest[0].y),Math.hypot(a.rest[2].x-a.rest[1].x,a.rest[2].y-a.rest[1].y),-1),rest:a.rest};
 }
 return {view,family,progress:p,hit,source:s,arms,angle,waist,rotation,shift,headShift,
  split:back?Infinity:(family==='swing'&&p<wind?Infinity:-Infinity),
  glow:Math.max(0,1-Math.abs(p-hit)/.13)};
}
