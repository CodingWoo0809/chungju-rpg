import {prepareArchitectureAtlas} from './architecture-atlas.js';
const SOURCE=new URL('../assets/monsters/architecture-pilot/brush-painted-parts-v1.png',import.meta.url).href;
const X=[0,315,535,750,940,1130,1350,1536];
const Y=[0,340,680,1024];
const PARTS=Object.fromEntries(['front','back','right'].map((direction,row)=>[
 direction,Object.fromEntries(['body','head','armL','armR','legL','legR','brush'].map((name,col)=>[
  name,[X[col],Y[row],X[col+1]-X[col],Y[row+1]-Y[row]]]))
]));
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};
let atlas=null,source=null,loading=null;
const motion=new WeakMap();

export function loadBrushArt(){
 if(loading)return loading;
 if(typeof Image==='undefined')return Promise.resolve(false);
 atlas=new Image();atlas.decoding='async';
 loading=new Promise(resolve=>{atlas.onload=()=>{source=prepareArchitectureAtlas(atlas,PARTS);resolve(true);};atlas.onerror=()=>{atlas=null;resolve(false);};});
 atlas.src=SOURCE;return loading;
}
function image(){if(!atlas)loadBrushArt();return source;}
function paint(c,img,rect,x,y,w,h,angle=0,alpha=1,pivotX=.5,pivotY=.5){
 c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=alpha;
 c.drawImage(img,...rect,-w*pivotX,-h*pivotY,w,h);c.restore();
}
function brushLag(m,pose){
 const now=pose.time||0,target=clamp((pose.velocity?.x||0)/15,-1,1);
 let state=motion.get(m);
 if(!state){state={time:now,lag:target};motion.set(m,state);return state.lag;}
 const dt=clamp(now-state.time,0,.12);
 state.lag+=(target-state.lag)*(1-Math.exp(-dt*4.5));state.time=now;
 return state.lag;
}
const point=(x,y)=>({x,y});
const mix=(a,b,t)=>a+(b-a)*t;
const brushEnd=(grip,angle,length,sign)=>point(grip.x+Math.sin(angle)*length*sign,grip.y-Math.cos(angle)*length*sign);

export function brushRigPose(pose={}){
 const direction=['front','back','right','left'].includes(pose.direction)?pose.direction:'front';
 const side=direction==='right'||direction==='left',mirror=direction==='left'?-1:1;
 const move=clamp(pose.move||0),wind=clamp(pose.windup||0),hit=clamp(pose.hit||0);
 const age=Number.isFinite(pose.attackAge)?Math.max(0,pose.attackAge):Infinity;
 const load=smooth(wind/.6),sweep=smooth((wind-.6)/.4);
 const after=Number.isFinite(age),follow=after?smooth(age/.13):0;
 const recover=after?smooth((age-.13)/.39):0;
 const reach=after?1-recover:load,drive=after?1-recover:sweep;
 const gait=pose.gait||0,sway=Math.sin(gait)*move;
 const sx=side?2.75:3.15,fx=side?-2.55:-3.15;
 const holding={
  shoulder:point(sx,-12.65),
  elbow:point(sx+1.05+reach*.4-drive*.75+sway*.1,-9.25+hit*.35),
  hand:point(sx+(side?1.1:1.7)-reach*1.2-drive*1.55-follow*.7*(1-recover)+sway*.14,
   -10.85-reach*.5+drive*.2+follow*.3*(1-recover)+hit*.35)
 };
 const angle=after?mix(-.7-.68*follow,0,recover):1.05*load-1.75*sweep;
 const brushAngle=angle-(pose.lag||0)*move*.1+hit*.18;
 const grip=point(holding.hand.x,holding.hand.y);
 const secondGrip=brushEnd(grip,brushAngle,2,-1);
 const assist=after?1-recover:smooth(wind/.52);
 const free={
  shoulder:point(fx,-12.65),
  elbow:point(mix(fx-.95-sway*.13,-1.3+1.3*drive,assist),mix(-9.25+hit*.45,-9.7,assist)),
  hand:point(mix(fx-1.05+sway*.26,secondGrip.x,assist),
   mix(-6.45+hit*.65,secondGrip.y,assist))
 };
 const brush={grip,angle:brushAngle,base:brushEnd(grip,brushAngle,18.2*.36,-1),
  tip:brushEnd(grip,brushAngle,18.2*.64,1)};
 return{direction,side,mirror,move,wind,hit,age,load,sweep,follow,recover,free,holding,brush,
  torsoLean:sway*.045-reach*.1+drive*.22+follow*.05*(1-recover)-hit*.16};
}

function armSegment(c,img,rect,a,b,width,alpha=1){
 const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
 c.save();c.translate(a.x,a.y);c.rotate(-Math.atan2(dx,dy));c.globalAlpha*=alpha;
 c.drawImage(img,...rect,-width*.5,-.25,width,length+.5);c.restore();
}

