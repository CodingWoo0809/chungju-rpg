import {mainFloor,mainBounds,mainFurniture,mainSpawn} from './main-interior.js';
export {mainFloor,transitionInterior} from './main-interior.js';
import {CAMPUS_PROPS} from './campus-props.js';
import {roomObjects} from './room-content.js';
export const BOUNDARY = [{x:12,y:222},{x:520,y:42},{x:758,y:42},{x:777,y:503},{x:27,y:610}];
export const GATE = {x:514,y:537};
// 자동화기계과 우측 현관 ~ 전기전자과 좌·우측 입구 ~ 건축디자인과 뒤 비막이길을 잇는 동서 직선축.
// 건축디자인과 뒤에서 오는 기존 비막이길 walk-main(y 376~386)의 중심선을 그대로 축으로 삼는다 —
// 그래야 본관 쪽에서 온 통로가 전기전자과를 관통해 자동화기계과 현관까지 한 줄로 이어진다.
export const CORRIDOR_AXIS = 381;
export const BUILDINGS = [
 {id:'cafeteria',name:'급식소',x:39,y:211,w:100,d:53,h:22,color:'#9da78c',type:'meal'},
 {id:'dreamhall',name:'꿈키움홀',x:155,y:187,w:44,d:62,h:24,color:'#d9c9ae',type:'hall'},
 // 취업지원부에서 본 사진 · 승리관은 꿈키움홀보다 앞면이 뒤로 물러나 있고(249 → 224) 앞뒤 길이도 짧다.
 // 폭과 높이는 그대로 두어 광장에서의 존재감은 유지한다.
 // 내부 id 는 'jangseong' 그대로 둔다 — 저장 파일 · NPC 목적지 · 탐방 퀘스트가 id 로 묶여 있다.
 {id:'jangseong',name:'승리관',x:205,y:172,w:56,d:52,h:27,color:'#99a78c',type:'boxing'},
 {id:'career',name:'취업지원부',x:306,y:154,w:40,d:90,h:25,color:'#9daea0',type:'career'},
 {id:'civil',name:'토목시스템과',x:391,y:140,w:49,d:113,h:30,color:'#a9cec4',type:'class'},
 // 2026-09 · 실제로는 전기전자과와 나란히 긴 건물인데 북쪽이 72칸 짧아서, 비막이길 축(CORRIDOR_AXIS)
 // 위에 우측 현관을 놓으면 카페 증축부(북쪽 끝 38칸)와 겹쳤다. 카페 폭은 그대로 두고 중앙부만
 // 40칸 늘려(y 341→301, d 205→245) 현관이 축 위 본동 벽면에 오게 했다. 남쪽 끝(546)은 그대로.
 {id:'machine',name:'자동화기계과',x:191,y:301,w:48,d:245,h:29,color:'#c8b86b',type:'class'},
 {id:'electric',name:'전기전자과',x:275,y:269,w:41,d:277,h:29,color:'#789fad',type:'class'},
 {id:'architecture',name:'건축디자인과',x:379,y:389,w:70,d:120,h:15,color:'#b59172',type:'class'},
 {id:'main',name:'본관',x:473,y:130,w:52,d:337,h:43,color:'#7eaaa2',type:'main'},
 {id:'gym',name:'장성관',x:590,y:404,w:164,d:77,h:43,color:'#71a7af',type:'gym'}
// 자동화기계과/전기전자과 사이 출입구 배치 정정(2026-09).
// 실제 학교에서는 두 건물 사이가 비막이길 하나로 곧게 관통한다 — 건축디자인과 뒤에서 온 통로가
// 전기전자과를 통과해 자동화기계과 우측 현관에서 끝난다. 그래서 그 통로가 지나는 네 개의 문
// (machine:right · electric:left · electric:right)을 전부 같은 y(CORRIDOR_AXIS)에 놓아
// 하나의 동서 직선축을 이룬다. 두 건물 모두 실제로 없는 정면(남쪽) 출입구는 두지 않는다.
].map(b=>{const sides=b.id==='gym'?['left']:['machine','electric'].includes(b.id)?['right','left','back']:b.id==='architecture'?['right','back']:b.id==='main'?['front','right','left']:b.id==='civil'?['left']:['front'];const labels={front:'정면 출입구',right:'우측 출입구',left:'좌측 출입구',back:'후면 출입구'};const doors=sides.map(side=>({id:`${b.id}:${side}`,side,x:side==='right'?b.x+b.w+5:side==='left'?b.x-5:b.x+b.w/2,y:side==='front'?b.y+b.d+5:side==='back'?b.y-5:(b.id==='electric'||(b.id==='machine'&&side==='right'))?CORRIDOR_AXIS:b.y+b.d*(b.id==='main'&&side==='left'?.22:.5),width:b.id==='gym'?18:b.id==='main'&&['front','right'].includes(side)?14:b.id==='machine'&&side==='right'?11:6,label:b.id==='main'?{front:'정문',right:'중앙현관 우측 입구',left:'동편현관 좌측 입구'}[side]:labels[side]}));
 if(b.id==='main')doors.push(
  {id:'main:right-east',side:'right',x:b.x+b.w+5,y:b.y+b.d*.22,width:12,label:'동편현관 우측 입구'},
  {id:'main:left-central',side:'left',x:b.x-5,y:b.y+b.d*.745,width:12,label:'중앙현관 좌측 입구'});
 if(b.id==='machine')doors.push({id:'machine:right-front',side:'right',x:b.x+b.w+5,y:b.y+b.d-14,width:18,label:'도로 쪽 현관',interiorExit:{x:100,y:74},interiorSpawn:{x:98,y:78}});
 if(b.id==='electric')doors.push({id:'electric:left-front',side:'left',x:b.x-5,y:b.y+b.d-14,width:18,label:'도로 쪽 현관',interiorExit:{x:2,y:74},interiorSpawn:{x:12,y:76}});
 return {...b,doors,door:doors[0]};});
