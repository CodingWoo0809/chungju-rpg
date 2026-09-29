import {prepareArchitectureAtlas} from './architecture-atlas.js';

const SOURCE=new URL('../assets/monsters/civil-pilot/dragonfly-drone-painted-parts-v1.png',import.meta.url).href;
const X=[0,280,550,820,1090,1350,1536];
const Y=[0,370,700,1024];
const NAMES=['hull','rotorFL','rotorFR','rotorRL','rotorRR','tail'];
const PARTS=Object.fromEntries(['front','back','right'].map((direction,row)=>[
 direction,Object.fromEntries(NAMES.map((name,col)=>[
  name,[X[col],Y[row],X[col+1]-X[col],Y[row+1]-Y[row]]
 ]))
]));
const TAU=Math.PI*2;
const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
const smooth=v=>{const t=clamp(v);return t*t*(3-2*t);};
let atlas=null,source=null,loading=null;

export function loadDragonflyDroneArt(){
 if(loading)return loading;
 if(typeof Image==='undefined')return Promise.resolve(false);
 atlas=new Image();atlas.decoding='async';
 loading=new Promise(resolve=>{
  atlas.onload=()=>{source=prepareArchitectureAtlas(atlas,PARTS);resolve(true);};
  atlas.onerror=()=>{atlas=null;resolve(false);};
 });
 atlas.src=SOURCE;return loading;
}

function paint(c,rect,x,y,w,h,angle=0,alpha=1,pivotX=.5,pivotY=.5){
 c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=alpha;
 c.drawImage(source,...rect,-w*pivotX,-h*pivotY,w,h);c.restore();
}

function rotor(c,rect,x,y,scale,time,move,wind,hit,lag){
 const speed=1+wind*2.6+hit*.65;
 const pulse=Math.sin(time*(17+lag*1.4)*speed+lag);
 paint(c,rect,x,y,6.15*scale,4.35*scale,pulse*.017+hit*(lag%2?-.11:.11));
 c.save();c.translate(x,y-.35*scale);c.rotate(time*(13+lag)*speed);
 c.globalAlpha=.13+move*.18+wind*.14;
 c.strokeStyle='#ecfcfc';c.lineWidth=.27*scale;
 for(let i=0;i<2;i++){
  const a=i*Math.PI;c.beginPath();c.moveTo(Math.cos(a)*.4,Math.sin(a)*.26);
  c.lineTo(Math.cos(a)*2.3*scale,Math.sin(a)*.7*scale);c.stroke();
 }
 if(move>.08){
  c.globalAlpha=move*.3;c.strokeStyle='#d7f8fb';c.lineWidth=.22*scale;
  c.beginPath();c.ellipse(0,0,2.5*scale,.82*scale,0,0,TAU);c.stroke();
 }
 c.restore();
}

function airConvergence(c,centers,wind,age,time){
 const charge=smooth((wind-.12)/.78);
 const release=age<.24?1-smooth(age/.24):0;
 const strength=Math.max(charge,release*.86);
 if(strength<.015)return;
 c.save();c.lineCap='round';
 for(let i=0;i<4;i++){
  const [x,y]=centers[i],flow=smooth((wind-.12-i*.045)/.7);
  c.globalAlpha=clamp((flow+release*.68)*.85);
  c.strokeStyle=i%2?'#8fddec':'#d9faff';c.lineWidth=.44+strength*.37;
  c.beginPath();c.moveTo(x,y+1.2);
  c.quadraticCurveTo(x*.42+Math.sin(time*15+i)*.35,-7.1,0,-4.3);c.stroke();
  const travel=(time*2.7+i*.24)%1;
  const px=x*(1-travel)*.8,py=(y+1.2)*(1-travel)-4.3*travel;
  c.fillStyle='#ddfaff';c.beginPath();c.ellipse(px,py,.22,.38,0,0,TAU);c.fill();
 }
 const funnel=charge*.9+release*.95;
 c.globalAlpha=clamp(funnel*.9);c.strokeStyle='#e6ffff';c.lineWidth=.52;
 for(let i=0;i<4;i++){
  const y=-5.6+i*1.02,r=(2.1-i*.43)*funnel;
  c.beginPath();c.ellipse(0,y,r,.28,Math.sin(time*20+i)*.2,0,TAU);c.stroke();
 }
 c.restore();
}

