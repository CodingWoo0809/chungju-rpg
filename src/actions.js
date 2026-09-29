import {handleTourAction} from './tours.js';
import {claimGrowthRewards} from './growth.js';
import {handleRoomAction} from './room-content.js';
import {handleLifeAction,showJournal} from './life-ui.js';
import {handleProgressionAction} from './progression-ui.js';
import {createState} from './state.js';
import {getPeriod} from './clock.js';
import {equipItem,useItem,gain,buyItem,sellGear} from './inventory.js';
import {CONFIG} from './config.js';
import {checkAdminPassword,refreshAdminBag,setAdminDay,setAdminBoss,markAdminState} from './admin-mode.js';
import {initSimulation} from './simulation.js';
import {timeText,DAYS,THEMES} from './ui.js';
export function handleAction(game,action,value){if(game.enhanceLock)return;const {ui}=game,s=game.state;game.keys.clear();if(handleTourAction(game,action,value)||handleRoomAction(game,action,value)||handleLifeAction(game,action,value)||handleProgressionAction(game,action,value))return;switch(action){case 'close':if(ui.view==='game-intro'&&game.running){ui.controlsIntro();break;}if(!game.running){ui.title();break;}if(s.story.ended){game.ending();break;}if(s.time>=CONFIG.dayEnd&&s.day<4){game.dayEnd();break;}ui.close();break;
case 'new':game.selected='';game.adminPending=false;ui.departments('');break;case 'department':game.selected=value;ui.departments(value,!!game.adminPending);break;case 'newslots':ui.slots(game.saves.list(),'new');break;case 'loadslots':ui.slots(game.saves.list(),'load');break;
case 'startslot':{const slot=Number(value),existing=game.saves.list()[slot];if(existing){ui.show(`${ui.header('이 기록 위에 새로 쓸까요?')}<p>SAVE ${slot+1}의 기존 일주일은 새 게임으로 바뀝니다.</p><div class="row"><button data-action="newslots">취소</button><button class="primary" data-action="overwrite" data-value="${slot}">기존 기록을 덮고 시작</button></div>`);}else handleAction(game,'overwrite',value);break;}
case 'overwrite':game.admin=false;game.start(createState(game.selected,Number(value)));game.save();ui.gameIntro?.();break;   // 새 게임: 게임 안내(Revision 83) → 조작키 안내(Revision 81) → 플레이
case 'intro-controls':ui.controlsIntro();break;case 'game-intro':ui.gameIntro();break;
// ── 관리자 모드(admin-mode.js): 비밀번호 → 학과 선택 → 저장 없는 새 게임 ──
case 'admin-login':ui.adminLogin();break;
case 'admin-enter':if(checkAdminPassword(ui.adminPassword())){game.adminPending=true;game.selected='';ui.departments('',true);}else ui.adminLogin('비밀번호가 올바르지 않습니다.');break;
case 'admin-start':if(!game.adminPending||!game.selected)break;game.adminPending=false;game.admin=true;{const st=createState(game.selected,0);markAdminState(st);refreshAdminBag(st);game.start(st);}ui.toast('관리자 모드 · 상점 포인트 9999점 · 충공 코인 9999개 · 모든 장비 1개씩 · 저장되지 않습니다.');break;
case 'admin-day':if(!game.admin||!game.running)break;if(setAdminDay(s,Number(value))){initSimulation(s);game.renderer.snap(s.player);ui.close();refreshAdminBag(s);ui.toast(`관리자 모드 · ${DAYS[s.day]} 08:10 · ${THEMES[s.day]}`);}break;
case 'admin-boss':if(!game.admin||!game.running)break;if(setAdminBoss(s)){initSimulation(s);game.renderer.snap(s.player);ui.close();refreshAdminBag(s);ui.toast(`관리자 모드 · ${DAYS[s.day]} ${timeText(s.time)} · 보스전 · 운동장의 공명체가 곧 나타납니다`);}break;
case 'loadslot':game.admin=false;try{const loaded=game.saves.load(Number(value));const notice=[loaded.flags?.retiredGearNotice,loaded.flags?.retiredWeaponNotice,loaded.flags?.materialCoinNotice,loaded.flags?.retiredArmorNotice,loaded.flags?.retiredHelmetNotice].filter(Boolean).join(' ');if(loaded.flags){delete loaded.flags.retiredGearNotice;delete loaded.flags.retiredWeaponNotice;delete loaded.flags.materialCoinNotice;delete loaded.flags.retiredArmorNotice;delete loaded.flags.retiredHelmetNotice;}game.start(loaded);if(notice){ui.toast(notice);game.save();}}catch(e){ui.toast(e.message);}break;
case 'journal':showJournal(game);break;case 'menu':if(game.running)ui.menu(s,!!game.admin);break;case 'help':ui.help();break;case 'map':if(game.running)ui.map(s);break;case 'inventory':if(game.running){claimGrowthRewards(s);if(game.admin)refreshAdminBag(s);ui.inventory(s);game.save();}break;case 'skills':ui.skills(s);break;case 'gear':if(game.running){claimGrowthRewards(s);if(game.admin)refreshAdminBag(s);ui.gear(s);}break;case 'filter':ui.inventory(s,value);break;
case 'shop':if(game.running){if(game.admin)refreshAdminBag(s);ui.shop(s);}break;case 'shop-tab':ui.shop(s,{tab:value});break;
case 'shop-buy':{const r=buyItem(s,value);if(game.admin)refreshAdminBag(s);ui.toast(r.message);ui.shop(s);if(r.success)game.save();break;}
// ── 수위실 장비 판매(2026-09-27): 판매 → 확인(판매/취소) → 한 번만 처리. 확인 대기 값과 같은 요청만 받아 연타로 두 번 팔리지 않는다 ──
case 'shop-sell-tab':ui.shop(s,{sell:value,confirm:null});break;case 'shop-sell':if(ui.view==='shop')ui.shop(s,{confirm:value});break;case 'shop-sell-cancel':if(ui.view==='shop')ui.shop(s,{confirm:null});break;
case 'shop-sell-confirm':{if(ui.view!=='shop'||!value||ui.shopView?.confirm!==value)break;ui.shopView.confirm=null;const cut=value.indexOf(':'),r=sellGear(s,Number(value.slice(0,cut)),value.slice(cut+1));ui.toast(r.message);ui.shop(s,{confirm:null});if(r.success)game.save();break;}
case 'equip':equipItem(s,Number(value));ui.inventory(s);game.save();break;case 'use':if(!useItem(s,Number(value)))ui.toast('지금은 사용할 필요가 없다.');ui.inventory(s);game.save();break;
case 'save':if(game.admin){ui.toast('관리자 모드는 저장되지 않습니다.');break;}if(game.save())ui.toast(`SAVE ${s.slot+1}에 지금의 하루를 저장했습니다.`);break;
case 'title':if(game.running&&!game.save())break;game.running=false;document.querySelector('#hud').hidden=true;ui.title();break;
case 'after-continue':s.flags['afterSchool:'+s.day]=true;ui.close();game.save();break;case 'go-home':game.goHome();break;case 'boss-go':game.goToFinale();break;case 'quiet-ending':game.ending();break;case 'nextday':game.nextDay();break;case 'recover':if(s.time>=CONFIG.dayEnd)game.dayEnd();else ui.close();break;
case 'wait':case 'rest':{const target=getPeriod(s.time,s.day).end;ui.show(`${ui.header('잠시, 시간을 보내기')}<p>${timeText(target)}까지 쉬어 갑니다. 수업이나 활동 보상은 자동으로 받지 않습니다.</p><div class="row"><button data-action="menu">돌아가기</button><button class="primary" data-action="waitconfirm">${timeText(target)}까지 기다리기</button></div>`);break;}
case 'waitconfirm':s.time=getPeriod(s.time,s.day).end;game.save();if(s.time>=CONFIG.dayEnd)game.dayEnd();else{ui.close();ui.toast(getPeriod(s.time,s.day).name+'이 되었다.');game.checkMilestones?.();}break;
}}
