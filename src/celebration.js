import {RAINBOW} from './shelter-art.js';

// 금요일 최종전을 이긴 뒤 운동장 한가운데에서 열리는 축하 파티.
// 안쪽 원에는 친구들, 바깥 원에는 선생님들이 둘러서고 그 위로 색종이가 날린다.
export const PARTY={x:640,y:250,rx:54,ry:36};

export function partySpot(index,total){
 const ring=index%2,count=Math.max(1,Math.ceil(total/2)),step=Math.floor(index/2);
 const angle=step/count*Math.PI*2+(ring?Math.PI/count:0)+Math.PI*.5;
 const scale=ring?1:.58;
 return {x:PARTY.x+Math.cos(angle)*PARTY.rx*scale,y:PARTY.y+Math.sin(angle)*PARTY.ry*scale};
}

function confetti(d,t){
 const c=d.c;
 for(let i=0;i<84;i++){
  const x=PARTY.x-74+(i*53)%148,y=PARTY.y-52+(i*37)%104;
  const z=30-((t*8.5+i*3.1)%30);
  const p=d.p(x+Math.sin(t*1.6+i)*2.6,y,z);
  c.save();c.translate(p.x,p.y);c.rotate(t*3.4+i);
  c.globalAlpha=Math.min(1,z/5)*.9;
  c.fillStyle=RAINBOW[i%RAINBOW.length];
  c.fillRect(-3.1,-1.5,6.2,3);
  c.restore();
 }
 c.globalAlpha=1;
}

function balloons(d,t){
 const c=d.c;
 for(let i=0;i<10;i++){
  const base=(t*1.7+i*6.4)%64;
  const x=PARTY.x-58+i*13+Math.sin(t*.9+i)*3,y=PARTY.y+(i%2?30:-30);
  const p=d.p(x,y,7+base),anchor=d.p(x,y,4);
  c.strokeStyle='#e7e3d055';c.lineWidth=1;
  c.beginPath();c.moveTo(anchor.x,anchor.y);c.quadraticCurveTo(p.x+4,(p.y+anchor.y)/2,p.x,p.y+8);c.stroke();
  c.globalAlpha=Math.max(0,Math.min(1,(64-base)/18));
  c.fillStyle=RAINBOW[(i+2)%RAINBOW.length];
  c.beginPath();c.ellipse(p.x,p.y,7.4,9,0,0,Math.PI*2);c.fill();
  c.fillStyle='#ffffff66';c.beginPath();c.ellipse(p.x-2.4,p.y-3.2,2,2.8,0,0,Math.PI*2);c.fill();
  c.globalAlpha=1;
 }
}

// 무대 조명처럼 바닥을 도는 빛 고리와 터지는 폭죽.
function lights(d,t){
 const c=d.c;
 for(let i=0;i<3;i++){
  const r=PARTY.rx*(.42+i*.26),pulse=.5+Math.sin(t*1.8-i*1.1)*.5;
  d.ellipse(PARTY.x,PARTY.y,r,r*.66,null,.05,`rgba(247,226,150,${.1+pulse*.22})`);
 }
 for(let i=0;i<4;i++){
  const cycle=(t*.55+i*.25)%1;
  if(cycle>.45)continue;
  const x=PARTY.x-46+i*31,y=PARTY.y-34-((i*13)%18);
  const spread=cycle/.45,p=d.p(x,y,30+i*3);
  c.save();c.globalAlpha=(1-spread)*.9;
  c.strokeStyle=RAINBOW[(i*3+1)%RAINBOW.length];c.lineWidth=2;
  for(let k=0;k<12;k++){
   const a=k/12*Math.PI*2,rr=6+spread*26;
   c.beginPath();c.moveTo(p.x+Math.cos(a)*rr*.45,p.y+Math.sin(a)*rr*.3);
   c.lineTo(p.x+Math.cos(a)*rr,p.y+Math.sin(a)*rr*.66);c.stroke();
  }
  c.restore();
 }
}

export function drawParty(d,state,t){
 if(state.scene!=='campus'||!state.story?.bossDefeated)return;
 lights(d,t);balloons(d,t);confetti(d,t);
 d.label(PARTY.x,PARTY.y+PARTY.ry+11,'축하합니다! 오늘의 운동장은 우리 모두의 것','#3a4a3c',7,true);
}
