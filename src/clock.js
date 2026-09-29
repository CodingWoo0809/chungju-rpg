import { CONFIG } from './config.js';
import { GATE } from './world.js';

export const LESSON_COUNTS=[6,6,7,7,5];
const BASE=[
 ['등교','arrival',490,520],['아침 조회','homeroom',520,530],
 ['1교시','class',530,580],['쉬는 시간','break',580,590],
 ['2교시','class',590,640],['쉬는 시간','break',640,650],
 ['3교시','class',650,700],['점심시간','lunch',700,750],
 ['4교시','class',750,800],['쉬는 시간','break',800,810],
 ['5교시','class',810,860],['쉬는 시간','break',860,870],
 ['6교시','class',870,920],['쉬는 시간','break',920,930],['7교시','class',930,980]
].map(([name,type,start,end])=>({name,type,start,end}));
export function schoolEnd(day=0){return [920,920,980,980,860][day]??920;}
const WEEK=LESSON_COUNTS.map((count,day)=>[
 ...BASE.filter(p=>p.end<=schoolEnd(day)).map(p=>day===2&&p.type==='class'&&p.start>=870?{...p,name:p.name+' · 동아리 활동',type:'club'}:p),
 {name:'방과후',type:'afterSchool',start:schoolEnd(day),end:CONFIG.dayEnd}
]);
export const SCHEDULE=WEEK[0];
export function scheduleForDay(day=0){return WEEK[day]??WEEK[0];}
export function getPeriod(time,day=0){return scheduleForDay(day).find(p=>time<p.end)??scheduleForDay(day).at(-1);}
export function advanceClock(state,realSeconds){
 if(!Number.isFinite(realSeconds)||realSeconds<=0||state.time>=CONFIG.dayEnd)return [];
 const events=[];let remaining=realSeconds;
 while(remaining>0.0000001&&state.time<CONFIG.dayEnd){
  const period=getPeriod(state.time,state.day);
  const duration=period.type==='club'?CONFIG.classSeconds:CONFIG[`${period.type}Seconds`];
  const rate=(period.end-period.start)/duration;
  const boundary=Math.min(period.end,CONFIG.dayEnd,state.time<1100?1100:Infinity);
  const needed=(boundary-state.time)/rate;
  if(remaining+0.0000001<needed){state.time+=remaining*rate;break;}
  state.time=boundary;remaining=Math.max(0,remaining-needed);
  if(boundary===1100)events.push('warning');
  if(boundary===CONFIG.dayEnd)events.push('dayEnd');
  else if(boundary===period.end)events.push('period');
 }
 return events;
}
export function nextDay(state){
 if(state.day>=4)return false;
 state.day++;state.time=CONFIG.dayStart;state.scene='campus';
 Object.assign(state.player,GATE,{hp:state.player.maxHp,facing:{x:0,y:-1},invulnerable:0,dodge:0});
 delete state.returnEntrance;
 state.monsters=[];state.drops=[];state.npcs=[];state.balls=[];
 return true;
}