export function drawDragonflyDrone(c,m,pose={}){
 if(!source){loadDragonflyDroneArt();return;}
 const direction=['front','back','right','left'].includes(pose.direction)?pose.direction:'front';
 const side=direction==='right'||direction==='left';
 const parts=PARTS[side?'right':direction];
 const mirror=direction==='right'?-1:1;
 const time=pose.time||0,move=clamp(pose.move||0),wind=clamp(pose.windup||0),hit=clamp(pose.hit||0);
 const age=Number.isFinite(pose.attackAge)?Math.max(0,pose.attackAge):Infinity;
 const release=age<.28?1-smooth(age/.28):0;
 const velocity=pose.velocity||{x:0,y:0};
 const travel=clamp(velocity.x/14,-1,1);
 const hover=Math.sin(time*4.7)*.17+Math.sin(time*9.2)*.055;
 const tilt=move*(travel*.08+(side?.16:.13))+hit*(Math.sin(time*24)*.14+.17)-release*.055;
 const tailLag=move*(Math.sin(time*4.7-1.3)*.25-.1)+hit*.22-release*.08;
 const centers=side?[[-5.4,-14.9],[4.3,-16.3],[-3.8,-8.3],[5.4,-9.7]]
  :[[-6,-15.4],[6,-15.4],[-6,-9.1],[6,-9.1]];
 c.save();c.fillStyle='rgba(24,32,31,.22)';c.beginPath();
 c.ellipse(0,0,6.7+move*.5,1.35,0,0,TAU);c.fill();
 c.scale(mirror,1);c.translate(move*(side?.65:.35),hover-move*.42+hit*.48);c.rotate(tilt);
 paint(c,parts.tail,side?1:0,-14.3,2.1,9.25,tailLag,1,.5,.94);
 const rear=[parts.rotorRL,parts.rotorRR];
 const front=[parts.rotorFL,parts.rotorFR];
 rotor(c,rear[0],...centers[2],side?.94:1,time,move,wind,hit,2);
 rotor(c,rear[1],...centers[3],side?.94:1,time,move,wind,hit,3);
 rotor(c,front[0],...centers[0],1,time,move,wind,hit,0);
 rotor(c,front[1],...centers[1],1,time,move,wind,hit,1);
 paint(c,parts.hull,0,-11.55,side?8.4:7.7,10.1,
  move*Math.sin(time*5-.65)*.08+hit*.045-release*.055);
 airConvergence(c,centers,wind,age,time);
 if(hit>.07){
  c.globalAlpha=hit*.7;c.strokeStyle='#dffaff';c.lineWidth=.42;
  c.beginPath();c.arc(0,-11.4,5.3,-.65,.85);c.stroke();
 }
 c.restore();
}

export function drawDroneTornado(c,x,y,r,spin){
 c.save();c.translate(x,y);c.rotate(Math.sin(spin*1.15)*.1);
 const h=r*2.45;
 const g=c.createLinearGradient(0,-h*.75,0,h*.42);
 g.addColorStop(0,'rgba(229,255,255,.84)');
 g.addColorStop(.46,'rgba(84,213,235,.92)');
 g.addColorStop(1,'rgba(32,117,145,.68)');
 c.fillStyle=g;c.beginPath();c.moveTo(-r*.9,-h*.75);
 c.bezierCurveTo(-r*1.1,-h*.2,-r*.45,h*.12,0,h*.45);
 c.bezierCurveTo(r*.45,h*.12,r*1.1,-h*.2,r*.9,-h*.75);
 c.closePath();c.fill();
 c.strokeStyle='#ecffff';c.lineWidth=Math.max(1.5,r*.19);c.lineCap='round';
 for(let i=0;i<4;i++){
  const yy=-h*.61+i*h*.25,rr=r*(.92-i*.2);
  c.beginPath();c.ellipse(0,yy,rr,rr*.24,spin*.27+i*.45,0,TAU);c.stroke();
 }
 c.restore();
}
