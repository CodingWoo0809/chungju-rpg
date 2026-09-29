import {enhanceEquipped} from './inventory.js';
// ── J 나의 장비 · 강화 버튼 처리 (2026-09-27) ──────────────────
// 실습실 장비대의 강화 창은 없앴다. 강화는 J 창의 칸별 카드(ui.js gear)에서 착용한 장비에만 한다.
// 한 번 누르면 코인 차감 · 판정 · 결과가 한 번씩 일어나고, 연출(ENHANCE_EFFECT_MS) 동안에는 모든 입력을 막는다
// (game.enhanceLock — actions.js handleAction 맨 앞에서 확인한다. 빠른 연타 · Esc 도 무시된다).
export const ENHANCE_EFFECT_MS=720;
export function runEnhancement(game,slot,rng=Math.random,schedule=setTimeout){
 if(game.enhanceLock||!game.state)return true;
 const s=game.state,result=enhanceEquipped(s,slot,rng);
 if(!result.ok){game.ui.toast(result.message);game.ui.gear(s);return true;}
 game.enhanceLock=true;
 game.ui.gear(s,{slot:result.slot,success:result.success,level:result.level,cost:result.cost});
 game.save?.();game.audio?.play(result.success?'success':'step');
 schedule(()=>{game.enhanceLock=false;if(game.ui.dialog?.open!==false)game.ui.gear(game.state);},ENHANCE_EFFECT_MS);
 return true;
}
export function showSound(game){
 const p=game.audio.settings();
 game.ui.show(`${game.ui.header('캠퍼스의 소리')}<p>바람 같은 잔잔한 배경음과 짧은 활동 소리. 메뉴와 다른 탭에서는 조용히 멈춥니다.</p><div class="stack">${[['mute','전체 음소거'],['music','배경 음악'],['effects','활동 효과음']].map(([key,label])=>`<button data-action="sound-toggle" data-value="${key}" aria-pressed="${p[key]}">${label}: ${p[key]?'켜짐':'꺼짐'}</button>`).join('')}</div><p>전체 음량 ${Math.round(p.volume*100)}%</p><div class="row">${[0,.1,.22,.4,.65].map(v=>`<button data-action="sound-volume" data-value="${v}" class="${p.volume===v?'selected':''}">${Math.round(v*100)}%</button>`).join('')}</div>`);
}
export function handleProgressionAction(game,action,value){
 if(action==='enhance')return runEnhancement(game,value);
 if(action==='sound'){showSound(game);return true;}
 if(action==='sound-toggle'){game.audio.set(value,!game.audio.settings()[value]);showSound(game);return true;}
 if(action==='sound-volume'){game.audio.set('volume',Number(value));showSound(game);return true;}
 return false;
}
