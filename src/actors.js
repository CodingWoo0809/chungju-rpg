import {drawPlayerAttack} from './player-attack-art.js';
import {equippedArm} from './equipment-art.js';
import {CONFIG} from './config.js';
import {treeSprite} from './materials.js';
import {pickPlayerFrame,drawPlayerSprite,facingBucket,loadedPlayerSheets} from './player-sprite.js';
import {dressPlayerFrame,warmOutfit} from './outfit-art.js';
import {weaponMotion} from './inventory.js';
import {drawBodyAura,withWeaponAura} from './enhance-aura.js';
let warmed='';                         // 미리 칠하기를 마지막으로 시작한 '옷|투구|불러온 시트 수'
export function person(d,n,t,player=false,equipment=null,armor=null,aura=null,helmet=null){
 // 축하 파티에서는 제자리에서 팔다리를 흔들며 콩콩 뛴다.
 const beat=n.dance?t*5.4+(n.phase??(n.x+n.y)*.21):0;
 const hop=n.dance?Math.abs(Math.sin(beat))*3.4:0;
 const c=d.c,p=d.p(n.x,n.y),gait=n.dance?Math.sin(beat*.5)*3:n.moving?Math.sin(t*(n.running?15:9))*2.2:0;
 d.ellipse(n.x+1,n.y+1,2.2,1.3,'#18241b40');
 c.save();c.translate(p.x,p.y-hop*CONFIG.zoom/3.2);const scale=.83*CONFIG.zoom/3.2;c.scale(scale,scale);
 if(player){c.strokeStyle='#f5e6b7';c.lineWidth=1.1;c.beginPath();c.ellipse(0,1,6.5,2.5,0,0,Math.PI*2);c.stroke();}
 const f=player?((n.attackAnimation?.remaining>0?n.attackAnimation.aim:null)||n.facing||{x:0,y:1}):null,dir=player?facingBucket(f):null,front=!player||dir!=='back';
 // 옷은 스프라이트 시트 자체를 옷 입은 시트로 바꿔 그린다(outfit-art.js) — 몸과 한 픽셀로 움직여 뜨거나 어긋나지 않는다.
 if(player){const sheets=loadedPlayerSheets(),key=`${armor}|${helmet}|${Object.keys(sheets).length}`;if(key!==warmed){warmed=key;warmOutfit(armor,sheets,helmet);}}
 const sprite=player&&!n.dance?dressPlayerFrame(pickPlayerFrame(n,t,weaponMotion(equipment),equipment),armor,helmet):null;
 // 장착 무기: 몸에 가려지는 부분(뒤 레이어)을 스프라이트보다 먼저, 손 앞 부분(앞 레이어)을 나중에 그린다.
 const weapon=layer=>{
  if(!player||!equipment)return;
  withWeaponAura(c,aura,t,()=>{     // 최대 강화 무기만 테두리가 옅게 빛난다(enhance-aura.js). 무기 그리기 자체는 그대로
  if(dir==='left'){c.save();c.scale(-1,1);equippedArm(c,n,equipment,'right',sprite,layer,t);c.restore();}
  else equippedArm(c,n,equipment,dir,sprite,layer,t);
  });
 };
 if(player&&aura?.length)drawBodyAura(c,aura,t);   // 최대 강화 옷 · 투구 오라(몸통 · 머리 뒤)
 weapon('back');
 if(sprite){drawPlayerSprite(c,sprite);}
 else{
  const teacher=['teacher','vice'].includes(n.role);
  c.lineCap='round';c.strokeStyle='#242c32';c.lineWidth=2.5;
  for(const side of [-1,1]){c.beginPath();c.moveTo(side*1.5,-8);c.lineTo(side*1.7+side*gait*.4,-4);c.lineTo(side*1.8-side*gait,0);c.stroke();c.strokeStyle='#212a25';c.lineWidth=1.8;c.beginPath();c.moveTo(side*1.8-side*gait,0);c.lineTo(side*1.8-side*gait+.7,.3);c.stroke();c.strokeStyle='#30383d';c.lineWidth=2.5;}
  const shirt=c.createLinearGradient(-4,0,4,0);shirt.addColorStop(0,teacher?'#544f46':player?'#b9c0bb':'#465666');shirt.addColorStop(.45,teacher?'#9a8d75':player?'#eeeadf':'#8698a6');shirt.addColorStop(1,teacher?'#6f6355':player?'#cad0c8':'#637582');
  c.fillStyle=shirt;c.beginPath();c.moveTo(-2.5,-16);c.quadraticCurveTo(-5,-13,-3.2,-8);c.quadraticCurveTo(0,-7,3.2,-8);c.quadraticCurveTo(4,-13,2.5,-16);c.closePath();c.fill();
  c.strokeStyle=teacher?'#9b8d78':'#c9cdc5';c.lineWidth=2;for(const side of [-1,1]){c.beginPath();c.moveTo(side*3,-14);c.lineTo(side*4+gait*.35,-9.5);c.stroke();c.fillStyle='#c6a180';c.beginPath();c.arc(side*4+gait*.35,-8.7,1,0,Math.PI*2);c.fill();}
  c.fillStyle='#c4a184';c.beginPath();c.ellipse(0,-18.3,2.4,3.3,0,0,Math.PI*2);c.fill();c.fillStyle='#292a25';c.beginPath();c.moveTo(-2.6,-18.5);c.bezierCurveTo(-4,-24,3.5,-24,2.7,-18.5);c.lineTo(1,-20);c.lineTo(-1.7,-19.8);c.closePath();c.fill();
  if(player){c.strokeStyle='#395249';c.lineWidth=1.2;c.beginPath();c.moveTo(-2,-15);c.lineTo(1,-8);c.stroke();c.fillStyle='#75674d';c.beginPath();c.roundRect(-4,-13,2.5,5,1);c.fill();}
 }
 if(player&&equipment){
  if(!sprite){if(!front){c.fillStyle='#292a25';c.beginPath();c.ellipse(0,-19,2.5,3,0,0,Math.PI*2);c.fill();}else{c.fillStyle='#66513f';c.beginPath();c.arc((f.x-f.y)*.8,-18,.45,0,Math.PI*2);c.fill();}}
  // right 자세를 그대로 계산시키고 캔버스만 좌우로 뒤집는다 — 손 위치까지 자연스러운 거울상이 된다.
  weapon('front');
  if(sprite?.rig)drawPlayerAttack(c,sprite,true);
 }
 c.restore();if(player){const a=d.p(n.x,n.y,9);c.fillStyle='#e3ce8c';c.beginPath();c.moveTo(a.x-3,a.y-4);c.lineTo(a.x+3,a.y-4);c.lineTo(a.x,a.y);c.fill();}
}
export function tree(d,x,y,h=20,lift=0){
 const c=d.c,sprite=treeSprite(),p=d.p(x,y,lift);d.ellipse(x+2,y+2,h*.45,h*.25,'#1b2a2035',lift+.02);
 if(sprite){const scale=Math.hypot(d.p(x,y,1).x-p.x,d.p(x,y,1).y-p.y);const height=h*scale*1.45;const width=height*sprite.width/sprite.height;c.drawImage(sprite,p.x-width/2,p.y-height+3,width,height);return;}
 const trunk=d.p(x,y,lift+h*.65);c.strokeStyle='#615345';c.lineWidth=4;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(trunk.x,trunk.y);c.stroke();for(let i=0;i<15;i++){const a=i*2.4,r=7+Math.sin(i)*3,q=d.p(x+Math.cos(a)*r*.5,y+Math.sin(a)*r*.5,h*.6+i%3*2);const g=c.createRadialGradient(q.x-4,q.y-5,1,q.x,q.y,12);g.addColorStop(0,'#839164');g.addColorStop(1,'#43583f');c.fillStyle=g;c.beginPath();c.arc(q.x,q.y,12,0,Math.PI*2);c.fill();}
}
