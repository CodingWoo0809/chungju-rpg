// 본관 층 정의.
// side: east=복도 동쪽(운동장 쪽) 방 / west=복도 서쪽 방 / north=복도 끝에서 정면으로 보이는 방.
// 서쪽 방은 건물 안쪽(x 0~24)에 들어앉고, 복도 벽면(=창문 라인) WX 에 문만 낸다. 외관은 반듯한 직육면체를 유지한다.
export const WX=24;
const east=(id,name,y,d,kind='office')=>({id,name,side:'east',x:46,y,w:62,d,kind,doorY:y+d*.65,inner:{x:50,y:y+d*.65}});
// hidden=true 인 방은 복도에서 문과 명패만 보이고 내부를 그리지 않는다(교직원 화장실).
const west=(id,name,y,d,kind='office',hidden=false)=>({id,name,side:'west',x:0,y,w:WX,d,kind,hidden,doorY:y+d*.5,inner:{x:20,y:y+d*.5}});
const north=(id,name,y,d,kind,doorX=34)=>({id,name,side:'north',x:0,y,w:112,d,kind,doorX,doorY:y+d,inner:{x:doorX,y:y+d-6}});
export const MAIN_FLOORS={
 // openings = 계단실 입구(그래픽). 계단 몸체와 정확히 같은 구간이라 벽 그림과 충돌이 어긋나지 않는다.
 main:{level:1,name:'본관 1층',w:112,d:700,wx:WX,openings:[[636,652],[368,384]],rooms:[
  west('parcel-room','택배 보관실',654,36,'parcel'),
  east('documents','문서실',588,42,'archive'),
  east('student-affairs','학생부',534,50),
  east('evaluation','평가실',488,42,'archive'),
  east('meeting','회의실',430,54,'meeting'),
  west('staff-wc-women','교직원 여자화장실',436,26,'toilet',true),
  east('administration','행정실',312,48),
  west('staff-wc-men','교직원 남자화장실',312,24,'toilet',true),
  west('print','인쇄실',340,24,'print'),
  east('principal','교장실',264,44),
  east('information','교육정보부',216,44),
  east('neulpureun-2','늘푸른2반',166,46,'classroom'),
  east('neulpureun-1','늘푸른1반',58,46,'classroom'),
  west('student-wc','화장실',62,28,'toilet'),
  north('library','도서관',4,44,'library')
 ],lobbies:[
  {id:'front',name:'정문 현관',y:634,d:62},
  {id:'central',name:'중앙현관',y:364,d:62,west:[390,406],east:[386,416]},
  {id:'east',name:'동편현관',y:108,d:54,west:[126,142],east:[126,142]}
 ]},
 'main-2':{level:2,name:'본관 2층',w:112,d:260,wx:0,rooms:[east('classroom-1','1학년 교실',150,62,'classroom'),east('faculty','본교무실',85,62),east('health','보건실',20,62,'health')],lobbies:[{id:'stairhall',name:'2층 계단홀',y:215,d:42}]},
 'main-3':{level:3,name:'본관 3층',w:112,d:190,wx:0,rooms:[east('classroom-2','2학년 교실 · 우리 반',30,95,'classroom')],lobbies:[{id:'stairhall',name:'3층 계단홀',y:130,d:57}]}
};
export function mainFloor(scene){return MAIN_FLOORS[scene]||null;}
export function mainBounds(scene){const f=mainFloor(scene);return f?{w:f.w,d:f.d}:null;}
export function mainSpawn(doorId){
 if(doorId==='main:right')return {x:88,y:392};          // 중앙현관 우측(운동장) 입구
 if(doorId==='main:right-east')return {x:78,y:138};     // 동편현관 우측(운동장) 입구
 if(doorId==='main:left')return {x:34,y:134};           // 동편현관 좌측 입구
 if(doorId==='main:left-central')return {x:34,y:398};   // 중앙현관 좌측 입구
 return {x:36,y:678};                                   // 정문
}
export function transitionInterior(state,targetScene,spawn){if(!mainFloor(targetScene))return false;state.scene=targetScene;Object.assign(state.player,spawn);state.player.path=[];return true;}
// dir = 올라가는 방향. 계단은 모두 벽에 붙여 두었다.
// 계단 몸체는 벽과 똑같이 막혀 있고(solid) 상호작용은 하지 않는다. F 안내는 아래 stairPad 가 맡는다.
function stair(id,x,y,w,d,dir,targetScene,spawn,name,closet=false,mouth=null){return {id,x,y,w,d,dir,closet,mouth,type:'stairs',targetScene,spawn,name,solid:true,interactive:false};}
// 계단 바로 앞 복도에 놓이는 상호작용 판. 충돌은 없고(solid:false) 그리지도 않는다.
// nearest() 는 후보를 (x+w/2, y+d+2) 로 옮겨 보므로, 그 점이 계단 입구 정면에 오도록 크기를 잡는다.
function stairPad(s){
 const mouth=s.mouth||'+x';
 const cx=mouth==='+x'?s.x+s.w+4:mouth==='-x'?s.x-4:s.x+s.w/2;
 const cy=mouth==='+y'?s.y+s.d+4:mouth==='-y'?s.y-4:s.y+s.d/2;
 return {id:s.id+'-pad',type:'stairs',pad:true,solid:false,name:s.name,
  targetScene:s.targetScene,spawn:s.spawn,x:cx-4,y:cy-6,w:8,d:4};
}
// 계단 한 벌 = 막힌 몸체 + 그 앞의 상호작용 판.
function stairSet(...defs){const out=[];for(const s of defs)out.push(s,stairPad(s));return out;}
function exit(id,x,y,doorId,name){return {id,x,y,w:10,d:3,type:'exit',doorId,name};}
function roomContents(r){
 if(r.hidden)return [];   // 교직원 화장실: 복도에서 문과 명패만 보인다
 const result=[],push=(id,type,x,y,w,d)=>result.push({id:r.id+'-'+id,name:r.name,x,y,w,d,type,solid:true,interactive:false});
 const x0=r.x+(r.side==='west'?2:r.side==='north'?10:12);
 if(r.kind==='classroom'){for(let i=0;i<6;i++)push('desk'+i,'desk',x0+(i%2)*27,r.y+13+Math.floor(i/2)*Math.min(20,(r.d-17)/3),10,6);}
 else if(r.kind==='library'){for(let i=0;i<6;i++)push('shelf'+i,'shelf',x0+i*16,r.y+6,11,7);push('table','desk',x0+30,r.y+22,26,10);}
 else if(r.kind==='archive'){for(let i=0;i<3;i++)push('shelf'+i,'shelf',x0+1+i*17,r.y+5,10,7);}
 else if(r.kind==='health'){result.push({id:'nurse',name:'보건실에서 쉬기',x:76,y:38,w:22,d:10,type:'nurse',solid:true});}
 else if(r.kind==='meeting')push('table','desk',x0+8,r.y+10,25,18);
 else if(r.kind==='toilet'){for(let i=0;i<3;i++)push('stall'+i,'stall',r.x+2,r.y+3+i*6,9,5);push('basin','basin',r.x+12,r.y+4,7,4);}
 else if(r.kind==='print')push('copier','copier',r.x+3,r.y+4,11,9);
 else if(r.kind==='parcel'){
  result.push({id:'parcels',type:'parcel',name:'택배 보관함',x:r.x+2.5,y:r.y+4,w:18,d:7,solid:true,interactive:false});
  push('rack','shelf',r.x+3,r.y+22,11,7);
 }
 else {push('desk','desk',x0+8,r.y+8,23,9);push('cabinet','shelf',x0+34,r.y+5,9,9);}
 return result;
}
function roomWalls(r){
 const out=[],wall=(id,x,y,w,d,hidden=false)=>out.push({id:r.id+'-'+id,type:'wall',x,y,w,d,hidden,solid:true,interactive:false});
 if(r.side==='north'){
  wall('front-a',r.x,r.y+r.d-1.5,r.doorX-6-r.x,1.5);
  wall('front-b',r.doorX+6,r.y+r.d-1.5,r.x+r.w-r.doorX-6,1.5);
  wall('back',r.x,r.y,r.w,1.5);
  return out;
 }
 const face=r.side==='west'?r.x+r.w-1.5:r.x;
 wall('wall-a',face,r.y,1.5,Math.max(1,r.doorY-6-r.y));
 wall('wall-b',face,r.doorY+6,1.5,Math.max(1,r.y+r.d-r.doorY-6));
 wall('partition',r.x,r.y,r.w,1.5,r.hidden);   // 내부를 안 그리는 방은 칸막이도 감춘다(충돌은 유지)
 wall('end',r.x,r.y+r.d,r.w,1.5,r.hidden);
 return out;
}
// 복도 서쪽 벽: 서쪽 방의 문과 현관 입구만 뚫려 있고 나머지는 창문이 있는 막힌 벽이다.
export function westOpenings(f){
 const open=[];
 for(const r of f.rooms)if(r.side==='west')open.push([r.doorY-6,r.doorY+6]);
 for(const h of f.lobbies)if(h.west)open.push([h.west[0],h.west[1]]);
 for(const o of f.openings||[])open.push([o[0],o[1]]);   // 벽 안으로 들어간 계단실 입구
 return open.sort((a,b)=>a[0]-b[0]);
}
function runsBetween(openings,d){
 const runs=[];let y=0;
 for(const [a,b] of openings){if(a>y)runs.push([y,a]);y=Math.max(y,b);}
 if(y<d)runs.push([y,d]);
 return runs;
}
export function westWallRuns(f){return f.wx?runsBetween(westOpenings(f),f.d):[[0,f.d]];}
// 충돌용 서쪽 벽. 실제로 걸어서 지나갈 수 있는 곳은 서쪽 방의 문뿐이다.
// 현관 유리문과 계단실 입구는 그림만 열려 있고 몸은 지나가지 못한다(벽 안쪽으로 새는 길을 막는다).
export function westWallCollisionRuns(f){
 if(!f.wx)return [];
 const open=f.rooms.filter(r=>r.side==='west').map(r=>[r.doorY-6,r.doorY+6]).sort((a,b)=>a[0]-b[0]);
 return runsBetween(open,f.d);
}
function createObjects(scene,f){
 const objects=[];
 for(const r of f.rooms){objects.push(...roomWalls(r));objects.push(...roomContents(r));}
 if(f.wx)for(const [a,b] of westWallCollisionRuns(f))objects.push({id:`west-wall-${a}`,type:'wall',x:f.wx-1.5,y:a,w:1.5,d:b-a,solid:true,interactive:false});
 if(scene==='main')objects.push(
  ...stairSet(
   // 1) 정문 계단은 택배 보관실 바로 오른쪽, 서쪽 벽에 붙는다.
   stair('front-up',WX-14,636,14,16,'-x','main-2',{x:26,y:230},'2층으로 · 정문 계단',false,'+x'),
   // 2) 중앙 계단은 중앙현관 좌측 입구와 인쇄실 사이, 서쪽 벽에 붙는다. 아래에는 창고.
   stair('central-up',WX-14,368,14,16,'-x','main-2',{x:26,y:106},'2층으로 · 중앙 계단',true,'+x'),
   // 3) 동편 계단은 우측 입구를 바라볼 때 왼쪽(-y 쪽), 동쪽 벽에 붙는다.
   stair('east-up',94,109,14,16,'+x','main-2',{x:26,y:18},'2층으로 · 동편 계단',false,'-x')),
  exit('exit',31,690,'main:front','정문으로 나가기'),
  exit('exit-right',97,392,'main:right','중앙현관 우측 입구로 나가기'),
  exit('exit-central-left',26,394,'main:left-central','중앙현관 좌측 입구로 나가기'),
  exit('exit-east',26,130,'main:left','동편현관 좌측 입구로 나가기'),
  exit('exit-east-right',97,134,'main:right-east','동편현관 우측 입구로 나가기')
 );
 if(scene==='main-2')objects.push(...stairSet(
  stair('front-down',0,220,14,18,'+x','main',{x:56,y:668},'1층으로 · 정문 계단',false,'+x'),
  // 본교무실 앞으로 옮긴 중앙 계단과 3층 계단
  stair('central-down',0,96,14,18,'+x','main',{x:56,y:390},'1층으로 · 중앙 계단',false,'+x'),
  stair('third-up',0,122,14,18,'-x','main-3',{x:34,y:157},'3층으로 올라가기',false,'+x'),
  stair('east-down',0,8,14,16,'-x','main',{x:66,y:140},'1층으로 · 동편 계단',false,'+x')
 ));
 if(scene==='main-3')objects.push(...stairSet(stair('second-down',7,143,14,22,'-y','main-2',{x:26,y:132},'2층으로 내려가기',false,'+y')));
 return objects;
}
const OBJECTS=Object.fromEntries(Object.entries(MAIN_FLOORS).map(([id,f])=>[id,createObjects(id,f)]));
export function mainFurniture(scene){return OBJECTS[scene]||[];}
