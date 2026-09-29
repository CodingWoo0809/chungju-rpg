// 지금 대화해야 할 선생님을 바닥 유도선 + 느낌표로 알려주기 위한 목표 지점 계산.
// 퀘스트·상호작용 로직은 전혀 바꾸지 않고, 이미 있는 상태(s.quests, s.npcs)를 읽기만 한다.
import {building, furniture} from './world.js';

// 첫 미션(조회)은 아직 담임선생님이 있는 본관 2층에 들어가기도 전이라, 건물 밖에서부터
// "본관 정문 → (1층) 정문 계단 → (2층) 담임선생님" 순서로 유도한다. 그 외의 학교 탐방 선생님들은
// 각자의 건물 안에 들어간 뒤에만(요청대로) 유도선·느낌표를 보여준다.
export function questGuideTarget(state) {
 const s = state;
 if (!s.quests.homeroom) {
  if (s.day === 0 && s.time < 520) return null; // 08:40 전에는 교문 주변에서 기다리는 것이 맞다.
  if (s.scene === 'campus') {
   const door = building('main')?.doors.find(d => d.id === 'main:front');
   return door ? { x: door.x, y: door.y, npc: null } : null;
  }
  if (s.scene === 'main') {
   const pad = furniture('main').find(o => o.id === 'front-up-pad');
   return pad ? { x: pad.x + pad.w / 2, y: pad.y + pad.d / 2, npc: null } : null;
  }
  if (s.scene === 'main-2') {
   const n = s.npcs.find(n => n.id === 'homeroom');
   return n ? { x: n.x, y: n.y, npc: n } : null;
  }
  return null;
 }
 const n = s.npcs.find(n => n.scene === s.scene && n.id.startsWith('tour-') && !s.quests.tour?.[n.id.slice(5)]);
 return n ? { x: n.x, y: n.y, npc: n } : null;
}
