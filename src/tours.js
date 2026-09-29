import {TOUR_PLACES,tourCount,questHint,questGoal,HOMEROOM_DONE} from './tour-data.js';
import {rewardTour,progression} from './growth.js';
import {ITEMS} from './inventory.js';
import {greet} from './school-life.js';
import {esc} from './ui.js';
import {NO_PRACTICAL,CURRICULUM_HEAD,QUIZ_WRONG,QUIZ_RIGHT} from './dept-curriculum.js';
function activeNPC(game){
 const s=game.state,n=s.npcs.find(n=>n.id===game.tourNPC);
 return n&&n.scene===s.scene&&Math.hypot(n.x-s.player.x,n.y-s.player.y)<9?n:null;
}
export function showTourNPC(game,target){
 if(target.id!=='homeroom'&&!target.id.startsWith('tour-'))return false;
 game.tourNPC=target.id;const n=activeNPC(game);if(!n)return true;
 const s=game.state;greet(s,n);
 if(n.id==='homeroom'){
  if(s.quests.homeroom){game.ui.show(`${game.ui.header('담임선생님')}<p>실습실과 시설을 천천히 둘러보렴. 궁금한 점은 그곳의 선생님께 물어보면 된단다.</p><button data-action="tour-journal">탐방 안내 보기</button>`);return true;}
  if(s.day===0&&s.time<520){game.ui.toast('조회는 08:40부터 시작합니다. 교실을 둘러보며 잠시 기다려 주세요.');return true;}
  game.ui.show(`${game.ui.header('1학년 교실 · 아침 조회')}<p>담임선생님: 길동아, 충주공고에 온 걸 환영한다. 오늘은 1교시를 준비하고, 틈틈이 학교의 여러 공간을 둘러보자.</p><p>네 학과를 포함한 네 실습실과 취업지원부, 장성관, 승리관, 급식소의 선생님을 만나 보렴. 방문 순서는 네가 정하면 돼.</p><button class="primary" data-action="tour-homeroom">조회 마치고 1교시 준비하기</button>`);return true;
 }
 const place=TOUR_PLACES.find(p=>'tour-'+p.id===n.id);if(!place)return true;
 if(!s.quests.homeroom){game.ui.show(`${game.ui.header(place.role)}<p>${place.intro}</p><p class="subtle">본관 2층 1학년 교실에서 담임선생님과 조회를 마치면 탐방 기록을 시작할 수 있어요. 조회를 놓쳤어도 선생님을 찾아가면 됩니다.</p>`);return true;}
 if(place.quiz){
  // 네 학과 과부장(Revision 80): 인사 · 교육과정 표 → 확인 문제 3개. 이미 완료했다면 짧은 인사와 '교육과정 다시 보기'만.
  if(s.quests.tour?.[place.id])game.ui.show(`${game.ui.header(place.role)}<span class="eyebrow">학교 탐방 · ${place.name}</span><p>“우리 학과 탐방은 이미 완료했군요. 궁금한 게 생기면 언제든 다시 오렴.”</p><p class="life-complete">탐방 완료 · ${tourCount(s)}/8곳</p><button data-action="tour-curriculum">교육과정 다시 보기</button>`);
  else showCurriculum(game,place);
  game.save();return true;
 }
 game.ui.show(`${game.ui.header(place.role)}<span class="eyebrow">학교 탐방 · ${place.name}</span><p>${place.intro}</p>${s.quests.tour?.[place.id]?'<p class="life-complete">이미 탐방을 완료한 장소입니다. 언제든 다시 찾아오세요.</p>':'<button class="primary" data-action="tour-next">설명을 듣고 탐방 기록하기</button>'}`);
 game.save();return true;
}
// ── 학과 교육과정 안내 · 확인 문제(Revision 80, 내용은 dept-curriculum.js) ─────────────────
// 진행 상태 game.tourQuiz = {id, index(지금 풀 문제 0~2), feedback(정답 설명을 보여 주는 중)} — 저장하지 않는 대화 상태다.
// 오답이면 같은 문제를 다시 풀고, 이미 맞힌 문제는 되돌리지 않는다. 같은 과부장에게 다시 말을 걸면 이어서 푼다.
const MARKS=['①','②','③','④'];
function curriculumTable(quiz){
 return `<table class="curriculum"><thead><tr>${CURRICULUM_HEAD.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${quiz.rows.map(([key,value])=>`<tr><th scope="row">${esc(key)}</th><td${value===NO_PRACTICAL?' class="none"':''}>${esc(value)}</td></tr>`).join('')}</tbody></table><p class="curriculum-note">${esc(quiz.note)}</p>`;
}
function quizState(game,place){
 if(game.tourQuiz?.id!==place.id)game.tourQuiz={id:place.id,index:0,feedback:false};
 return game.tourQuiz;
}
function quizProgress(place,index){
 const total=place.quiz.questions.length;
 return `<div class="quiz-progress"><span class="eyebrow">문제 ${index+1} / ${total}</span><span class="quiz-dots" aria-hidden="true">${Array.from({length:total},(_,i)=>`<i class="${i<index?'done':i===index?'now':''}"></i>`).join('')}</span></div>`;
}
function showCurriculum(game,place){
 const s=game.state,done=!!s.quests.tour?.[place.id],quiz=place.quiz,st=game.tourQuiz?.id===place.id?game.tourQuiz:null;
 const button=done?'':`<button class="primary" data-action="tour-next">${st?.index?`확인 문제 이어서 풀기 · ${st.index+1} / ${quiz.questions.length}`:`확인 문제 ${quiz.questions.length}개 풀기`}</button>`;
 game.ui.show(`${game.ui.header(place.role)}<span class="eyebrow">학교 탐방 · ${place.name} · 교육과정 한눈에 보기</span><p class="tour-greeting">“${esc(quiz.greeting)}”</p><p>${esc(quiz.intro)}</p>${curriculumTable(quiz)}<p class="subtle">실무과목 편제표를 바탕으로 한 안내입니다(학교의 전체 교과목 목록이 아닙니다).</p>${button}`);
}
function showQuestion(game,place,message=''){
 const st=quizState(game,place),q=place.quiz.questions[st.index];st.feedback=false;
 game.ui.show(`${game.ui.header(place.name+' · 교육과정 확인 문제')}${quizProgress(place,st.index)}<p class="quiz-prompt">${esc(q.prompt)}</p>${message?`<p class="quiz-wrong" role="status">${esc(message)}</p>`:''}<div class="stack quiz-choices">${q.choices.map((choice,i)=>`<button class="quiz-choice" data-action="tour-answer" data-value="${st.index}:${i}"><b>${MARKS[i]}</b><span>${esc(choice)}</span></button>`).join('')}</div><div class="row quiz-tools"><button class="ghost" data-action="tour-curriculum">교육과정 다시 보기</button></div>`);
}
function showRight(game,place,index){
 const total=place.quiz.questions.length;
 game.ui.show(`${game.ui.header(place.name+' · 교육과정 확인 문제')}${quizProgress(place,index)}<p class="quiz-right" role="status"><strong>${QUIZ_RIGHT}</strong> ${esc(place.quiz.questions[index].feedback)}</p><button class="primary" data-action="tour-quiz-next">다음 문제 · ${index+2} / ${total}</button>`);
}
function showComplete(game,place,lead=''){
 const s=game.state,count=tourCount(s);
 game.ui.show(`${game.ui.header(place.quiz?`[${place.name} 탐방 완료!]`:place.name+' 탐방 완료')}${lead}<p>학교의 새로운 공간을 알게 되었습니다. 탐방 경험치 +100 · ${count}/8곳 완료.</p><p>${count===8?'3학년 / 전공 통달 단계에 도달했습니다! 선택 학과의 최고 스킬을 R로 사용하세요.':count===4?'선택 학과 무기를 받았습니다. 가방에서 착용해 보세요.':count===2?'선택 학과 방어구를 받았습니다. 가방에서 착용해 보세요.':'다음 장소는 자유롭게 골라 보세요.'}</p><p class="subtle">가방이 가득 차면 보상은 보관됩니다. 가방에 여유가 생긴 뒤 다시 열면 받습니다.</p><div class="row"><button class="primary" data-action="tour-journal">탐방 안내</button><button data-action="inventory">가방 열기</button></div>`);
}
export function completeTour(s,id){
 if(!s.quests.homeroom||!TOUR_PLACES.some(p=>p.id===id)||s.quests.tour?.[id])return false;
 s.quests.tour??={};s.quests.tour[id]=true;rewardTour(s,id);return true;
}
// 학교 탐방 안내(Revision 83): 8곳을 카드 4열 × 2행으로 한눈에(좁은 화면은 2열 · 1열). 카드에는 장소 · 완료 여부 · 짧은 설명만.
// 진행 요약은 실제 탐방 기록(s.quests.tour · progression)에서 매번 다시 읽는다. 지도 · 성장 · 일지는 오른쪽 위 퀵 메뉴로 연다(여기에 버튼 없음).
// 요약 아래 한 줄: 탐방 중이면 요약과 겹치는 'N/8' 없이 할 일만, 그 밖에는 HUD 와 같은 '현재 목표'.
function tourHint(s){const q=questGoal(s);return q.stage==='tour'?q.detail:`현재 목표: ${q.goal}${q.detail?' · '+q.detail:''}`;}
export function tourCardNote(p){return p.quiz?'과부장 선생님 · 교육과정 안내 및 확인 문제 3개':`${p.role} · 시설 안내`;}
export function showTourJournal(game){
 const s=game.state,g=progression(s),done=tourCount(s);
 const armor=ITEMS[g.armor]?.name||'전공 작업복',weapon=ITEMS[g.weapon]?.name||'무기';
 const cards=TOUR_PLACES.map(p=>{const ok=s.quests.tour?.[p.id]===true;
  return `<li class="tour-card${ok?' done':''}" data-place="${p.id}"><div class="tour-card-top"><strong>${esc(p.name)}</strong><span class="tour-state">${ok?'✓ 완료':'미완료'}</span></div><small>${esc(tourCardNote(p))}</small></li>`;}).join('');
 game.ui.show(`${game.ui.header('충주공고 탐방 안내')}<div class="tour-summary"><strong>학교 탐방 · ${done} / 8 완료</strong><span>${esc(g.stage)} · 탐방 경험치 ${g.xp}</span></div>
  <p class="subtle tour-hint">${esc(tourHint(s))}</p><ul class="tour-grid" aria-label="탐방 장소 8곳">${cards}</ul>
  <p class="subtle tour-foot">순서와 요일 제한은 없습니다. 보상 — 2곳: ${esc(armor)} · 4곳: ${esc(weapon)} · 8곳: 전공 통달과 최고 기술(R). 탐방할 때마다 숙련이 올라 공명 타격(Q) · 숨 고르기(E)도 열립니다.</p>`);
 game.ui.dialog?.classList?.add('wide');
}
export function handleTourAction(game,action,value){
 if(action==='tour-journal'){showTourJournal(game);return true;}
 if(!['tour-homeroom','tour-next','tour-answer','tour-curriculum','tour-quiz-next'].includes(action))return false;
 const n=activeNPC(game);if(!n)return true;
 const s=game.state;
 if(action==='tour-homeroom'){
  if(n.id!=='homeroom'||s.scene!=='main-2'||s.day===0&&s.time<520)return true;
  s.quests.homeroom=true;s.quests.tour??={};game.save();
  // Revision 81: 조회를 마친 직후 다음 할 일(8곳 탐방)을 분명히 알린다. 창을 닫으면 같은 문구가 위쪽 배너로 한 번 더 뜬다.
  game.ui.show(`${game.ui.header('조회 완료 · 1교시를 준비해요')}<p class="goal-lead"><strong>${HOMEROOM_DONE}</strong></p><p>현재 목표: 학교 탐방 ${tourCount(s)} / 8 · 수업에 참여하거나 쉬는 시간과 방과후에 원하는 장소부터 둘러보세요.</p><button class="primary" data-action="tour-journal">8곳 탐방 안내 받기</button>`);
  game.ui.banner?.(HOMEROOM_DONE,`현재 목표: 학교 탐방 ${tourCount(s)} / 8`);return true;
 }
 const place=TOUR_PLACES.find(p=>'tour-'+p.id===n.id);if(!place)return true;
 if(action==='tour-curriculum'){if(place.quiz&&s.quests.homeroom)showCurriculum(game,place);return true;}   // 완료 뒤에도 다시 볼 수 있다(진행도 변화 없음)
 if(!s.quests.homeroom||s.quests.tour?.[place.id])return true;
 if(place.quiz){
  const st=quizState(game,place),total=place.quiz.questions.length;
  if(action==='tour-next'){showQuestion(game,place);return true;}   // 정답 설명을 본 뒤 표를 다시 봤다면 다음 문제부터
  if(action==='tour-quiz-next'){if(st.feedback&&st.index<total)showQuestion(game,place);return true;}
  const [index,choice]=String(value).split(':').map(Number);
  if(st.feedback||index!==st.index)return true;                       // 지난 화면의 버튼 · 두 번 누르기는 무시
  if(choice!==place.quiz.questions[index].correct){showQuestion(game,place,QUIZ_WRONG);return true;}
  st.index++;
  if(st.index<total){st.feedback=true;showRight(game,place,index);return true;}
  if(completeTour(s,place.id)){game.tourQuiz=null;game.save();showComplete(game,place,`<p class="quiz-right" role="status"><strong>${QUIZ_RIGHT}</strong> ${esc(place.quiz.questions[index].feedback)}</p>`);}
  return true;
 }
 if(action!=='tour-next')return true;
 if(completeTour(s,place.id)){game.tourQuiz=null;game.save();showComplete(game,place);}
 return true;
}