export const FIELD = {x:555,y:95,w:175,d:295};
// 인조잔디 축구장(FIELD) 안쪽은 몬스터 출현 금지 구역이다.
// 운동장에서 몬스터가 도는 곳은 잔디를 둘러싼 우레탄 트랙과 그 바깥뿐이다.
export const PITCH = FIELD;
export function onPitch(p, margin = 2) {
 return p.x > PITCH.x - margin && p.x < PITCH.x + PITCH.w + margin
     && p.y > PITCH.y - margin && p.y < PITCH.y + PITCH.d + margin;
}
export function building(id){return BUILDINGS.find(b=>b.id===(mainFloor(id)?'main':id));}
export function sceneBounds(scene){return mainBounds(scene)||{w:110,d:90};}
export function sceneName(scene){return scene==='campus'?'충주공고 · 캠퍼스':mainFloor(scene)?.name||building(scene)?.name||'학교';}
// 본관 외 건물도 출입구 방향마다 안쪽 문을 둔다. 우측으로 들어와 좌측으로 나가는 식의 관통이 가능하다.
const SIDE_EXIT={front:{x:51,y:86},back:{x:51,y:3},left:{x:2,y:44},right:{x:100,y:44}};
const SIDE_SPAWN={front:{x:55,y:80},back:{x:55,y:9},left:{x:12,y:45},right:{x:99,y:45}};
export function innerSpawn(side){return {...(SIDE_SPAWN[side]||SIDE_SPAWN.front)};}
export function buildingExits(b){
 const doors=b?.doors?.length?b.doors:[{side:'front'}];
 return doors.map((door,i)=>({id:i?'exit-'+door.id.split(':').at(-1):'exit',
  name:doors.length>1?`${door.label}${door.label.endsWith('현관')?'으로':'로'} 나가기`:'밖으로 나가기',
  ...(door.interiorExit||SIDE_EXIT[door.side]||SIDE_EXIT.front),w:8,d:3,type:'exit',doorId:door.id}));
}
export function enterBuilding(state,id,doorId){const b=building(id),door=b.doors.find(d=>d.id===doorId)||b.door;state.returnEntrance={buildingId:id,doorId:door.id};state.scene=id;Object.assign(state.player,id==='main'?mainSpawn(door.id):door.interiorSpawn||innerSpawn(door.side));}
export function leaveBuilding(state,doorId){const b=building(state.scene);if(doorId&&b.doors.some(d=>d.id===doorId))state.returnEntrance={buildingId:b.id,doorId};const door=state.returnEntrance?.buildingId===b.id?b.doors.find(d=>d.id===state.returnEntrance.doorId)||b.door:b.door;Object.assign(state.player,{x:door.x,y:door.y});state.scene='campus';delete state.returnEntrance;}
export function insidePolygon(p, polygon=BOUNDARY){let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if(((a.y>p.y)!==(b.y>p.y))&&(p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x))inside=!inside;}return inside;}
export function solid(p,scene='campus',r=1.6){if(scene!=='campus'){const b=sceneBounds(scene);return p.x<r||p.y<r||p.x>b.w-r||p.y>b.d-r||furniture(scene).some(o=>o.solid&&p.x>o.x-r&&p.x<o.x+o.w+r&&p.y>o.y-r&&p.y<o.y+o.d+r);}return !insidePolygon(p)||[...BUILDINGS,...CAMPUS_PROPS.filter(o=>o.solid)].some(b=>p.x>b.x-r&&p.x<b.x+b.w+r&&p.y>b.y-r&&p.y<b.y+b.d+r);}
/* Revision 81: 건물 벽 · 캠퍼스 바깥 경계만 본다(야외 무대 · 수돗가 같은 낮은 소품과 교실 가구는 빼고). R81 의 R 시야 판정용이었고, Revision 82 부터 R 은 시야를 보지 않아 전투 코드는 쓰지 않는다(테스트 · 도구용으로 남김). */
export function wallSolid(p,scene='campus',r=1.6){if(scene!=='campus'){const b=sceneBounds(scene);return p.x<r||p.y<r||p.x>b.w-r||p.y>b.d-r;}return !insidePolygon(p)||BUILDINGS.some(b=>p.x>b.x-r&&p.x<b.x+b.w+r&&p.y>b.y-r&&p.y<b.y+b.d+r);}
export function moveBody(body,dx,dy,scene='campus',r=1.6){if(!solid({x:body.x+dx,y:body.y},scene,r))body.x+=dx;if(!solid({x:body.x,y:body.y+dy},scene,r))body.y+=dy;}
export function furniture(scene){if(mainFloor(scene))return mainFurniture(scene);const b=building(scene);const rows=buildingExits(b);if(b?.type==='class'){/* Revision 79: 옛 과실 실습 미니게임 자리 — 같은 자리 · 같은 모습의 실습 책상(장치 모형 장식 포함, 이름 · F 상호작용 없음) */rows.push({id:'front-desk',name:'실습 책상',x:24,y:22,w:20,d:9,type:'desk',device:true,solid:true,interactive:false});for(let i=0;i<6;i++)rows.push({id:'desk'+i,name:'실습 책상',x:20+i%3*28,y:40+Math.floor(i/3)*20,w:16,d:8,type:'desk',solid:true});}else if(scene==='cafeteria'){rows.push({id:'meal',name:'오늘의 급식',x:20,y:15,w:65,d:10,type:'meal',solid:true});for(let i=0;i<4;i++)rows.push({id:'seat'+i,name:'급식 의자',x:20+i%2*45,y:42+Math.floor(i/2)*20,w:22,d:8,type:'bench',solid:true});}else if(scene==='gym'){rows.push({id:'hoop',name:'농구 골대',x:52,y:10,w:8,d:3,type:'hoop'});}else if(scene==='dreamhall'){rows.push({id:'hall',name:'꿈키움홀 둘러보기',x:38,y:20,w:34,d:12,type:'hall',solid:true});for(let i=0;i<4;i++)rows.push({id:'hallseat'+i,name:'홀 좌석',x:20+i%2*45,y:45+Math.floor(i/2)*20,w:22,d:6,type:'bench',solid:true});}else if(scene==='jangseong')rows.push({id:'boxing',name:'샌드백 훈련',x:40,y:30,w:8,d:8,type:'boxing',solid:true});else if(scene==='career')rows.push({id:'counsel',name:'진로 상담',x:45,y:30,w:22,d:10,type:'counsel',solid:true});else rows.push({id:'nurse',name:'보건실에서 쉬기',x:25,y:30,w:24,d:12,type:'nurse',solid:true});rows.push(...roomObjects(scene));return rows;}
export const OUTDOOR_OBJECTS=[{id:'jangi',name:'장이쉼터에서 쉬기',x:412,y:302,w:28,d:32,type:'shelter'},{id:'fountain',name:'음수대',x:556,y:407,w:5,d:4,type:'water'},
 // 대표 좌표가 수위실 한가운데(549,520)에 오도록 잡고, 건물 주위 어디서나 걸리게 반경을 넓혔다.
 {id:'shop',name:'수위실 상점 · 장비 사기',x:543,y:515,w:12,d:3,reach:19,type:'shop'}];
