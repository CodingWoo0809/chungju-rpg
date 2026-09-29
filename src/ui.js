import {questGoal,tourCount} from './tour-data.js';
import {hpRatio,hpTone,lowHpWatch,LOW_HP_MESSAGE} from './hp-ui.js';
import {progression} from './growth.js';
import {sceneName} from './world.js';
import {CAMPUS_PROPS,TRAINING_YARD} from './campus-props.js';
import {ROOF_COLORS} from './roof-colors.js';
import {DEPARTMENTS,CONFIG} from './config.js';
import {isAdminBossTime} from './admin-mode.js';
import {ITEMS,equipmentLevel,SLOTS,SLOT_LABEL,SLOT_FIELD,RARITY_ORDER,playerStats,shopPoints,shopStock,coinCount,entryLevel,wornEntry,enhanceInfo,sellInfo} from './inventory.js';
import {equipmentIconHTML,paintEquipmentIcons} from './equipment-icon.js';
import {COIN_ID,formatStat,HELMET_PASSIVES,SPEED_RARITIES} from './enhancement.js';
import {getPeriod,SCHEDULE} from './clock.js';
import {skillStates,SKILL_SLOTS} from './skills.js';
import {resonanceSummary,isOwnDeptGear} from './dept-resonance.js';
import {CONTROL_GROUPS,START_CONTROLS,MENU_HOTKEYS,hotkeyLabel} from './controls.js';
import {BUILDINGS,BOUNDARY,FIELD} from './world.js';
export const DAYS=['월요일','화요일','수요일','목요일','금요일'];
export const THEMES=['첫 등교, 낯선 설렘','조금 더 가까워진 우리','마음 가는 대로','배움이 자신감이 되는 날','우리의 마지막 방과후'];
export const SKILLS={combat:'전투',sport:'운동',life:'학교생활',architecture:'건축디자인',machine:'자동화기계',electric:'전기전자',civil:'토목시스템'};
export function timeText(t){return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;}
export function esc(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
// ── 가방 탭 · J 강화 카드 (2026-09-27) ─────────────────────
export const BAG_TABS=[['all','전체'],['weapon','무기'],['armor','옷'],['helmet','투구'],['consumable','소모품']];
// 수위실 판매 목록 필터(장비만 — 소모품 판매 탭은 없다)와 상점 화면 기본 상태.
export const SELL_TABS=[['all','전체'],['weapon','무기'],['armor','옷'],['helmet','투구']];
export const SHOP_VIEW_DEFAULT=Object.freeze({tab:'weapon',sell:'all',confirm:null});
const percent=value=>`${formatStat(value*100)}%`;
// 카드에 보일 능력치 줄: [이름, 지금 값, 성공 시 값]. 공격속도는 기본 대비 %로 보인다.
function statLines(info){
 const now=info.current||{},next=info.next;
 const lines=[];
 if(info.slot==='weapon'){
  lines.push(['공격력',formatStat(now.power),next&&formatStat(next.power)]);
  if(SPEED_RARITIES.includes(info.item.rarity))lines.push(['공격속도',`+${percent(now.attackSpeed-1)}`,next&&`+${percent(next.attackSpeed-1)}`]);
 }else{
  lines.push(['방어력',formatStat(now.defense),next&&formatStat(next.defense)]);
  for(const [key,name] of Object.entries(HELMET_PASSIVES))if(now[key]!==undefined)lines.push([name,formatStat(now[key]),next&&formatStat(next[key])]);
 }
 return lines;
}
function enhanceFx(effect){
 if(effect.success){
  const coins=[[-70,58],[-38,70],[0,76],[36,70],[70,58],[-20,82]].map(([x,y],i)=>`<i class="fx-coin" style="--x:${x}px;--y:${y}px;--d:${i*40}ms"></i>`).join('');
  const sparks=[0,60,120,180,240,300].map((a,i)=>`<i class="fx-spark" style="--a:${a}deg;--d:${260+i*15}ms"></i>`).join('');
  return `<div class="enh-fx success" aria-live="polite">${coins}${sparks}<b>강화 성공! +${effect.level}</b></div>`;
 }
 const smoke=[[-52,22],[-18,30],[18,26],[54,18]].map(([x,y],i)=>`<i class="fx-smoke" style="--x:${x}px;--y:${y}px;--d:${i*70}ms"></i>`).join('');
 return `<div class="enh-fx fail" aria-live="polite">${smoke}<b>강화 실패</b><small>강화 단계 유지 · +${effect.level}</small></div>`;
}
// 학과 공명(Revision 79) — J 나의 장비의 작은 표시. 단계는 착용 장비에서 매번 계산한다.
function resonancePanel(s){
 const r=resonanceSummary(s),dept=DEPARTMENTS.find(d=>d.id===s.department)?.name||'';
 return `<section class="resonance res-${esc(s.department)}${r.level?' active':''}" aria-label="학과 공명 ${r.level} / 3"><div class="res-head"><strong>${esc(dept)} 공명</strong><span class="res-count">${r.level} / 3</span></div><ul>${r.tiers.map((t,i)=>`<li class="${t.on?'on':'off'}"><span>${'①②③'[i]} ${esc(t.text)}</span><b aria-label="${t.on?'활성':'잠김'}">${t.on?'✓':'🔒'}</b></li>`).join('')}</ul><small>내 학과 영웅 · 레전드 무기 · 옷 · 투구를 입을수록 강해집니다. 다른 학과 장비는 성능 그대로입니다.</small></section>`;
}
function enhanceCard(info,label,effect,own=false){
 const fx=effect&&effect.slot===info.slot?effect:null,locked=!!effect;
 const head=`<div class="enh-head"><span class="eyebrow">[${label}]</span>${info.item?`<span class="badge rar-${RARITY_ORDER.indexOf(info.item.rarity)}">${info.item.rarity}</span>`:''}</div>`;
 if(info.state==='empty')return `<section class="enh-card empty" data-slot="${info.slot}">${head}<strong class="enh-name">장착 없음</strong><small>가방(I)에서 장비를 착용하면 여기서 강화할 수 있습니다.</small><button data-action="enhance" data-value="${info.slot}" disabled>강화</button></section>`;
 const max=info.state==='max';
 const stats=statLines(info).map(([name,now,next])=>`<div><dt>${name}</dt><dd>${now}${!max&&next!==undefined?` <span class="enh-next">→ ${next}</span>`:''}</dd></div>`).join('');
 const odds=max?`<div class="enh-odds"><span class="enh-max">최대 강화</span><span>보유 코인 ${info.coins}</span></div>`
  :`<div class="enh-odds"><span>성공 확률 <strong>${percent(info.chance)}</strong></span><span>필요 코인 <strong>${info.cost}</strong> · 보유 ${info.coins}</span></div>`;
 const button=max?`<button data-action="enhance" data-value="${info.slot}" disabled>최대 강화</button>`
  :`<button class="primary" data-action="enhance" data-value="${info.slot}"${info.state==='ready'&&!locked?'':' disabled'}>강화 +${info.level+1}</button>`;
 const warn=info.state==='coins'?`<p class="enh-warn">충공 코인이 부족합니다<br>${info.shortfall}개 더 필요해요</p>`:'';
 return `<section class="enh-card${max?' maxed':''}${fx?(fx.success?' fx-success':' fx-fail'):''}" data-slot="${info.slot}">${head}<div class="enh-title">${equipmentIconHTML(info.id)}<strong class="enh-name">${esc(info.item.name)}${info.level?` +${info.level}`:''}</strong></div><div class="enh-level">+${info.level} / 최대 +${info.max}</div><dl class="enh-stats">${stats}</dl>${own?'<small class="res-tag">학과 공명 +5%</small>':''}${odds}${warn}${button}${fx?enhanceFx(fx):''}</section>`;
}
export class UI{
 constructor(action){this.action=action;this.dialog=document.querySelector('#dialog');this.content=document.querySelector('#dialogcontent');this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.action('close');});document.addEventListener('click',e=>{const b=e.target.closest('button[data-action]');if(b)this.action(b.dataset.action,b.dataset.value);});this.timer=0;this.markHotkeys();}
 // 오른쪽 위 퀵 메뉴에 실제 단축키를 붙인다(Revision 83). 키는 controls.js MENU_HOTKEYS 한 곳에서 읽는다 — 단축키가 없는 버튼(학교생활 일지 · 성장과 기록)에는 붙이지 않는다.
 markHotkeys(root=document){for(const b of root.querySelectorAll?.('.utilities button[data-action]')||[]){const keys=MENU_HOTKEYS[b.dataset.action];b.querySelector('kbd.hotkey')?.remove();if(!keys)continue;
  const k=document.createElement('kbd');k.className='hotkey';k.textContent=hotkeyLabel(keys[0]);k.setAttribute('aria-hidden','true');b.append(k);b.title=`단축키 ${keys.map(hotkeyLabel).join(' 또는 ')}`;b.setAttribute('aria-keyshortcuts',keys.map(x=>x==='escape'?'Escape':x.toUpperCase()).join(' '));}}
 toast(text){document.querySelector('#toast').textContent=text;clearTimeout(this.timer);this.timer=setTimeout(()=>{document.querySelector('#toast').textContent='';},4500);}
 // 창을 그릴 때마다 지금 보는 화면(view)을 비우고, 가방 · 상점이 다시 채운다. 장비 아이콘은 그린 직후 한꺼번에 칠한다.
 show(html,title=false){this.view=null;this.dialog.classList.toggle('title',title);this.dialog.classList.remove('wide','keys-intro','game-intro');this.content.innerHTML=html;paintEquipmentIcons(this.content);if(!this.dialog.open)this.dialog.showModal();this.content.querySelector('button')?.focus();}
 close(){this.view=null;this.dialog.close();this.flushBanner();}
 // 목표 알림 배너(Revision 81): 화면 위쪽 가운데에 잠깐(6.5초) 떠 있다가 사라진다. 게임을 멈추지 않는다.
 // 창(대화 · 메뉴)이 열려 있으면 가려지므로 창이 닫힐 때 띄운다.
 banner(title,text=''){this.pendingBanner={title,text};if(!this.dialog.open)this.flushBanner();}
 flushBanner(){const b=this.pendingBanner;if(!b||typeof document==='undefined')return;this.pendingBanner=null;
  let el=document.querySelector('#questbanner');
  if(!el){el=document.createElement('div');el.id='questbanner';el.className='questbanner';el.setAttribute('role','status');el.setAttribute('aria-live','polite');(document.querySelector('#app')||document.body).append(el);}
  el.innerHTML=`<strong>${esc(b.title)}</strong>${b.text?`<span>${esc(b.text)}</span>`:''}`;el.hidden=false;
  clearTimeout(this.bannerTimer);this.bannerTimer=setTimeout(()=>{el.hidden=true;},6500);}
 // 새 게임 시작 조작 안내(Revision 81): 가운데 반투명 창 · 확인 버튼 / Enter / Esc 로 닫는다. 오른쪽 위 '조작키 안내'(H · ?)로 다시 볼 수 있다.
 // 새 게임 첫 화면 · 게임 안내(Revision 83): 이 게임이 무엇이고 어떻게 진행되는지 한 화면으로. '다음 · 조작키 보기' → controlsIntro.
 // 창을 Esc 로 닫아도 조작키 안내로 넘어간다(actions.js 'close' 가 view 'game-intro' 를 본다).
 gameIntro(){this.show(`<div class="game-intro-body"><span class="eyebrow">충주공고 탐험 RPG</span><h1>충주공고, 우리의 일주일</h1>
   <p class="intro-lead">충주공고의 학교생활을 미리 경험해 보세요!<br>학교를 돌아다니며 캠퍼스 구조, 월~금 일과, 그리고 각 학과의 2027학년도 전문 교과 교육과정을 알아볼 수 있습니다.</p>
   <ol class="intro-steps">
    <li><b>① 학교생활</b><span>월요일부터 금요일까지 학교 일과를 따라가세요.</span></li>
    <li><b>② 방과후 활동</b><span>일과가 끝나면 바로 귀가해 다음 날로 넘어가거나 방과후 활동을 할 수 있습니다. 8곳 탐방이나 몬스터 사냥으로 학교를 알아보고 캐릭터를 성장시키세요.</span><small>학과 탐방에서는 2027학년도 교육과정을 알아보고 간단한 문제 3개를 풀게 됩니다.</small></li>
    <li><b>③ 최종 목표</b><span>탐방과 사냥으로 공명 타격(Q)을, 8곳 탐방을 모두 마치면 최고 기술(R)을 익힙니다. 금요일 일과가 끝난 뒤 운동장에 나타나는 보스 몬스터를 쓰러뜨리세요!</span></li>
   </ol>
   <button class="primary keys-ok" data-action="intro-controls">다음 · 조작키 보기 <kbd>Enter</kbd></button></div>`);
  this.dialog.classList.add('game-intro');this.view='game-intro';}
 controlsIntro(){this.show(`<div class="keys-intro-body"><span class="eyebrow">새 게임 · 조작 방법</span><h2>이렇게 움직이고 싸워요</h2><table class="keytable"><tbody>${START_CONTROLS.map(([what,keys,note])=>
   `<tr><th scope="row">${esc(what)}</th><td>${keys.map(k=>`<kbd class="keycap${k.length>2?' wide':''}">${esc(k)}</kbd>`).join('')}</td><td>${note?`<small>${esc(note)}</small>`:''}</td></tr>`).join('')}</tbody></table>
   <p class="subtle">언제든 <kbd>H</kbd> 또는 <kbd>?</kbd> 키, 오른쪽 위 '조작키 안내'에서 다시 볼 수 있어요.</p><button class="primary keys-ok" data-action="close">확인하고 시작하기 <kbd>Enter</kbd></button></div>`);
  this.dialog.classList.add('keys-intro');}
 header(title){return `<div class="dialogtop"><h2>${title}</h2><button data-action="close" aria-label="닫기">닫기 <kbd>Esc</kbd></button></div>`;}
 title(){this.show(`<span class="eyebrow">A WEEK AT CHUNGJU TECH</span><div class="intro-tag">학교생활 RPG · 플레이 가능한 프로토타입</div><h1>충주공고,<br>우리의 일주일.</h1><p class="intro">종이 울려도, 이야기는 계속된다.<br>걷고, 배우고, 친구를 만나고.<br>어떤 하루를 보낼지는 너의 몫.</p><hr class="divider"><div class="stack"><button class="primary" data-action="new">새로운 일주일 시작하기</button><button data-action="loadslots">이어하기</button><button class="ghost" data-action="help">조작법 살펴보기</button></div><p class="subtle">홍길동의 월요일부터 금요일까지<br>PC · 키보드와 마우스로 플레이</p>`,true);}
 departments(selected,admin=false){this.show(`${this.header(admin?'관리자 모드 · 학과 선택':'어떤 내일을 만들어 볼까?')}<p>${admin?'관리자 모드로 시작할 학과를 고르세요. 월요일 아침 새 게임으로 시작하며 저장되지 않습니다.':'홍길동의 학과를 선택하세요. 다른 학과에도 자유롭게 방문할 수 있어요.'}</p><div class="departments">${DEPARTMENTS.map(d=>`<button class="${selected===d.id?'selected':''}" data-action="department" data-value="${d.id}"><strong>${d.name}</strong><small>${d.description}</small><small>전공 숙련도 획득 +20%</small></button>`).join('')}</div><button class="primary" data-action="${admin?'admin-start':'newslots'}" ${selected?'':'disabled'}>${admin?'관리자 모드로 시작하기':'이 학과로 등교하기'}</button>`);}
 slots(slots,mode){this.show(`${this.header(mode==='load'?'이어갈 일주일':'일주일을 기록할 자리')}<p>${mode==='load'?'기록을 골라 이어서 등교하세요.':'이 브라우저에 저장됩니다. 기존 기록은 확인 후 덮어씁니다.'}</p><div class="slots">${slots.map((s,i)=>`<button class="slot" data-action="${mode==='load'?'loadslot':'startslot'}" data-value="${i}" ${mode==='load'&&!s?'disabled':''}><strong>SAVE ${i+1}</strong><span>${s?.corrupt?'읽을 수 없는 기록':s?`홍길동 / ${DAYS[s.day]} ${timeText(s.time)}`:'비어 있음'}</span><small>${s&&!s.corrupt?DEPARTMENTS.find(d=>d.id===s.department)?.name||'':''}</small></button>`).join('')}${mode==='load'?'<button class="slot" data-action="admin-login"><strong>관리자 모드</strong><span>테스트용 · 저장되지 않음</span><small>비밀번호 필요</small></button>':''}</div>`);}
 // 관리자 모드 비밀번호 입력. Enter 로도 확인된다.
 adminLogin(error=''){
  this.show(`${this.header('관리자 모드')}<p>비밀번호를 입력하세요.</p><div class="row"><input id="admin-password" type="password" inputmode="numeric" maxlength="8" autocomplete="off" aria-label="관리자 비밀번호" style="flex:1;padding:12px 16px;border:1px solid var(--line);border-radius:6px"><button class="primary" data-action="admin-enter">확인</button></div>${error?`<p style="color:var(--danger)">${esc(error)}</p>`:''}<div class="row" style="margin-top:12px"><button data-action="loadslots">돌아가기</button></div>`);
  const input=this.content.querySelector('#admin-password');
  if(input){input.focus();input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();this.action('admin-enter');}});}
 }
 adminPassword(){return this.content.querySelector('#admin-password')?.value||'';}
 // 조작키 안내. 스크롤 없이 한 화면에 들어오도록 네 묶음을 2열로 나란히 둔다.
 help(){this.show(`${this.header('조작키 안내')}<div class="keycards">${CONTROL_GROUPS.map(g=>
  `<section class="keycard"><h3>${esc(g.title)}</h3><dl>${g.keys.map(([key,text])=>
   `<dt>${key.split('  ').map(k=>`<kbd>${esc(k)}</kbd>`).join('')}</dt><dd>${esc(text)}</dd>`).join('')}</dl></section>`).join('')}</div><div class="help-foot"><button data-action="game-intro">게임 안내 다시 보기</button></div>`);}
 menu(s,admin=false){this.show(`${this.header('잠깐 쉬어 가기')}<p>${DAYS[s.day]} ${timeText(s.time)} · ${getPeriod(s.time,s.day).name} · ${admin?'관리자 모드 (저장되지 않음)':`SAVE ${s.slot+1}`}</p>${admin?`<div class="row" aria-label="관리자 요일 변경">${DAYS.map((d,i)=>`<button class="${s.day===i&&!isAdminBossTime(s)?'selected':''}" data-action="admin-day" data-value="${i}">${d.slice(0,1)}</button>`).join('')}<button class="${isAdminBossTime(s)?'selected':''}" data-action="admin-boss">보스몹</button></div><p class="subtle">요일 버튼을 누르면 그 요일 아침(등교 시각)으로, '보스몹'을 누르면 금요일 방과 후 운동장 보스전으로 바로 이동합니다. 상점 포인트 9999점과 충공 코인 9999개가 늘 채워지고, 모든 장비가 1개씩 가방에 있습니다.</p>`:''}<div class="stack"><button class="primary" data-action="close">계속 걷기</button>${admin?'':'<button data-action="save">지금 저장하기</button>'}<button data-action="sound">소리 설정</button>${s.story.bossDefeated?'<button data-action="quiet-ending">게임 종료 · 일주일 마무리하기</button>':getPeriod(s.time,s.day).type==='afterSchool'&&s.day!==4?'<button data-action="go-home">오늘 일과를 마치고 귀가하기</button>':''}<button data-action="wait">다음 시간대까지 기다리기</button><button data-action="help">조작 안내</button><button data-action="title">${admin?'시작 화면으로 (저장 안 함)':'저장하고 시작 화면으로'}</button></div>`);}
 // J · 지금 입고 있는 장비와 능력치를 한눈에. 칸마다 강화 카드(2026-09-27 · 충공 코인 강화)가 붙는다.
 // effect = {slot, success, level} 이면 그 카드에 성공/실패 연출을 얹어 그린다(연출 동안 강화 버튼은 모두 잠긴다).
 gear(s,effect=null){
  const total=playerStats(s),coins=coinCount(s);
  this.show(`${this.header('길동의 장비')}
   <div class="enh-wallet"><span>보유 <strong>충공 코인 × ${coins}</strong></span><small>몬스터를 정리하면 가끔 떨어집니다 · 상점 포인트와 따로 모입니다</small></div>
   <div class="enh-grid">${SLOTS.map(({slot,label})=>{const info=enhanceInfo(s,slot);return enhanceCard(info,label,effect,!!info.id&&isOwnDeptGear(s,info.id));}).join('')}</div>
   ${resonancePanel(s)}
   <div class="list-row"><span>합계</span><strong>공격 +${formatStat(total.power)} · 방어 ${formatStat(total.defense)}</strong></div>
   ${skillStates(s).map(k=>`<div class="list-row"><div><span class="eyebrow">${k.key}</span><strong style="display:block">${esc(k.name)}</strong><small>${esc(k.description)}</small></div><div style="text-align:right;white-space:nowrap">${k.unlocked?(k.ready?'준비 완료':`${k.remaining.toFixed(1)}초`):esc(k.requirement)}</div></div>`).join('')}
   <div class="row"><button data-action="inventory">가방에서 장비 바꾸기 · I</button><button data-action="skills">숙련도 보기</button></div>`);
 }
 // 장비는 앞에 [무기] [옷] [투구] 칸 표시를 붙여 한눈에 구분한다. 탭은 전체 · 무기 · 옷 · 투구 · 소모품 다섯 개.
 // 강화 단계가 있는 장비는 이름 뒤에 +N 을 붙인다(강화 버튼은 가방에 없다 — 강화는 J 나의 장비에서).
 // 탭 상태(2026-09-27): 가방이 열려 있는 동안에는 사용자가 고른 탭(this.bagFilter)을 그대로 둔다. 장착 · 해제 · 사용처럼
 // 데이터만 바뀌어 다시 그릴 때(filter 인자 없음)는 그 탭을 유지하고, 다른 창에서 새로 열 때만 기본 탭(전체)으로 시작한다.
 inventory(s,filter){
  if(filter===undefined)filter=this.view==='bag'?this.bagFilter:'all';
  if(!BAG_TABS.some(([id])=>id===filter))filter='all';
  const keep=this.view==='bag'?this.content?.querySelector?.('.inventory-list')?.scrollTop:0;
  const tag=item=>item.type==='gear'&&SLOT_LABEL[item.slot]?`<span class="slottag">[${SLOT_LABEL[item.slot]}]</span> `:'';
  // 강화 단계와 착용 여부는 '그 칸의 장비 개체' 기준이다(Revision 81: 같은 이름 장비가 여러 개여도 각자 따로 표시).
  const worn=(item,e)=>!!SLOT_FIELD[item.slot]&&wornEntry(s,item.slot)===e;
  const title=(e,item)=>{const level=item.type==='gear'?entryLevel(e):0;return e.id===COIN_ID?`${esc(item.name)} × ${e.quantity}`:`${esc(item.name)}${level?` +${level}`:''}`;};
  const shown=item=>filter==='all'||(filter==='consumable'?item.type==='consumable':item.type==='gear'&&item.slot===filter);
  this.show(`${this.header('길동의 가방')}<div class="row"><span class="subtle">${s.inventory.length} / ${CONFIG.inventorySlots} 칸 · 상점 포인트 ${shopPoints(s)}점 · 충공 코인 ${coinCount(s)}개</span></div><div class="row bag-tabs" role="tablist">${BAG_TABS.map(([id,n])=>`<button class="${filter===id?'selected':''}" data-action="filter" data-value="${id}" role="tab" aria-selected="${filter===id}">${n}</button>`).join('')}</div><div class="inventory-list">${s.inventory.map((e,i)=>({e,i,item:ITEMS[e.id]})).filter(({item})=>item&&shown(item)).map(({e,i,item})=>`<div class="list-row"><div class="item-line">${equipmentIconHTML(e.id)}<div><strong>${tag(item)}${title(e,item)}</strong> <span class="badge rar-${RARITY_ORDER.indexOf(item.rarity)}">${item.rarity}</span>${e.quantity>1&&e.id!==COIN_ID?` <span class="badge">×${e.quantity}</span>`:''}${item.type==='gear'&&worn(item,e)?' <span class="badge worn-badge">착용 중</span>':''}<small style="display:block">${esc(item.description)}</small></div></div>${item.type==='gear'&&SLOT_FIELD[item.slot]?`<button data-action="equip" data-value="${i}">${worn(item,e)?'해제':'장착'}</button>`:item.heal?`<button data-action="use" data-value="${i}">사용</button>`:''}</div>`).join('')||'<p>아직 가방이 가벼워요. 학교에서 발견한 물건을 가까이 가서 F로 주워 보세요.</p>'}</div>`);
  this.view='bag';this.bagFilter=filter;
  const list=this.content?.querySelector?.('.inventory-list');if(list&&keep)list.scrollTop=keep;}
 // 교문 앞 수위실 상점(2026-09-27 개편). 왼쪽 '수위실 상점 · 구매'(상점이 파는 장비)와 오른쪽 '내 장비 · 판매'(내 가방의
 // 무기 · 옷 · 투구)를 나란히 둔다 — 상점 물건과 내 물건이 섞이지 않게. 좁은 화면에서는 위아래로 쌓인다.
 // 화면 상태(this.shopView: 구매 탭 · 판매 필터 · 판매 확인 대기)는 상점이 열려 있는 동안 유지되고, 사고팔아 다시 그려도 바뀌지 않는다.
 shop(s,patch={}){
  const fresh=this.view!=='shop'||!this.shopView;
  const view=this.shopView={...(fresh?SHOP_VIEW_DEFAULT:this.shopView),...patch};
  if(!SLOTS.some(sl=>sl.slot===view.tab))view.tab=SHOP_VIEW_DEFAULT.tab;
  if(!SELL_TABS.some(([id])=>id===view.sell))view.sell=SHOP_VIEW_DEFAULT.sell;
  const scrolls=fresh?[]:[...(this.content?.querySelectorAll?.('.shop-pane .inventory-list')||[])].map(e=>e.scrollTop);
  const points=shopPoints(s),stock=shopStock().filter(it=>it.slot===view.tab);
  const rar=item=>`<span class="badge rar-${RARITY_ORDER.indexOf(item.rarity)}">${item.rarity}</span>`;
  const buyRow=it=>{
   const owned=s.inventory.some(e=>e.id===it.id),afford=points>=it.price;
   return `<div class="list-row"><div class="item-line">${equipmentIconHTML(it.id)}<div><strong>${esc(it.name)}</strong> ${rar(it)}<small style="display:block">${esc(it.description)}</small></div></div><div class="shop-price"><strong>${it.price}P</strong>${owned?'<small>보유 중</small>':`<button data-action="shop-buy" data-value="${it.id}"${afford?'':' disabled'}>구매</button>`}</div></div>`;
  };
  const selling=s.inventory.map((e,i)=>sellInfo(s,i)).filter(x=>x.state!=='invalid'&&(view.sell==='all'||x.item.slot===view.sell));
  const token=x=>`${x.index}:${x.id}`;
  const sellRow=x=>{
   const name=`${esc(x.item.name)}${x.level?` +${x.level}`:''}`;
   const action=x.state==='ready'?`<button data-action="shop-sell" data-value="${esc(token(x))}"${view.confirm?' disabled':''}>판매</button>`
    :x.state==='equipped'?'<button disabled>장착 중</button>':'<button disabled title="다시 얻을 수 없는 고유 장비">판매 불가</button>';
   const tagline=x.state==='equipped'?' · <span class="sell-note">착용 중</span>':x.state==='unique'?' · <span class="sell-note">고유 장비</span>':'';
   return `<div class="list-row${view.confirm===token(x)?' confirming':''}"><div class="item-line">${equipmentIconHTML(x.id)}<div><strong>${name}</strong><small style="display:block">${rar(x.item)} · ${SLOT_LABEL[x.item.slot]}${tagline}</small></div></div><div class="shop-price"><strong>${x.state==='unique'?'—':`${x.price}P`}</strong>${action}</div></div>`;
  };
  const pending=view.confirm&&selling.find(x=>token(x)===view.confirm&&x.state==='ready');
  const confirm=pending?`<div class="sell-confirm" role="alertdialog" aria-label="판매 확인"><p><strong>${esc(pending.item.name)}${pending.level?` +${pending.level}`:''}</strong>을(를) <strong>${pending.price}포인트</strong>에 판매하시겠습니까?</p>${pending.level?'<small>강화 단계는 판매 가격에 더해지지 않고, 강화에 쓴 충공 코인도 돌려받지 않습니다.</small>':''}<div class="row"><button class="primary" data-action="shop-sell-confirm" data-value="${esc(view.confirm)}">판매</button><button data-action="shop-sell-cancel">취소</button></div></div>`:'';
  this.show(`${this.header('수위실 상점')}<div class="shop-top"><p>수위 아저씨: 소동 정리하느라 고생이 많지. 필요한 건 사 가고, 안 쓰는 장비는 두고 가렴.</p><span class="shop-wallet">상점 포인트 <strong>${points}P</strong></span></div>
   <div class="shop-panes">
    <section class="shop-pane buy" aria-label="수위실 상점 구매"><header><span class="pane-kicker">상점 물건</span><h3>수위실 상점 · 구매</h3></header><div class="row shop-tabs">${SLOTS.map(sl=>`<button class="${view.tab===sl.slot?'selected':''}" data-action="shop-tab" data-value="${sl.slot}">${sl.label}</button>`).join('')}</div><div class="inventory-list">${stock.map(buyRow).join('')}</div></section>
    <section class="shop-pane sell" aria-label="내 장비 판매"><header><span class="pane-kicker">내 가방</span><h3>내 장비 · 판매</h3></header><div class="row shop-tabs">${SELL_TABS.map(([id,n])=>`<button class="${view.sell===id?'selected':''}" data-action="shop-sell-tab" data-value="${id}">${n}</button>`).join('')}</div>${confirm}<div class="inventory-list">${selling.map(sellRow).join('')||'<p class="subtle">팔 수 있는 장비가 없습니다.</p>'}</div></section>
   </div>
   <p class="subtle">포인트는 소동을 하나 정리할 때마다 1점씩(공명체는 1점짜리 50개) 모입니다. 장비 구매가는 보통 10 · 희귀 20 · 영웅 35 · 레전드 50P, 판매가는 그 60%(보통 6 · 희귀 12 · 영웅 21 · 레전드 30P)이고 강화 단계와 상관없습니다. 착용 중인 장비는 팔 수 없습니다.</p>`);
  this.view='shop';this.dialog?.classList?.add('wide');
  [...(this.content?.querySelectorAll?.('.shop-pane .inventory-list')||[])].forEach((e,i)=>{if(scrolls[i])e.scrollTop=scrolls[i];});}

 skills(s){this.show(`${this.header('조금씩, 나답게 자라는 중')}<p><strong>${progression(s).stage}</strong> · 경험치 ${progression(s).xp} · 탐방 ${tourCount(s)}/8</p><p>${progression(s).next}</p><p>최고 기술: ${progression(s).ultimateName} · ${progression(s).ultimate?'R 사용 가능':'8곳 탐방 시 해금'}</p><div class="stack">${Object.entries(SKILLS).map(([k,n])=>`<div class="skillrow"><span>${n} 숙련</span><progress max="100" value="${Math.min(100,s.proficiencies[k])}" aria-label="${n} 숙련"></progress><span>${Math.floor(s.proficiencies[k])}</span></div>`).join('')}</div><p>학과 숙련 20: 심화 실습 · 장비 강화는 J 나의 장비에서<br>전투 숙련 5: Q 공명 타격 · 생활 숙련 10: E 숨 고르기</p><div class="list-row"><span>수업 참여</span><strong>${s.stats.classes}회</strong></div><div class="list-row"><span>해결한 작은 소동</span><strong>${s.stats.kills}마리</strong></div><div class="list-row"><span>축구공을 찬 횟수</span><strong>${s.stats.kicks}회</strong></div><div class="list-row"><span>발견한 공간</span><strong>${s.stats.found.length}곳</strong></div>`);}
 map(s){this.show(`${this.header('우리 학교, 한눈에')}<svg class="map" viewBox="0 0 786 640" role="img" aria-label="첨부 위성지도를 바탕으로 한 교내 안내 지도"><polygon points="${BOUNDARY.map(p=>`${p.x},${p.y}`).join(' ')}" fill="#a5bc83"/><rect x="543" y="81" width="199" height="318" fill="#bb8066"/><rect x="555" y="95" width="175" height="295" fill="#709575"/><text x="640" y="245" text-anchor="middle">운동장</text>${`<rect x="${TRAINING_YARD.x}" y="${TRAINING_YARD.y}" width="${TRAINING_YARD.w}" height="${TRAINING_YARD.d}" fill="#a3a192"/><text x="107" y="405" text-anchor="middle">야외 실습장</text><text class="roof-number" x="107" y="405" text-anchor="middle">13</text>`}${CAMPUS_PROPS.filter(o=>["storage","utility","electrical","canopy"].includes(o.type)).map(o=>`<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.d}" fill="${o.type==="storage"?"#815244":o.type==="electrical"?"#55996b":"#c3c8bb"}" stroke="#fffdf5"><title>${o.type==="electrical"?"전기 설비":o.type==="canopy"?"차양 통로":"창고"}</title></rect>`).join('')}${BUILDINGS.map((b,i)=>`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.d}" fill="${ROOF_COLORS[b.id]}" stroke="#fffdf5"/><text class="roof-label" x="${b.x+b.w/2}" y="${b.y+b.d/2}" text-anchor="middle" transform="rotate(${b.d>b.w*1.7||b.id==='dreamhall'?90:0} ${b.x+b.w/2} ${b.y+b.d/2})">${b.name.split(' ·')[0]}</text><text class="roof-number" x="${b.x+b.w/2}" y="${b.y+b.d/2+8}" text-anchor="middle">${i+1}</text>${b.doors.map(d=>`<circle cx="${d.x}" cy="${d.y}" r="3" fill="#f2d293" stroke="#57442a"><title>${b.name} ${d.label}</title></circle>`).join('')}`).join('')}<rect x="396" y="296" width="64" height="50" rx="4" fill="#c9b889" stroke="#fffdf5"/><text class="roof-label shelter-map-label" x="428" y="324" text-anchor="middle">장이쉼터</text><text class="roof-number" x="428" y="331" text-anchor="middle">11</text><circle cx="${s.scene==='campus'?s.player.x:BUILDINGS.find(b=>b.id===(s.scene.startsWith('main')?'main':s.scene))?.door.x}" cy="${s.scene==='campus'?s.player.y:BUILDINGS.find(b=>b.id===(s.scene.startsWith('main')?'main':s.scene))?.door.y}" r="7" fill="#fffdf5" stroke="#315f50" stroke-width="4"/><text class="roof-number" x="640" y="259" text-anchor="middle">12</text></svg><p class="map-key">흰 점: 현재 위치 · 금색 점: 출입구</p><ol class="map-legend">${[...BUILDINGS.map(b=>b.name.split(' ·')[0]),'장이쉼터','운동장','야외 실습장'].map(name=>`<li>${name}</li>`).join('')}</ol><p class="subtle">위성지도 표기 기준 · 내부는 창작 공간 · 경계와 축척은 근사치<br>지도는 안내용입니다. 장소를 클릭해 순간이동하지 않습니다.</p>`);}
 // HUD 체력바(Revision 81): 같은 체력 값으로 막대를 채우고, 30% 이하이면 빨강 + 부드러운 테두리 맥동(움직임 줄이기 설정이면 멈춤).
 // 30% 이하로 들어가는 순간 짧은 안내를 한 번만 띄우고, 30% 초과로 회복하면 다시 알릴 수 있다.
 hpWarning(s){const bar=document.querySelector('#hp');bar.max=s.player.maxHp||100;bar.value=Math.max(0,s.player.hp);
  const tone=hpTone(hpRatio(s.player)),panel=bar.closest('.status');if(panel&&panel.dataset.hp!==tone)panel.dataset.hp=tone;
  this.lowHp??={warned:false};if(lowHpWatch(this.lowHp,s.player))this.toast(LOW_HP_MESSAGE);}
 // '현재 목표' 상자(Revision 81): 조회 전 → 본관 1학년 교실로 이동, 조회 뒤 → 학교 탐방 N / 8. 글이 바뀔 때만 다시 쓴다.
 goal(s){const g=questGoal(s),el=document.querySelector('#questhint'),key=g.goal+'|'+g.detail;if(el.dataset.goal===key)return;el.dataset.goal=key;el.dataset.stage=g.stage;
  el.innerHTML=`<strong class="goal">현재 목표: ${esc(g.goal)}</strong>${g.detail?`<small>${esc(g.detail)}</small>`:''}`;}
 hud(s,near){document.querySelector('#hud').hidden=false;document.querySelector('#day').textContent=`${DAYS[s.day]} · ${THEMES[s.day]}`;document.querySelector('#time').textContent=timeText(s.time);document.querySelector('#period').textContent=getPeriod(s.time,s.day).name;document.querySelector('#location').textContent=sceneName(s.scene);document.querySelector('#department').textContent=DEPARTMENTS.find(d=>d.id===s.department).name;document.querySelector('#hptext').textContent=`${Math.ceil(s.player.hp)} / ${s.player.maxHp}`;this.hpWarning(s);document.querySelector('#equipment').textContent=s.equipment?ITEMS[s.equipment].name+(equipmentLevel(s)?' +'+equipmentLevel(s):''):'맨주먹 · 가벼운 발걸음';if(s.armor)document.querySelector('#equipment').textContent+=' · '+ITEMS[s.armor].name;document.querySelectorAll('.week i').forEach((e,i)=>e.classList.toggle('on',i<=s.day));const bar=document.querySelector('#skillbar');
  // 스킬은 작은 정사각형 아이콘만 상시 노출한다. 이름·설명·효과·쿨타임은 마우스를 올렸을 때만 뜨고,
  // 쓴 직후에는 어두운 반투명 막이 아래로 줄어들면서 가운데에 남은 초가 표시된다.
  if(bar)bar.innerHTML=skillStates(s).map(k=>{
   const state=k.unlocked?(k.ready?'ready':'cooling'):'locked';
   const tip=`<span class="tip"><b>${esc(k.name)}</b><span class="tipkey">${esc(k.key)}</span>`
    +`<small>${esc(k.description)}</small>`
    +(k.effect?`<small class="tipline"><i>효과</i>${esc(k.effect)}</small>`:'')
    +`<small class="tipline"><i>쿨타임</i>${esc(k.cooldownText)}</small>`
    +(k.unlocked?'':`<small class="tipline locked"><i>잠김</i>${esc(k.requirement)} 필요</small>`)
    +'</span>';
   return `<div class="skillicon ${state}" style="--tone:${esc(k.tone)}" tabindex="0" aria-label="${esc(k.key)} ${esc(k.name)}">`
    +`<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">${k.icon}</svg>`
    +`<span class="hotkey">${esc(k.key)}</span>`
    +(k.ratio?`<i class="cool" style="height:${Math.round(k.ratio*100)}%"></i><em>${k.remaining<10?k.remaining.toFixed(1):Math.ceil(k.remaining)}</em>`:'')
    +tip+'</div>';}).join('');
  const target=document.querySelector('#interaction');target.hidden=!near;target.innerHTML=near?`<kbd>F</kbd>${esc(near.name)}`:'';this.goal(s);}
}
