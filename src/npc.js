import { BUILDINGS, GATE, solid, moveBody } from './world.js';
import { getPeriod, schoolEnd } from './clock.js';
import { partySpot } from './celebration.js';

const PEOPLE = [
 ['min','민우','machine','student','활발한 실습 친구','톱니는 하나만 어긋나도 멈춰. 같이 맞춰 보자.'],
 ['seo','서윤','architecture','student','차분한 스케치 친구','학교의 빈 공간에 어떤 이야기를 그릴까?'],
 ['jun','준서','electric','student','호기심 많은 발명 친구','작은 불꽃도 회로를 만나면 빛이 돼.'],
 ['ha','하린','civil','student','든든한 측량 친구','천천히, 기초부터 단단하게.'],
 ['ji','지후','machine','student','장난기 많은 운동 친구','수업 끝나면 운동장에서 공 차자!'],
 ['yu','유나','architecture','student','다정한 기록 친구','오늘 네가 해낸 일도 기록해 둘게.'],
 ['do','도현','electric','student','말수 적은 관찰 친구','복도 창가에서 보면 운동장이 한눈에 보여.'],
 ['su','수빈','civil','student','승부욕 있는 농구 친구','패스는 믿음이지. 장성관에서 보자.'],
 ['teacher','이든 학생부 선생님','machine','teacher','따뜻한 생활지도','서두르지 말고 안전부터 챙기자.'],
 ['senior','가온 선배','electric','council','친절한 학생회','좋은 아침! 오늘도 잘 부탁해.'],
 ['prefect','라온 선배','civil','council','성실한 학생회','천천히 걸어와. 아직 시간 있어.'],
 ['guard','한결 학생부 선생님','architecture','teacher','유쾌한 생활지도','인사 한마디가 하루를 바꾼단다.']
];
const REPRESENTATIVES = [
 ['electric','전기전자과 과부장 선생님'],['civil','토목시스템과 과부장 선생님'],
 ['machine','자동화기계과 과부장 선생님'],['architecture','건축디자인과 과부장 선생님'],
 ['career','취업 상담선생님'],['gym','체육선생님'],
 ['jangseong','복싱부 관장님'],['cafeteria','영양교사']
];
export function representativeNPCs(){
 return REPRESENTATIVES.map(([scene,name])=>({id:'tour-'+scene,name,department:scene,role:'teacher',scene,x:55,y:76,homeScene:scene,homeX:55,homeY:76,activity:'시설 안내',dialogue:'궁금한 것이 있으면 편하게 물어보렴.',path:[],static:true})).concat({id:'homeroom',name:'담임선생님',department:'main',role:'teacher',scene:'main-2',x:74,y:186,homeScene:'main-2',homeX:74,homeY:186,activity:'1학년 교실 · 조회 안내',dialogue:'학교 곳곳을 둘러보며 너에게 맞는 배움을 찾아보렴.',path:[],static:true});
}
const STEP = 6;
const cell = p => ({x:Math.round(p.x/STEP),y:Math.round(p.y/STEP)});
const key = p => `${p.x},${p.y}`;
function freeCell(p) {
 const base=cell(p);
 for(let r=0;r<5;r++)for(let x=-r;x<=r;x++)for(let y=-r;y<=r;y++){
  const q={x:base.x+x,y:base.y+y};
  if(!solid({x:q.x*STEP,y:q.y*STEP},'campus',1.2))return q;
 }
 return base;
}
export function findPath(from,to) {
 const start=freeCell(from),goal=freeCell(to),open=[start],seen=new Map([[key(start),{g:0,parent:null,p:start}]]);
 let found=null;
 for(let loops=0;open.length&&loops<16000;loops++){
  open.sort((a,b)=>seen.get(key(b)).g+Math.abs(b.x-goal.x)+Math.abs(b.y-goal.y)-seen.get(key(a)).g-Math.abs(a.x-goal.x)-Math.abs(a.y-goal.y));
  const p=open.pop(),pk=key(p),node=seen.get(pk);
  if(pk===key(goal)){found=node;break;}
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const q={x:p.x+dx,y:p.y+dy},qk=key(q);
   if(solid({x:q.x*STEP,y:q.y*STEP},'campus',1.2)||seen.has(qk))continue;
   seen.set(qk,{g:node.g+1,parent:node,p:q});open.push(q);
  }
 }
 const route=[];
 while(found?.parent){route.push({x:found.p.x*STEP,y:found.p.y*STEP});found=found.parent;}
 return route.reverse();
}
export function morningPost(i) { const main=BUILDINGS.find(b=>b.id==='main'); return {x:main.x+main.w/2+[-18,-10,10,18][i-8],y:main.y+main.d+9}; }
export function seedNPCs(state) {
 if(!state.npcs.length)state.npcs=PEOPLE.map(([id,name,department,role,personality,dialogue],i)=>({id,name,department,role,personality,dialogue,scene:'campus',x:GATE.x+(i%4-1.5)*8,y:GATE.y-10-Math.floor(i/4)*8,...(i>=8?morningPost(i):{}),activity:'등교 중',path:[]}));
 for(const npc of representativeNPCs())if(!state.npcs.some(n=>n.id===npc.id))state.npcs.push(npc);
}
export function npcDestination(npc,state) {
 const i=state.npcs.findIndex(p=>p.id===npc.id);
 // 최종전을 이긴 뒤에는 모두 운동장으로 모여 춤을 춘다.
 if(state.story?.bossDefeated)return {...partySpot(i,state.npcs.length),id:'party',activity:'운동장 축하 파티',dance:true};
 if(state.day===4&&state.flags.bossStarted&&(npc.id!=='homeroom'||state.quests.homeroom)&&(!npc.id.startsWith('tour-')||state.quests.tour?.[npc.id.slice(5)]===true))return {x:580+(i%7)*20,y:340+Math.floor(i/7)*15,id:'field',activity:'운동장 응원',assemble:true};
 if(npc.static)return {id:npc.homeScene,x:npc.homeX,y:npc.homeY,activity:npc.id==='homeroom'?'1학년 교실 · 조회 안내':'시설 안내',static:true};
 if(state.time<520&&i>=8&&i<12)return {...morningPost(i),id:'gate',activity:'아침 인사 · 생활지도'};
 if(state.time>=schoolEnd(state.day)){
  if(['ji','su'].includes(npc.id))return npc.id==='ji'?{x:640,y:340,id:'field',activity:'방과 후 축구 연습'}:{...BUILDINGS.find(b=>b.id==='gym').door,id:'gym',activity:'방과 후 슛 연습',interior:{x:55,y:72}};
  if(['seo','yu','ha'].includes(npc.id)||state.day===2)return {x:409+(i%3)*12,y:351,id:'shelter',activity:state.day===2?'장이쉼터에서 산책 이야기':'무지개 벤치에서 쉬는 중'};
  const hall=BUILDINGS.find(b=>b.id==='jangseong');
  return {...hall.door,id:hall.id,activity:'방과 후 자유 활동',interior:{x:24+(i%3)*22,y:72}};
 }
 if(getPeriod(state.time,state.day).type==='break'&&state.day===2&&npc.role==='student')return {x:409+(i%3)*12,y:351,id:'shelter',activity:'수요일 작은 산책'};
 if(state.time>=700&&state.time<750)return {...BUILDINGS.find(b=>b.id==='cafeteria').door,id:'cafeteria',activity:'급식 먹으러 가는 중'};
 if(getPeriod(state.time,state.day).type==='club'&&npc.role==='student')return {...BUILDINGS.find(b=>b.id==='jangseong').door,id:'jangseong',activity:'수요일 동아리 활동',interior:{x:24+(i%3)*22,y:72}};
 const b=BUILDINGS.find(b=>b.id===npc.department);
 const onBreak=getPeriod(state.time,state.day).type==='break';
 return {...b.door,id:b.id,activity:onBreak?'쉬는 시간 · 복도에서 친구와 이야기':state.time<520?'교실로 등교 중':'실습 수업',interior:{x:15+(i%4)*22,y:onBreak?80:72}};
}
export function updateNPCs(state,dt) {
 for(const npc of state.npcs){
  npc.moving=false;
  const dest=npcDestination(npc,state);npc.activity=dest.activity;
  npc.dance=!!dest.dance&&npc.scene==='campus'&&Math.hypot(npc.x-dest.x,npc.y-dest.y)<7;
  if(dest.static||dest.assemble){Object.assign(npc,{scene:dest.assemble?'campus':dest.id,x:dest.x,y:dest.y,destination:dest.id,path:[]});continue;}
  if(npc.destination!==dest.id){
   if(npc.scene!=='campus'){
    const old=BUILDINGS.find(b=>b.id===npc.scene);if(old){npc.x=old.door.x;npc.y=old.door.y;}npc.scene='campus';
   }
   npc.destination=dest.id;npc.path=findPath(npc,dest);
  }
  if(npc.scene!=='campus'){
   if(dest.interior){const dx=dest.interior.x-npc.x,dy=dest.interior.y-npc.y,d=Math.hypot(dx,dy);if(d>.2){const x=npc.x,y=npc.y,step=Math.min(d,dt*5);moveBody(npc,dx/d*step,dy/d*step,npc.scene,1.1);npc.moving=Math.hypot(npc.x-x,npc.y-y)>.01;}}
   continue;
  }
  const waypoint=npc.path?.[0];
  if(waypoint){const dx=waypoint.x-npc.x,dy=waypoint.y-npc.y,d=Math.hypot(dx,dy),step=Math.min(d,dt*8);if(d<1)npc.path.shift();else{const x=npc.x,y=npc.y;moveBody(npc,dx/d*step,dy/d*step,'campus',1.1);npc.moving=Math.hypot(npc.x-x,npc.y-y)>.01;}}
  else if(BUILDINGS.some(b=>b.id===dest.id)&&Math.hypot(npc.x-dest.x,npc.y-dest.y)<14){npc.scene=dest.id;npc.x=15+(PEOPLE.findIndex(p=>p[0]===npc.id)%4)*22;npc.y=72;npc.activity=dest.id==='cafeteria'?'점심 식사':'실습 참여';}
 }
}
