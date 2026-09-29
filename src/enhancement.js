// ── 장비 강화 규칙표 (2026-09-27 · 충공 코인 강화) ──────────────────
// 강화는 J '나의 장비'에서 지금 착용한 무기 · 옷 · 투구에만 한다. 재료는 충공 코인 하나뿐이다.
// 이 파일은 표와 순수 계산만 가진다(ITEMS 를 읽지 않는다). 실제 강화 처리는 inventory.js 의 enhanceEquipped.
//
// 규칙
//   · 단계마다 성공 확률과 필요한 코인이 정해져 있다. 시도할 때마다 독립 판정이며 천장(보정)은 없다.
//   · 실패해도 코인만 쓰고 단계는 그대로다 — 하락 · 파괴 · 능력치 손실 · 확률 누적 · 초기화 없음.
//   · 능력치 = 기본값 × 그 단계의 누적 배율. 단계마다 곱을 쌓지 않고(복리 아님) 표의 값을 그대로 쓴다.
//   · 강화 단계는 장비 '개체'마다 따로 둔다(가방 칸의 level, Revision 81). 같은 이름의 장비가 여러 개여도 단계를 공유하지 않는다.
//     옛 state.flags['upgrade:아이템id'] 는 불러올 때 한 개체(착용 중인 것, 없으면 첫 번째)로만 옮기고 지운다(inventory.js syncGear).

export const COIN_ID='chungCoin';

// 칸별 최대 단계.
export const MAX_LEVEL=Object.freeze({weapon:7,armor:5,helmet:5});

// [현재 단계] → 다음 단계로 가는 {성공 확률, 필요한 코인}. 무기 +0→+1 … +6→+7.
const WEAPON_STEPS=[[1,1],[.95,1],[.85,2],[.7,3],[.5,4],[.35,5],[.2,6]];
// 옷 · 투구 +0→+1 … +4→+5.
const DEFENSE_STEPS=[[1,1],[.9,1],[.7,2],[.5,3],[.3,4]];
const steps=rows=>Object.freeze(rows.map(([chance,cost])=>Object.freeze({chance,cost})));
export const ENHANCE_TABLE=Object.freeze({weapon:steps(WEAPON_STEPS),armor:steps(DEFENSE_STEPS),helmet:steps(DEFENSE_STEPS)});

// 누적 배율(인덱스 = 강화 단계).
export const WEAPON_POWER_MULT=Object.freeze([1,1.05,1.10,1.18,1.28,1.40,1.55,1.75]);   // 무기 공격력 · 모든 등급
export const WEAPON_SPEED_MULT=Object.freeze([1,1.01,1.02,1.04,1.06,1.09,1.13,1.18]);   // 공격속도 · 영웅 · 레전드만
export const DEFENSE_MULT=Object.freeze([1,1.06,1.13,1.22,1.34,1.50]);                   // 옷 · 투구 방어력
export const HELMET_PASSIVE_MULT=Object.freeze([1,1.05,1.10,1.18,1.28,1.40]);            // 영웅 · 레전드 투구 부가 능력
// 투구 부가 능력 이름. 지금 ITEMS 의 투구에는 이 값이 하나도 없다(구조만 준비 — 값이 생기면 자동으로 배율이 붙는다).
export const HELMET_PASSIVES=Object.freeze({precision:'정밀',cooldownReduction:'재사용 대기시간 감소'});
// 공격속도 강화를 받는 무기 등급.
export const SPEED_RARITIES=Object.freeze(['영웅','레전드']);

export function maxLevel(slot){return MAX_LEVEL[slot]??0;}
// 저장된 값을 안전한 단계로 읽는다. 정수가 아니거나 음수면 0, 최대를 넘으면 최대.
export function clampLevel(slot,value){
 if(!Number.isInteger(value)||value<0)return 0;
 return Math.min(value,maxLevel(slot));
}
// 지금 단계에서 다음 단계로 가는 규칙. 최대 단계면 null.
export function nextStep(slot,level){return ENHANCE_TABLE[slot]?.[level]??null;}
const mult=(table,level)=>table[Math.max(0,Math.min(table.length-1,level|0))];
export const weaponPowerMultiplier=level=>mult(WEAPON_POWER_MULT,level);
export const weaponSpeedMultiplier=level=>mult(WEAPON_SPEED_MULT,level);
export const defenseMultiplier=level=>mult(DEFENSE_MULT,level);
export const helmetPassiveMultiplier=level=>mult(HELMET_PASSIVE_MULT,level);

// 강화 판정 한 번. rng 는 [0,1) 을 돌려주는 함수(테스트에서 바꿔 끼운다). 확률 1 이면 반드시 성공.
export function rollEnhancement(chance,rng=Math.random){return rng()<chance;}

// 일반 몬스터 충공 코인(Revision 78): 항상 1개 이상. 한 번 굴려 3개 60% · 2개 20% · 1개 20%(평균 2.4개).
// 결과 수만큼 1개짜리 pickup 을 따로 떨어뜨린다(combat.js). 보스는 따로 50개(boss 보상).
export const COIN_DROP=Object.freeze({counts:Object.freeze([[3,.6],[2,.2],[1,.2]])});
export function rollCoinCount(rng=Math.random){
 let r=rng();
 for(const [count,chance] of COIN_DROP.counts){if(r<chance)return count;r-=chance;}
 return 1;
}

// 화면 표시: 정수면 정수, 아니면 소수 첫째 자리까지(내부 값은 그대로 실수).
export function formatStat(value){
 if(!Number.isFinite(value))return '0';
 const rounded=Math.round(value*10)/10;
 return Number.isInteger(rounded)?String(rounded):rounded.toFixed(1);
}
