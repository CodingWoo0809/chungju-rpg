const SOURCE=new URL('../assets/monsters/tray-pilot/tray-painted-parts-v1.png',import.meta.url).href;
const TAU=Math.PI*2;
const X=[0,336,665,892,1120,1323,1536];
const Y=[0,338,675,1024];
const PARTS=Object.fromEntries(['front','back','right'].map((direction,row)=>[
 direction,Object.fromEntries(['body','cape','armL','armR','spoonL','spoonR'].map((name,col)=>[
  name,[X[col],Y[row],X[col+1]-X[col],Y[row+1]-Y[row]]]))
]));
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};

let atlas=null,loading=null;
export function loadTrayArt(){
 if(loading)return loading;
 if(typeof Image==='undefined')return Promise.resolve(false);
 atlas=new Image();atlas.decoding='async';
 loading=new Promise(resolve=>{atlas.onload=()=>resolve(true);atlas.onerror=()=>{atlas=null;resolve(false);};});
 atlas.src=SOURCE;return loading;
}
function image(){if(!atlas)loadTrayArt();return atlas?.complete&&atlas.naturalWidth?atlas:null;}
function paint(c,img,rect,x,y,w,h,angle=0,alpha=1,pivotX=.5,pivotY=.5){
 c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=alpha;
 c.drawImage(img,...rect,-w*pivotX,-h*pivotY,w,h);c.restore();
}
function inertiaFor(m,pose){
 const now=pose.time||0,vx=clamp((pose.velocity?.x||0)/15,-1,1),vy=clamp((pose.velocity?.y||0)/11,-1,1);
 const old=inertia.get(m);
 if(!old){const state={time:now,armsX:vx,armsY:vy,capeX:vx,capeY:vy};inertia.set(m,state);return state;}
 const dt=clamp(now-old.time,0,.12);
 old.armsX+=(vx-old.armsX)*(1-Math.exp(-dt*8));
 old.armsY+=(vy-old.armsY)*(1-Math.exp(-dt*8));
 old.capeX+=(vx-old.capeX)*(1-Math.exp(-dt*3.1));
 old.capeY+=(vy-old.capeY)*(1-Math.exp(-dt*3.1));
 old.time=now;return old;
}
const inertia=new WeakMap();

function spoon(c,img,rect,x,y,lag,swing,alpha,move){
 const beat=Math.sin(swing);
 paint(c,img,rect,x-lag*.35+beat*move*.43,y+beat*move*.27,2.05,4.8,lag*.16+beat*(.08+move*.2),alpha,.5,.15);
}
function arm(c,img,rect,x,y,lag,swing,alpha,side,move){
 paint(c,img,rect,x-lag*.48,y,3.2,5.3,side*(.08+Math.sin(swing)*(.08+move*.14))+lag*.17,alpha,.5,.11);
}
function cape(c,img,rect,x,y,width,angle,alpha){
 paint(c,img,rect,x,y,width,10.3,angle,alpha,.5,.52);
}
function drawReturn(c,img,rect,age,side){
 if(age<.72||age>1.22)return;
 const t=smooth((age-.72)/.5),x=side*(11.5-t*10.3),y=-13.5+t*2.2;
 c.save();c.strokeStyle=`rgba(212,239,235,${(1-t)*.72})`;c.lineWidth=.48;
 c.beginPath();c.moveTo(side*12.4,-12.4);c.quadraticCurveTo(side*6,-18.5,x,y);c.stroke();
 cape(c,img,rect,x,y,5.4+t*5.2,(1-t)*3.8,clamp((age-.72)/.14));c.restore();
}
export function drawTrayDisc(c,x,y,width,spin){
 const img=image();if(!img)return false;
 c.save();c.translate(x,y);c.rotate(spin);c.scale(1,.58+Math.sin(spin*1.3)*.12);
 paint(c,img,PARTS.front.cape,0,0,width,width*.86,0,1);c.restore();return true;
}
export function drawTray(c,m,pose={}){
 const img=image();if(!img)return;
 const direction=['front','back','right','left'].includes(pose.direction)?pose.direction:'front';
 const side=direction==='right'||direction==='left',mirror=direction==='left'?-1:1;
 const parts=PARTS[side?'right':direction],wind=clamp(pose.windup||0),hit=clamp(pose.hit||0);
 const age=Number.isFinite(pose.attackAge)?Math.max(0,pose.attackAge):Infinity;
 const move=clamp(pose.move||0),flow=inertiaFor(m,pose),time=pose.time||0;
 const lift=Math.sin(time*2.45)*.18+Math.sin((pose.gait||0)*.65)*move*.14;
 const lagX=flow.armsX*.44,capelag=flow.capeX*.8;
 const fold=smooth((wind-.4)/.6),depart=age<.22?1-age/.22:0;
 const returned=age>=1.04?smooth((age-1.04)/.18):0;
 const capeAlpha=Number.isFinite(age)?returned:1;
 const trayX=(side?-1.4:direction==='back'?0:2.7)-capelag+fold*1.3+depart*3.1;
 const trayY=-11.1+lift-flow.capeY*.24-wind*.46-depart*.35;
 c.save();c.fillStyle='rgba(25,48,48,.21)';c.beginPath();c.ellipse(0,0,3.9,1.1,0,0,TAU);c.fill();
 c.scale(mirror,1);c.translate(-hit*1.15,hit*.55);c.rotate(-hit*.12);
 const stagger=hit*(pose.recoil?.x||0)*.07;
 if(direction!=='back')cape(c,img,parts.cape,trayX+stagger-hit*.6,trayY+hit*.8,10.7+fold*2.1,(-.25+fold*.28)*mirror-hit*.28,capeAlpha);
 const far=side?1:.8;
 spoon(c,img,parts.spoonL,side?-.85:-2.05,-7+lift,lagX,2.1+time*1.9,far,move);
 spoon(c,img,parts.spoonR,side?.65:2.05,-7+lift,lagX,3.3+time*1.9,1,move);
 arm(c,img,parts.armL,side?-1.5:-3.5,-12.1+lift,lagX,time*2.3,far,-1,move);
 const bodyX=-flow.armsX*.08+stagger;
 paint(c,img,parts.body,bodyX-hit*.5,-11.9+lift+hit*.9,side?7.7:7.8,8.6-hit*.7,-hit*.24,1);
 if(direction==='back')cape(c,img,parts.cape,trayX+stagger-hit*.6,trayY+hit*.8,10.7+fold*2.1,fold*.13-hit*.28,capeAlpha);
 arm(c,img,parts.armR,side?1.6:3.5,-12.1+lift,lagX,time*2.3+1.3,1,1,move);
 if(depart>0)cape(c,img,parts.cape,trayX+stagger,trayY-1.1,8.2,depart*1.35,depart*.84);
 if(Number.isFinite(age))drawReturn(c,img,parts.cape,age,side?-1:1);
 if(depart>0){
  c.strokeStyle=`rgba(222,248,240,${depart*.8})`;c.lineWidth=.35;
  c.beginPath();c.arc(3.4,-9.7,2.5+(1-depart)*3,-.8,1.4);c.stroke();
 }
 if(hit>.1){
  c.strokeStyle=`rgba(218,253,246,${hit*.88})`;c.lineWidth=.4;
  c.beginPath();c.moveTo(-5.7,-14.2);c.lineTo(-7,-14.9);c.lineTo(-6.3,-13.1);c.moveTo(4.7,-10.4);c.lineTo(6,-9.7);c.lineTo(5.4,-11.5);c.stroke();
 }
 c.restore();
}
