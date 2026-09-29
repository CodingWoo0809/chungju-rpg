// 네 학과(전기 · 토목 · 기계 · 건축)의 탐방 설명 · 교육과정 표 · 확인 문제 3개는 dept-curriculum.js 한곳에서 관리한다(Revision 80).
import {DEPT_TOUR_QUIZ} from './dept-curriculum.js';
export const TOUR_PLACES=[
 {id:'electric',name:'전기전자과',role:'전기전자과 과부장 선생님',intro:DEPT_TOUR_QUIZ.electric.intro,quiz:DEPT_TOUR_QUIZ.electric},
 {id:'civil',name:'토목시스템과',role:'토목시스템과 과부장 선생님',intro:DEPT_TOUR_QUIZ.civil.intro,quiz:DEPT_TOUR_QUIZ.civil},
 {id:'machine',name:'자동화기계과',role:'자동화기계과 과부장 선생님',intro:DEPT_TOUR_QUIZ.machine.intro,quiz:DEPT_TOUR_QUIZ.machine},
 {id:'architecture',name:'건축디자인과',role:'건축디자인과 과부장 선생님',intro:DEPT_TOUR_QUIZ.architecture.intro,quiz:DEPT_TOUR_QUIZ.architecture},
 {id:'career',name:'취업지원부',role:'취업지원 상담선생님',intro:'취업지원부는 나에게 맞는 진로와 취업을 준비하도록 돕는 곳이에요. 관심 분야를 이야기하고 자기소개서와 면접을 연습하거나, 실습에서 만든 포트폴리오를 함께 살펴볼 수 있어요.'},
 {id:'gym',name:'장성관',role:'체육선생님',intro:'장성관은 날씨에 상관없이 몸을 움직이고 운동을 배우는 공간이에요. 농구처럼 함께하는 운동에서는 규칙과 협력이 중요하지요. 몸을 충분히 풀고 주변을 살피며 즐겨 보세요.'},
 {id:'jangseong',name:'승리관',role:'복싱부 관장님',intro:'승리관에서는 복싱부가 기초 체력과 발 움직임, 자세를 훈련해요. 복싱은 힘만 겨루는 운동이 아니라 집중력과 상대를 존중하는 태도를 함께 기르는 운동이랍니다.'},
 {id:'cafeteria',name:'급식소',role:'영양교사',intro:'급식소는 학교생활에 필요한 에너지를 채우는 곳이에요. 영양교사는 균형 잡힌 식단과 위생을 살피지요. 손을 씻고 질서를 지키며 다양한 음식을 골고루 먹어 보세요.'}
];
export function tourCount(s){return TOUR_PLACES.filter(p=>s.quests.tour?.[p.id]===true).length;}
// HUD '현재 목표' 한 줄(Revision 81 · 학생 피드백). 퀘스트 판정은 바꾸지 않고 s.quests · 시각만 읽는다.
//   조회 전                → 본관 1학년 교실로 이동(첫날 08:40 전에는 조회를 기다리는 안내)
//   조회 완료 뒤 · 탐방 중  → 학교 탐방 N / 8(탐방 기록과 같은 수)
//   그 뒤(8곳 완료 · 금요일 최종전 · 축하 파티)는 예전 안내 문구를 그대로 쓴다.
// 조회를 마치기 전에는 '학교 탐방 0 / 8' 을 먼저 보여주지 않는다.
export const HOMEROOM_NOTICE='아침 조회 — 먼저 본관 1학년 교실로 이동하세요.';
export const HOMEROOM_DONE='아침 조회 완료! 이제 학교를 둘러보며 8곳의 탐방 장소를 모두 방문하세요.';
export function questGoal(s){
 if(!s.quests.homeroom){
  if(s.day===0&&s.time<520)return {goal:'08:40 아침 조회 기다리기',detail:'조회가 시작되면 본관 1학년 교실로 가요. 그동안 교문 주변을 둘러보세요.',stage:'before-homeroom'};
  return {goal:'본관 1학년 교실로 이동',detail:'본관 정문 → 왼쪽 계단 → 2층 1학년 교실의 담임선생님',stage:'homeroom'};
 }
 const count=tourCount(s);
 if(s.story.bossDefeated||s.day===4&&s.time>=860||count===8)return {goal:questHint(s),detail:'',stage:'later'};
 return {goal:`학교 탐방 ${count} / 8`,detail:'각 건물에 들어가 선생님과 대화하세요!',stage:'tour'};
}
export function questHint(s){
 if(!s.quests.homeroom)return s.day===0&&s.time<520?'08:40 조회 안내를 기다리며 교문 주변을 둘러보세요.':'조회 · 본관 정문 → 왼쪽 계단 → 2층 1학년 교실의 담임선생님';
 const count=tourCount(s);
 if(s.story.bossDefeated)return '운동장 축하 파티 중 · 학교를 마음껏 둘러보고, 준비되면 메뉴에서 게임 종료를 누르세요.';
 if(s.day===4&&s.time>=860&&!s.story.bossDefeated)return '금요일 최종전 · 운동장으로 가세요. 탐방은 원하는 만큼 계속할 수 있어요.';
 return count===8?'전공 통달 · R 최고 스킬 해금 · 금요일 방과후 운동장에서 만나요.':`학교 탐방 ${count}/8 · 각 건물에 들어가 선생님과 대화하세요!`;
}
