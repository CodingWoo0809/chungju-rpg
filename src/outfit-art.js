// ── 옷 장비 적용(브라우저) (2026-09-27) ──────────────────────────────
// 입은 옷(state.armor)에 맞춰 홍길동 스프라이트 시트를 옷을 입은 시트로 바꿔 준다.
//   · 시트 픽셀은 outfit-paint.js 가 칠한다(옷 영역 전체를 다시 칠하므로 기본 교복이 비치지 않는다).
//   · 새 시트는 원래 시트와 크기 · 프레임 배치 · 프레임 경계(bounds)가 완전히 같다. 그래서 몸 크기 · 발 위치 · 손 위치(무기)
//     · 스윙/찌르기 공격의 부위 자르기(player-attack-art.js)가 모두 그대로 맞는다.
//   · 왼쪽 방향은 오른쪽 프레임을 좌우로 뒤집어 그리므로, 글자 · 왼가슴 C 같은 좌우가 있는 무늬는 왼쪽용 시트를 따로 칠한다.
//   · 한 번 칠한 시트는 캐시한다. 옷을 입으면(또는 불러온 저장 파일에 옷이 있으면) 나머지 시트를 쉬는 틈에 미리 칠해 두고,
//     아직 안 칠한 시트가 바로 필요하면 그 자리에서 칠한다 — 어떤 경우에도 기본 교복 프레임을 대신 보여 주지 않는다.
import {segmentFrame,paintSheet,paintFrame} from './outfit-paint.js';
import {ARM_RIG} from './outfit-rig.js';
import {OUTFITS} from './outfits.js';
import {headSheet,paintHelmetFrame,paintHelmetSheet} from './helmet-paint.js';
import {HELMETS} from './helmets.js';

export const SHEET_VIEW={idle:'front',walk:'front',attack:'front',right:'right',rightWalk:'right',rightAttack:'right',backWalk:'back',backAttack:'back'};
const bases=new Map();                     // 시트 키 → {img, data, width, height, segs}
const dressed=new Map();                   // '옷|투구|시트|방향' → {img(원본), sheet(옷 · 투구를 입은 시트)}

// 스윙/찌르기 공격(player-attack-art.js)이 몸통 · 팔을 잘라 오는 원본 프레임(player-attack-pose.js ATTACK_SOURCE 와 같은 값).
// 오른쪽 보기 3번 프레임은 먼 팔이 가슴 뒤에 숨어 있어서, 팔을 가슴 픽셀에서 잘라 온다. 그래서 이 프레임만
//   · armImg  : 두 팔 캡슐을 모두 소매로 칠한 판(팔 조각용 — 먼 팔도 소매 색이 된다)
//   · torsoImg: 팔 캡슐을 몸통으로 칠한 판(몸통 조각용 — 제자리 팔의 소매 자국이 몸통에 남지 않는다)
// 을 따로 칠해 둔다. 크기 · 경계는 원래 시트와 같고, 알파(실루엣)는 바꾸지 않는다.
export const RIG_SOURCE={idle:0,backWalk:0,right:3};

export function hasOutfit(armor){return !!OUTFITS[armor];}
// 투구(2026-09-27): 머리 픽셀을 투구로 다시 칠한다(helmet-paint.js). 옷과 같은 시트에 함께 칠한다.
export function hasHelmet(helmet){return !!HELMETS[helmet];}
export function outfitVariants(key){return SHEET_VIEW[key]==='right'?['right','left']:[SHEET_VIEW[key]];}

function rigVariant(base,key,recipe,side,flags,helmet=null){
 const f=RIG_SOURCE[key],{data,width,height}=base;
 const rig=ARM_RIG[key][Math.min(f,ARM_RIG[key].length-1)].map(a=>{const b=a.slice();b[6]=flags;if(flags)b[7]=Math.max(b[7],16);return b;});
 const view=SHEET_VIEW[key];
 const seg=segmentFrame(data,width,f*height,height,rig,view==='left'?'right':view);
 const out=new Uint8ClampedArray(data);
 paintFrame(data,out,width,f*height,seg,recipe,side);
 if(helmet)paintHelmetFrame(out,width,f*height,base.segs[f],headsOf(base,key)[f],helmet,side);
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 canvas.getContext('2d').putImageData(new ImageData(out,width,height),0,0);
 return canvas;
}

// 원본 시트 픽셀과 프레임별 영역 나누기. 영역 나누기가 칠하기보다 몇 배 무거워서, 프레임 하나씩 따로 캐시하고
// 게임을 시작하면(옷이 없어도) 쉬는 틈에 한 프레임씩 미리 해 둔다 — 옷을 입는 순간에는 칠하기만 남는다.
function readBase(key,sheet){
 const cached=bases.get(key);
 if(cached&&cached.img===sheet.img)return cached;
 const {img}=sheet,canvas=document.createElement('canvas');
 canvas.width=img.naturalWidth||img.width;canvas.height=img.naturalHeight||img.height;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
 const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
 const base={img,data,width:canvas.width,height:canvas.height,frames:Math.max(1,Math.round(canvas.width/canvas.height)),segs:[]};
 bases.set(key,base);return base;
}
function segmentOne(base,key,f){
 const rig=ARM_RIG[key];
 return base.segs[f]||=segmentFrame(base.data,base.width,f*base.height,base.height,rig[Math.min(f,rig.length-1)],SHEET_VIEW[key]);
}
function allSegments(base,key){for(let f=0;f<base.frames;f++)segmentOne(base,key,f);return base.segs;}
// 프레임별 머리 기하(투구용). 시트마다 한 번.
function headsOf(base,key){return base.heads||=headSheet(allSegments(base,key),SHEET_VIEW[key]);}

