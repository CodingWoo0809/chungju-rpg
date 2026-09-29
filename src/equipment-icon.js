// ── 장비 아이콘 (2026-09-27) ─────────────────────────────────
// 가방 · J 나의 장비 · 수위실 구매 · 수위실 판매에서 장비 이름 왼쪽에 같은 작은 정사각형 아이콘을 쓴다.
// 새 그림을 만들지 않고 바닥에 떨어진 장비를 그리는 그림(loot-art.js lootShape — 무기는 weapon-art.js 의 실제 무기 그림,
// 옷은 개어 놓은 상의, 투구는 안전모 형태)을 그대로 작은 캔버스에 옮겨 그린다.
//   · HTML 에는 <canvas data-icon="아이템id"> 자리만 넣고(equipmentIconHTML), 창을 그린 직후 ui.show() 가
//     paintEquipmentIcons 로 한꺼번에 칠한다.
//   · 그림마다 실제로 칠해진 범위를 한 번 재서(measure) 가운데에 같은 여백으로 맞춘다 — 장비가 잘리거나 너무 커지지 않는다.
//   · 테두리 색은 기존 등급 색(보통 회색 · 희귀 파랑 · 영웅 보라 · 레전드 주황)을 얇게만 쓴다.
import {ITEMS,RARITY_ORDER} from './inventory.js';
import {lootShape} from './loot-art.js';

export const ICON_PX=32;          // 화면에서의 한 변(px). 캔버스는 선명하게 2배 해상도로 그린다.
const RES=2;
const isGear=id=>ITEMS[id]?.type==='gear';
const attr=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// 이름 왼쪽에 넣을 아이콘 자리. 장비가 아니면 빈 문자열.
export function equipmentIconHTML(id){
 if(!isGear(id))return '';
 const rarity=Math.max(0,RARITY_ORDER.indexOf(ITEMS[id].rarity));
 return `<canvas class="gear-icon r${rarity}" data-icon="${attr(id)}" width="${ICON_PX*RES}" height="${ICON_PX*RES}" aria-hidden="true"></canvas>`;
}

// 그림이 실제로 차지하는 범위(그림 좌표). 이미지(글러브 · 라켓)가 아직 안 불러와졌으면 null — 캐시하지 않고 다음에 다시 잰다.
const fits=new Map();
const FALLBACK={cx:0,cy:-2,span:16};
export function measureIcon(id){
 if(fits.has(id))return fits.get(id);
 if(typeof document==='undefined'||!document.createElement)return null;
 const N=200,k=6,canvas=document.createElement('canvas');canvas.width=canvas.height=N;
 const c=canvas.getContext?.('2d',{willReadFrequently:true});
 if(!c?.getImageData)return null;
 c.translate(N/2,N/2);c.scale(k,k);lootShape(id)(c,0);
 const data=c.getImageData(0,0,N,N).data;
 let x0=N,y0=N,x1=-1,y1=-1;
 for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(data[(y*N+x)*4+3]>12){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
 if(x1<0)return null;
 const fit={cx:((x0+x1+1)/2-N/2)/k,cy:((y0+y1+1)/2-N/2)/k,span:Math.max(x1-x0+1,y1-y0+1)/k};
 fits.set(id,fit);return fit;
}

// 캔버스 하나에 장비 아이콘을 그린다. 실제 범위를 쟀으면 true, 임시 크기로 그렸으면 false.
export function renderEquipmentIcon(canvas,id){
 const c=canvas?.getContext?.('2d');
 if(!c||!isGear(id))return false;
 const size=canvas.width||ICON_PX*RES,pad=size*.13;
 const measured=measureIcon(id),fit=measured||FALLBACK,k=(size-pad*2)/fit.span;
 c.setTransform?.(1,0,0,1,0,0);c.clearRect(0,0,size,size);
 c.save();c.translate(size/2,size/2);c.scale(k,k);c.translate(-fit.cx,-fit.cy);lootShape(id)(c,0);c.restore();
 return !!measured;
}

// root 안의 모든 아이콘 자리를 칠한다. 이미지가 늦게 불러와진 장비는 잠시 뒤 몇 번 더 칠한다.
export function paintEquipmentIcons(root,retries=6){
 const canvases=[...(root?.querySelectorAll?.('canvas[data-icon]')||[])];
 let pending=false;
 for(const canvas of canvases)if(!renderEquipmentIcon(canvas,canvas.dataset.icon))pending=true;
 if(pending&&retries>0&&typeof setTimeout==='function')setTimeout(()=>paintEquipmentIcons(root,retries-1),250);
 return canvases.length;
}
