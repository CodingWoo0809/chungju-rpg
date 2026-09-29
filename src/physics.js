import { solid } from './world.js';
import { gain } from './inventory.js';
import { recordGoal } from './minigame.js';

export const PICKUP_RANGE=8;
// 충전 시간(초) → 슛 세기. 좌클릭을 오래 누를수록 강해진다.
export const CHARGE_TIME=1.15;
const SHOT={soccer:{min:30,max:96,lift:[2.2,10.5]},basketball:{min:17,max:42,lift:[21,41]}};

export function seedBalls(state){if(!state.balls.length)state.balls=[{id:'soccer',type:'soccer',x:641,y:275,z:0,vx:0,vy:0,vz:0,scene:'campus',held:false,cooldown:0},{id:'basketball',type:'basketball',x:55,y:65,z:0,vx:0,vy:0,vz:0,scene:'gym',held:false,cooldown:0}];}
export function shotPreview(type,power){const spec=SHOT[type]||SHOT.soccer,t=Math.max(0,Math.min(1,power));return {speed:spec.min+(spec.max-spec.min)*t,lift:spec.lift[0]+(spec.lift[1]-spec.lift[0])*t};}
// 실제 물리(중력 42, 공중 수평 감쇠 .18)를 그대로 푼다. 조준선·착지 링·실제 발사가 모두 이 해를 쓴다.
export const AIR_DRAG=.18,GRAVITY=42;
// target 이 있으면 "가득 충전 = 마우스 지점에 정확히 도달"이 되도록 속도를 역산한다.
export function shotSolution(type,power,from,dir,target=null,aimZ=0){
 const spec=SHOT[type]||SHOT.soccer,t=Math.max(0,Math.min(1,power)),z0=from.z||0;
 const lift=spec.lift[0]+(spec.lift[1]-spec.lift[0])*t;
 const disc=lift*lift-2*GRAVITY*(aimZ-z0);
 const flight=disc>=0?(lift+Math.sqrt(disc))/GRAVITY:lift/GRAVITY;
 const span=(1-Math.exp(-AIR_DRAG*flight))/AIR_DRAG;            // 단위 속도당 공중 이동 거리
 const roll=aimZ<=.01?.43+.43*flight:0;                        // 착지 후 구르는 거리(시뮬레이션 측정에 맞춘 근사)
 const total=span+roll;
 let speed=spec.min+(spec.max-spec.min)*t;
 if(target){
  const need=Math.hypot(target.x-from.x,target.y-from.y)/Math.max(total,1e-4);
  speed=Math.max(6,Math.min(spec.max,spec.min+(need-spec.min)*t));
 }
 const at=u=>{const reach=speed*(1-Math.exp(-AIR_DRAG*u))/AIR_DRAG;
  return {x:from.x+dir.x*reach,y:from.y+dir.y*reach,z:z0+lift*u-GRAVITY/2*u*u};};
 const mark={x:from.x+dir.x*total*speed,y:from.y+dir.y*total*speed,z:aimZ};
 return {speed,lift,flight,span,roll,at,mark,short:disc<0};
}
export function predictShot(type,power,from,dir,aimZ=0,target=null){return shotSolution(type,power,from,dir,target,aimZ);}
export function heldBall(state){return state.balls?.find(b=>b.held&&b.scene===state.scene)||null;}
function threatened(state){
 if(state.match?.on&&state.scene==='campus')return false;      // 미니 게임 중에는 공을 놓지 않는다
 return (state.monsters||[]).some(m=>m.scene===state.scene&&m.hp>0&&Math.hypot(m.x-state.player.x,m.y-state.player.y)<30);
}
function carry(state,b){
 const f=state.player.facing||{x:0,y:1};
 b.x=state.player.x+f.x*3.2;b.y=state.player.y+f.y*3.2;
 b.phase=(b.phase||0)+(state.player.moving?.34:.06);
 b.z=b.type==='basketball'?5:Math.abs(Math.sin(b.phase))*1.1;
}
// 방향(aim)과 세기(0~1)로 찬다. 키보드 F는 세기 .55로 들어온다.
export function shootBall(state,b,aim,power=.55,emit=()=>{}){
 if(!b||!b.held)return false;
 const f=Math.hypot(aim?.x||0,aim?.y||0)>.01?aim:state.player.facing;
 const len=Math.hypot(f.x,f.y)||1,dir={x:f.x/len,y:f.y/len},t=Math.max(0,Math.min(1,power));
 const {speed,lift}=shotSolution(b.type,t,{x:b.x,y:b.y,z:b.z},dir,aim?.target||null,aim?.targetZ||0);
 b.held=false;b.cooldown=.55;
 b.vx=dir.x*speed;b.vy=dir.y*speed;b.vz=lift;
 const key=b.type==='basketball'?'sport:basketball:shots':'sport:soccer:kicks';
 state.flags[key]=(state.flags[key]||0)+1;state.stats.kicks++;gain(state,'sport',1);
 emit(b.type==='soccer'?(t>.8?'강력한 슛!':t>.45?'힘차게 킥!':'짧은 패스'):(t>.7?'점프 슛!':'가볍게 레이업'));
 return true;
}
export function releaseBall(state,b,emit=()=>{}){
 if(!b||!b.held)return false;
 b.held=false;b.cooldown=.7;b.vx*=.2;b.vy*=.2;b.vz=0;
 emit('공을 내려놓았다.');return true;
}
export function interactBall(state,emit=()=>{}){
 const b=state.balls.find(b=>b.scene===state.scene&&(b.held||Math.hypot(b.x-state.player.x,b.y-state.player.y)<10));
 if(!b)return false;
 if(!b.held){b.held=true;b.cooldown=0;carry(state,b);if(b.type==='basketball')b.z=5;emit('공을 잡았다. 마우스를 길게 눌러 슛!');return true;}
 return shootBall(state,b,state.player.facing,.55,emit);
}
function score(state,b,emit,side){
 if(!recordGoal(state,side,emit)){
  state.stats.goals=(state.stats.goals||0)+1;gain(state,'sport',8);
  emit(b.type==='soccer'?'골! 운동 숙련도 +8':'슛 성공! 운동 숙련도 +8');
 }else{state.stats.goals=(state.stats.goals||0)+1;gain(state,'sport',side==='north'?8:2);}
 b.x=b.type==='soccer'?641:55;b.y=b.type==='soccer'?275:65;b.z=0;b.vx=0;b.vy=0;b.vz=0;b.cooldown=1.2;
}
export function updateBalls(state,dt,emit){
 for(const b of state.balls){
  b.cooldown=Math.max(0,(b.cooldown||0)-dt);
  if(b.held){
   if(b.scene!==state.scene||threatened(state)){b.held=false;b.cooldown=.6;continue;}
   carry(state,b);continue;
  }
  const oldZ=b.z,oldY=b.y;
  b.vz-=42*dt;b.z+=b.vz*dt;
  if(b.z<0){b.z=0;b.vz=Math.abs(b.vz)>5?-b.vz*.46:0;}
  const nx=b.x+b.vx*dt,ny=b.y+b.vy*dt;
  if(solid({x:nx,y:b.y},b.scene,1))b.vx*=-.65;else b.x=nx;
  if(solid({x:b.x,y:ny},b.scene,1))b.vy*=-.65;else b.y=ny;
  const drag=Math.exp(-(b.z<.1?1.8:.18)*dt);b.vx*=drag;b.vy*=drag;
  if(b.type==='soccer'){
   if(b.x>615&&b.x<670&&oldY>=105&&b.y<105){score(state,b,emit,'north');continue;}
   if(b.x>615&&b.x<670&&oldY<=380&&b.y>380){score(state,b,emit,'south');continue;}
   if(b.x<556||b.x>729){b.x=Math.max(556,Math.min(729,b.x));b.vx*=-.72;}
   if(b.y<96||b.y>389){b.y=Math.max(96,Math.min(389,b.y));b.vy*=-.72;}
  }else{
   const rimDistance=Math.hypot(b.x-56,b.y-14);
   if(oldZ>=12&&b.z<12&&b.vz<0){
    if(rimDistance<3){score(state,b,emit,'hoop');continue;}
    if(rimDistance<5.5){b.z=12.5;b.vz=Math.abs(b.vz)*.55;b.vx+=(b.x-56)/rimDistance*10;b.vy+=(b.y-14)/rimDistance*10;emit('림을 맞고 튀어 올랐다!');}
   }
   if(b.y<11&&oldY>=11&&b.z>9&&b.z<24){b.y=11;b.vy=Math.abs(b.vy)*.6;}
  }
  // 가까이 가면 자연스럽게 공을 소유한다.
  if(b.scene===state.scene&&b.cooldown<=0&&b.z<3.2&&!threatened(state)
   &&Math.hypot(state.player.x-b.x,state.player.y-b.y)<PICKUP_RANGE){
   b.held=true;b.vx=0;b.vy=0;b.vz=0;carry(state,b);
  }
 }
}
