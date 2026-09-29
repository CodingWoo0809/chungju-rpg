import {friendLine,greet} from './school-life.js';
import {esc,DAYS} from './ui.js';

export function showFriend(game,target){
 const s=game.state,n=s.npcs.find(n=>n.id===target.id);if(!n)return;
 greet(s,n);
 game.ui.show(`${game.ui.header(esc(n.name))}<span class="eyebrow">${esc(n.activity||n.personality||'학교에서의 하루')}</span><p>${esc(friendLine(s,n))}</p><p><button data-action="life-journal">나의 학교생활 일지</button></p>`);
 game.save();
}
export function showJournal(game){
 const s=game.state;
 const days=Array.from({length:s.day+1},(_,day)=>{
  const names=s.npcs.filter(n=>s.flags[`talk:${day}:${n.id}`]).map(n=>esc(n.name));
  return `<section class="life-entry"><h3>${DAYS[day]}${day===s.day?' · 오늘':''}</h3><p>${names.length?names.join(', ')+'와 이야기를 나눴습니다.':'아직 기록한 대화가 없습니다. 마음 가는 곳을 자유롭게 둘러보세요.'}</p></section>`;
 });
 game.ui.show(`${game.ui.header('나의 학교생활 일지')}<p>친구와 나눈 대화를 기억하는 일지입니다. 대화와 자유 활동은 원하는 때 즐기세요.</p><p><button class="primary" data-action="tour-journal">학교 탐방 안내 · 진행 상황</button></p><div class="life-journal">${days.join('')}</div>`);
}
export function handleLifeAction(game,action){
 if(!action.startsWith('life-'))return false;
 if(action==='life-journal')showJournal(game);
 return true;
}