function articulatedArm(c,img,rect,arm,alpha=1){
 const [x,y,w,h]=rect,wrist=point(mix(arm.elbow.x,arm.hand.x,.77),mix(arm.elbow.y,arm.hand.y,.77));
 armSegment(c,img,[x,y,w,h*.52],arm.shoulder,arm.elbow,3.6,alpha);
 armSegment(c,img,[x,y+h*.45,w,h*.36],arm.elbow,wrist,2.65,alpha);
 paint(c,img,[x,y+h*.76,w,h*.24],arm.hand.x,arm.hand.y,2.5,2.4,0,alpha);
}

function paintArc(c,rig){
 const strength=Number.isFinite(rig.age)?1-smooth(rig.age/.23):rig.sweep*.8;
 if(strength<=.015)return;
 const to=rig.brush.angle,from=Math.min(1.05,to+.58),radius=18.2*.64,grip=rig.brush.grip;
 c.save();c.lineCap='round';
 for(const [extra,color,width] of [[0,`rgba(230,51,128,${strength*.83})`,.72],[.55,`rgba(57,157,218,${strength*.72})`,.43]]){
  c.strokeStyle=color;c.lineWidth=width;c.beginPath();
  for(let i=0;i<=16;i++){
   const a=mix(from,to,i/16),p=brushEnd(grip,a,radius+extra,1);
   if(i===0)c.moveTo(p.x,p.y);else c.lineTo(p.x,p.y);
  }
  c.stroke();
 }
 c.restore();
}

function paintRelease(c,pose,tip,mirror,age){
 if(age>.16)return;
 const strength=1-smooth(age/.16),f=pose.facing||{x:0,y:1};
 const muzzle=point((f.x-f.y)*2.56*mirror,(f.x+f.y)*1.344-17.2);
 c.save();
 c.fillStyle=`rgba(48,153,220,${strength*.9})`;
 for(let i=0;i<3;i++){
  const u=.12+i*.13,p=point(mix(tip.x,muzzle.x,u)-Math.sin(u*Math.PI)*.9,
   mix(tip.y,muzzle.y,u)-Math.sin(u*Math.PI)*1.1);
  c.fillStyle=i%2?`rgba(230,65,133,${strength*.83})`:`rgba(48,153,220,${strength*.85})`;
  c.beginPath();c.arc(p.x,p.y,(.31-i*.025)*strength+.07,0,Math.PI*2);c.fill();
 }
 c.restore();
}

export function drawBrush(c,m,pose={}){
 const img=image();if(!img)return;
 const rig=brushRigPose({...pose,lag:brushLag(m,pose)});
 const {side,mirror,move,hit,age}=rig;
 const parts=PARTS[side?'right':rig.direction];
 const gait=pose.gait||0,stepL=Math.sin(gait),stepR=Math.sin(gait+Math.PI);
 const walkBob=Math.abs(stepL)*move*.24;
 c.save();c.fillStyle='rgba(35,31,26,.23)';c.beginPath();c.ellipse(0,0,3.5,1.05,0,0,Math.PI*2);c.fill();
 c.scale(mirror,1);
 const stride=side?1.35:1.95;
 const feet=[{x:-stride+stepL*move*.95,y:-Math.max(0,stepL)*move*.75,rect:parts.legL},
  {x:stride+stepR*move*.95,y:-Math.max(0,stepR)*move*.75,rect:parts.legR}];
 for(const foot of feet)paint(c,img,foot.rect,foot.x,foot.y,side?3.3:3.45,7.5,stepL*move*.08,1,.5,.96);
 c.translate(0,-walkBob+hit*.45);c.translate(0,-9.4);c.rotate(rig.torsoLean);c.translate(0,9.4);
 paint(c,img,parts.body,0,-9.4,side?7.3:8.2,8.65);
 articulatedArm(c,img,parts.armL,rig.free,side?.84:1);
 paint(c,img,parts.head,side?.45:0,-16.05+hit*.25,side?5.8:6.1,5.65,-hit*.12);
 paintArc(c,rig);
 paint(c,img,parts.brush,rig.brush.grip.x,rig.brush.grip.y,3.5,18.2,rig.brush.angle,1,.5,.64);
 articulatedArm(c,img,parts.armR,rig.holding);
 if(Number.isFinite(age))paintRelease(c,pose,rig.brush.tip,mirror,age);
 if(hit>.05){c.strokeStyle=`rgba(255,235,205,${hit*.8})`;c.lineWidth=.36;
  c.beginPath();c.moveTo(-4.5,-15);c.lineTo(-6,-15.7);c.moveTo(3.6,-10);c.lineTo(5,-9.2);c.stroke();}
 c.restore();
}
