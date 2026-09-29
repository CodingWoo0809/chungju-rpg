// 운동장 미니 축구. 골대 좌측 상단의 친구 이모티콘으로 켜고 끈다.
import {moveBody} from './world.js';
export const GOAL={north:{y:105,x0:615,x1:670},south:{y:380,x0:615,x1:670}};
export const FIELD_BOX={x0:558,x1:727,y0:100,y1:385};
export const MATCH_MARKER={x:611,y:103,z:12,emoji:'🧑‍🤝‍🧑'};
const ROSTER=[
 {id:'mate-1',name:'민재',team:0,home:{x:600,y:268}},
 {id:'mate-2',name:'서준',team:0,home:{x:686,y:292}},
 {id:'rival-1',name:'하윤',team:1,home:{x:604,y:196}},
 {id:'rival-2',name:'도연',team:1,home:{x:684,y:170}}
];
const SPEED=15,KICK=54;
const soccer=state=>state.balls?.find(b=>b.type==='soccer');
export function matchOn(state){return !!state.match?.on;}
export function matchActors(state){return state.match?.on?state.match.actors:[];}
export function stopMatch(state){if(state.match)state.match.on=false;state.match=null;}
export function toggleMatch(state,emit=()=>{}){
 if(state.match?.on){
  const [us,them]=state.match.score;
  stopMatch(state);
  emit(`친구들과의 미니 게임 종료 · 우리 ${us} : ${them} 친구들. 다음에 또 하자!`);
  return false;
 }
 state.match={on:true,score:[0,0],kickCool:0,actors:ROSTER.map(f=>({
  ...f,x:f.home.x,y:f.home.y,scene:'campus',role:'student',
  facing:{x:0,y:f.team?1:-1},moving:false,running:false,cool:0,
  activity:f.team?'친구들 팀':'우리 팀'
 }))};
 const b=soccer(state);
 if(b){Object.assign(b,{scene:'campus',x:642,y:242,z:0,vx:0,vy:0,vz:0,held:false,cooldown:.4});}
 emit('친구들이 모였다! 좌클릭을 길게 눌러 슛 · 이모티콘을 다시 누르면 종료');
 return true;
}
// 골 판정은 physics 쪽에서 부른다. side: 'north'는 우리 팀 득점, 'south'는 친구들 득점.
export function recordGoal(state,side,emit=()=>{}){
 if(!state.match?.on)return false;
 const team=side==='north'?0:1;
 state.match.score[team]++;
 const [us,them]=state.match.score;
 emit(`${team?'친구들이 한 골!':'골인!'} 우리 ${us} : ${them} 친구들`);
 for(const a of state.match.actors)Object.assign(a,{x:a.home.x,y:a.home.y,cool:.8});
 state.match.kickCool=1;
 return true;
}
function clampField(a){
 a.x=Math.max(FIELD_BOX.x0,Math.min(FIELD_BOX.x1,a.x));
 a.y=Math.max(FIELD_BOX.y0,Math.min(FIELD_BOX.y1,a.y));
}
function step(a,tx,ty,dt,speed=SPEED){
 const dx=tx-a.x,dy=ty-a.y,dist=Math.hypot(dx,dy);
 a.moving=dist>1.2;a.running=dist>16;
 if(!a.moving)return;
 const v=(a.running?speed*1.5:speed)*dt,k=Math.min(1,v/dist);
 a.facing={x:dx/dist,y:dy/dist};
 moveBody(a,dx*k,dy*k,'campus',1.4);
 clampField(a);
}
export function updateMatch(state,dt,emit=()=>{}){
 const m=state.match;if(!m?.on)return;
 const b=soccer(state);if(!b||b.scene!=='campus')return;
 m.kickCool=Math.max(0,m.kickCool-dt);
 const playerHas=b.held&&state.scene==='campus';
 const ballX=playerHas?state.player.x:b.x,ballY=playerHas?state.player.y:b.y;
 for(const team of [0,1]){
  const mates=m.actors.filter(a=>a.team===team);
  let chaser=mates[0],best=Infinity;
  for(const a of mates){const distance=Math.hypot(a.x-ballX,a.y-ballY);if(distance<best){best=distance;chaser=a;}}
  for(const a of mates)a.chasing=a===chaser;
 }
 for(const a of m.actors){
  a.cool=Math.max(0,a.cool-dt);
  const goal=a.team?GOAL.south:GOAL.north;
  if(a.chasing)step(a,ballX,ballY,dt);
  else step(a,a.home.x+(ballX-a.home.x)*.25,a.home.y+(ballY-a.home.y)*.3,dt);
  const near=Math.hypot(a.x-ballX,a.y-ballY);
  if(playerHas&&a.team===1&&near<3.2&&a.cool<=0&&m.kickCool<=0){   // 친구들 팀의 가로채기
   b.held=false;b.cooldown=1.1;a.cool=1.4;m.kickCool=.35;
   const dx=(goal.x0+goal.x1)/2-b.x,dy=goal.y-b.y,len=Math.hypot(dx,dy)||1;
   b.vx=dx/len*KICK*.7;b.vy=dy/len*KICK*.7;b.vz=3;
   emit(`${a.name}에게 공을 빼앗겼다!`);
   continue;
  }
  if(!b.held&&near<4.4&&a.cool<=0&&m.kickCool<=0&&b.z<4){
   const aimX=(goal.x0+goal.x1)/2+(Math.random()-.5)*16,dx=aimX-b.x,dy=goal.y-b.y,len=Math.hypot(dx,dy)||1;
   const power=len>90?1:.72;
   b.vx=dx/len*KICK*power;b.vy=dy/len*KICK*power;b.vz=3.4;b.cooldown=.5;
   a.cool=1.1;m.kickCool=.3;a.facing={x:dx/len,y:dy/len};
  }
 }
}