// 옷 · 투구를 입은 시트. 둘 다 없거나 지원하지 않는 시트면 null. 옷 없이 투구만, 투구 없이 옷만도 된다.
// 투구가 없을 때의 결과는 옷만 칠한 Revision 70 결과와 픽셀까지 같다.
export function dressedSheet(key,sheet,armor,helmet,side=SHEET_VIEW[key]){
 const recipe=OUTFITS[armor]||null,hat=HELMETS[helmet]||null;
 if((!recipe&&!hat)||!sheet?.img||!ARM_RIG[key]||!SHEET_VIEW[key])return null;
 const id=`${recipe?armor:'-'}|${hat?helmet:'-'}|${key}|${side}`,hit=dressed.get(id);
 if(hit&&hit.img===sheet.img)return hit.sheet;
 const base=readBase(key,sheet);
 const segs=allSegments(base,key);
 const pixels=recipe?paintSheet(base.data,base.width,base.height,segs,recipe,side):new Uint8ClampedArray(base.data);
 if(hat)paintHelmetSheet(pixels,base.width,base.height,segs,headsOf(base,key),hat,side);
 const canvas=document.createElement('canvas');canvas.width=base.width;canvas.height=base.height;
 canvas.getContext('2d').putImageData(new ImageData(pixels,base.width,base.height),0,0);
 const result={...sheet,img:canvas,outfit:recipe?armor:null,helmet:hat?helmet:null};
 if(recipe&&key in RIG_SOURCE){            // 스윙/찌르기에서 처음 쓸 때 칠한다(미리 칠하기 대기열도 채워 둔다)
  let arm=null,torso=null;
  Object.defineProperty(result,'armImg',{enumerable:true,get:()=>arm||=rigVariant(base,key,recipe,side,3,hat)});
  Object.defineProperty(result,'torsoImg',{enumerable:true,get:()=>torso||=rigVariant(base,key,recipe,side,0,hat)});
 }
 dressed.set(id,{img:sheet.img,sheet:result});
 return result;
}
// 옷만 입은 시트(Revision 70 이름 그대로).
export function outfitSheet(key,sheet,armor,side=SHEET_VIEW[key]){return hasOutfit(armor)?dressedSheet(key,sheet,armor,null,side):null;}

// pickPlayerFrame 이 고른 프레임을 옷 · 투구를 입은 시트로 바꾼다(프레임 번호 · 좌우 반전 · 공격 자세 등 나머지는 그대로).
export function dressPlayerFrame(visual,armor,helmet=null){
 if(!visual||(!hasOutfit(armor)&&!hasHelmet(helmet)))return visual;
 const sheet=dressedSheet(visual.key,visual.sheet,armor,helmet,visual.dir==='left'?'left':SHEET_VIEW[visual.key]);
 return sheet?{...visual,sheet}:visual;
}

// 쉬는 틈에 한 조각씩 미리 해 둔다: ① 원본 시트의 프레임별 영역 나누기(옷과 상관없이 한 번) ② 입은 옷 · 투구의 시트 칠하기
// ③ 스윙/찌르기용 팔 · 몸통 판. 조각 하나는 한 프레임 정도의 짧은 일이다. sheets: 시트 키 → 불러온 시트.
// 자주 쓰는 순서(서 있기 → 걷기 → 공격)로 한다. 아직 안 된 시트가 바로 필요하면 그 자리에서 만든다.
const WARM_ORDER=['idle','walk','rightWalk','backWalk','right','attack','rightAttack','backAttack'];
let warmQueue=[],warmTimer=0;
export function warmOutfit(armor,sheets,helmet=null){
 if(!sheets)return;
 const keys=WARM_ORDER.filter(key=>sheets[key]?.img);
 const jobs=[];
 for(const key of keys){
  const base=bases.get(key),frames=ARM_RIG[key].length;
  for(let f=0;f<frames;f++)if(!(base&&base.img===sheets[key].img&&base.segs[f]))jobs.push(()=>segmentOne(readBase(key,sheets[key]),key,f));
 }
 if(hasOutfit(armor)||hasHelmet(helmet)){
  for(const key of keys)for(const side of outfitVariants(key))jobs.push(()=>dressedSheet(key,sheets[key],armor,helmet,side));
  if(hasOutfit(armor))for(const key of keys.filter(key=>key in RIG_SOURCE))for(const side of outfitVariants(key))for(const part of ['armImg','torsoImg'])
   jobs.push(()=>{const sheet=dressedSheet(key,sheets[key],armor,helmet,side);if(sheet)void sheet[part];});
 }
 warmQueue=jobs;
 const step=()=>{
  warmTimer=0;
  const job=warmQueue.shift();if(!job)return;
  job();
  if(warmQueue.length)warmTimer=setTimeout(step,16);
 };
 clearTimeout(warmTimer);if(warmQueue.length)warmTimer=setTimeout(step,16);
}
