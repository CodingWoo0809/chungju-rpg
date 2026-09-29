import {addItem,gain,ITEMS} from './inventory.js';
import {COIN_ID} from './enhancement.js';

const EXHIBITS={
 main:{name:'학생 공동 작품 기록',art:'archive',intro:'학생들이 함께 만든 모형의 사진과 제작 메모가 놓여 있다.',detail:'설계로 배치를 정하고, 기계로 움직임을 만들고, 회로를 연결하고, 튼튼한 기반을 마련했다. 여러 학과가 함께 배운 결과다.',note:'학생 메모: 완성품뿐 아니라 함께 의논하고 수정한 과정도 기록해 두자.'},
 career:{name:'선배들의 포트폴리오 진열대',art:'portfolio',intro:'완성 사진 옆에 지운 선과 실패한 시제품 사진도 붙어 있다. 첫 장에는 좋아하는 일을 적어 보는 빈 메모지가 보인다.',detail:'한 포트폴리오는 문제 발견 → 시도 → 실패 원인 → 수정 → 결과 순서로 이어진다. 결과만 남기지 않고 선택한 이유와 배운 점을 기록했다.',note:'선배의 메모: 오늘 즐거웠던 실습 하나를 기억해 두기. 다른 학과를 둘러본 경험도 내가 좋아하는 일을 찾는 단서가 된다.'},
 dreamhall:{name:'발표 무대의 조명 조절대',art:'stage',intro:'작은 조명 세 개가 무대 가운데를 향한다. 조절대에는 발표, 공연, 정리 세 장면의 메모가 붙어 있다.',detail:'발표할 때는 말하는 사람과 자료가 함께 보여야 한다. 공연할 때는 중심 장면에 시선이 모이도록 밝기를 나누고, 정리할 때는 통로를 밝힌다.',note:'무대 담당 메모: 발표자만 무대를 만드는 건 아니다. 조명, 음향, 객석 안내를 맡은 친구들이 함께 준비한다.'},
};
// Revision 79: 네 과실(전기 · 기계 · 건축 · 토목)의 옛 체험 모형(빛이 흐르는 회로 모형 · 톱니 감속기 단면 모형 ·
// 햇빛 드는 교실 축소 모형 · 높이가 다른 지반의 교량 모형)은 이름 · F 상호작용 · 첫 발견 보상을 없애고,
// 같은 자리 · 같은 모습의 비상호작용 전시 모형(decor)으로만 남긴다. 옛 강화용 '장비대'(forge)는 그림 · 물체 · 이름까지 모두 뺐다.
const CLASS_MODELS={electric:'circuit',machine:'gears',architecture:'model',civil:'bridge'};
export function roomObjects(scene){
 if(CLASS_MODELS[scene])return [{id:`model-${scene}`,type:'decor',art:CLASS_MODELS[scene],x:78,y:11,w:23,d:13,solid:false,interactive:false}];
 const exhibit=EXHIBITS[scene];if(!exhibit)return [];
 const position=scene==='career'?{x:13,y:13}:scene==='main'?{x:78,y:20}:{x:78,y:11};
 return [{id:`exhibit-${scene}`,type:'exhibit',name:exhibit.name,art:exhibit.art,...position,w:23,d:13,solid:false}];
}
function nearby(game,id){
 const object=roomObjects(game.state.scene).find(o=>o.id===id&&o.type==='exhibit');
 if(!object)return null;
 const player=game.state.player;
 return Math.hypot(player.x-(object.x+object.w/2),player.y-(object.y+object.d+2))<9?object:null;
}
function showExhibit(game,object,detail=false,reward=''){
 const entry=EXHIBITS[game.state.scene],ui=game.ui;
 ui.show(`${ui.header(entry.name)}<span class="eyebrow">교내 발견 · ${detail?'작품 속 생각':'천천히 둘러보기'}</span><p>${detail?entry.detail:entry.intro}</p>${detail?`<p class="subtle">${entry.note}</p>`:''}${reward?`<p role="status">${reward}</p>`:''}<p><button data-action="room-inspect" data-value="${object.id}:${detail?'overview':'detail'}">${detail?'모형 설명으로':'구조와 제작 메모 살펴보기'}</button></p>`);
}
export function handleRoomInteraction(game,target){
 if(target?.type!=='exhibit')return false;
 const object=nearby(game,target.id);if(!object)return true;
 const state=game.state,key=`explore:${object.id}`;let reward='이미 발견한 작품입니다. 언제든 다시 살펴볼 수 있어요.';
 if(!state.flags[key]){
  state.flags[key]=true;gain(state,'life',2);
  const itemId=COIN_ID;                                            // 첫 발견 보상: 옛 강화 재료 1개 → 충공 코인 1개(2026-09-27)
  const stored=addItem(state,itemId);
  if(!stored)state.drops.push({id:`reward-${object.id}`,itemId,quantity:1,scene:state.scene,x:state.player.x,y:state.player.y});
  reward=`새로운 발견! 생활 숙련 +2. ${ITEMS[itemId].name} 1개${stored?'를 챙겼습니다.':'가 발밑에 놓였습니다. 가방을 비운 뒤 F로 주워 주세요.'}`;
  game.save();
 }
 showExhibit(game,object,false,reward);return true;
}
export function handleRoomAction(game,action,value){
 if(action!=='room-inspect')return false;
 if(typeof value!=='string')return true;
 const [id,mode]=value.split(':');const object=nearby(game,id);
 if(object&&['detail','overview'].includes(mode))showExhibit(game,object,mode==='detail');
 return true;
}
