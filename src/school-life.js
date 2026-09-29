import {gain} from './inventory.js';

const DAYS=[
 '아직은 낯설어도 괜찮아. 오늘은 이름부터 기억하자.',
 '어제보다 실습실 가는 길이 익숙해졌어.',
 '오늘 6~7교시는 동아리 활동이야. 어떤 활동이 마음에 들어?',
 '이번 주에 가장 재미있었던 실습은 뭐였어?',
 '벌써 금요일이네. 같이 보낸 시간이 기억에 남을 것 같아.'
];
export function friendLine(state,npc){
 return (npc.dialogue||'오늘도 네 속도로 지내렴.')+' '+DAYS[state.day];
}
export function greet(state,npc){
 const key=`talk:${state.day}:${npc.id}`;
 if(state.flags[key])return;
 state.flags[key]=true;
 state.relations[npc.id]=(state.relations[npc.id]||0)+1;
 gain(state,'life',2);
}
