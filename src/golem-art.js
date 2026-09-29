import {prepareArchitectureAtlas} from './architecture-atlas.js';
const SOURCE=new URL('../assets/monsters/architecture-pilot/golem-painted-parts-v1.png',import.meta.url).href;
const X=[0,320,590,800,1080,1280,1490,1916];
const Y=[[0,279,548,821],[0,300,570,821],[0,300,572,821],[0,300,572,821],
 [0,330,600,821],[0,330,600,821],[0,330,600,821]];
const PARTS=Object.fromEntries(['front','back','right'].map((direction,row)=>[
 direction,Object.fromEntries(['body','cap','armL','armR','legL','legR','wall'].map((name,col)=>[
  name,[X[col],Y[col][row],X[col+1]-X[col],Y[col][row+1]-Y[col][row]]]))
]));
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};
const awakening=new WeakMap();
let atlas=null,source=null,loading=null;

export function loadGolemArt(){
 if(loading)return loading;
 if(typeof Image==='undefined')return Promise.resolve(false);
 atlas=new Image();atlas.decoding='async';
 loading=new Promise(resolve=>{atlas.onload=()=>{source=prepareArchitectureAtlas(atlas,PARTS);resolve(true);};atlas.onerror=()=>{atlas=null;resolve(false);};});
 atlas.src=SOURCE;return loading;
}
function image(){if(!atlas)loadGolemArt();return source;}
function paint(c,img,rect,x,y,w,h,angle=0,alpha=1,pivotX=.5,pivotY=.5){
 c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=alpha;
 c.drawImage(img,...rect,-w*pivotX,-h*pivotY,w,h);c.restore();
}
function riseFor(m,pose,distance){
 let state=awakening.get(m);
 if(!state){state={wakeAt:null,rise:0};awakening.set(m,state);}
 if(state.wakeAt===null&&(distance<28||pose.move>.08||pose.hit>.01||m.phase!=='wander'))state.wakeAt=pose.time||0;
 state.rise=state.wakeAt===null?0:smooth(((pose.time||0)-state.wakeAt)/.88);
 return state.rise;
}
export function isGolemDormant(m){return (awakening.get(m)?.rise||0)<.46;}
function dust(c,amount,radius=5){
 if(amount<=0)return;
 c.save();c.globalAlpha*=amount;c.strokeStyle='#c9ae86';c.lineWidth=.35;
 for(const side of [-1,1]){
  c.beginPath();c.moveTo(side*2,-.5);c.quadraticCurveTo(side*(radius*.7),-1.7,side*radius,-.3);c.stroke();
  for(let i=0;i<3;i++){const x=side*(2.6+i*1.45),y=-.7-i*.42;
   c.fillStyle=i?'#b58464':'#ddd1af';c.fillRect(x,y,.4+i*.1,.28+i*.08);}
 }
 c.restore();
}
function slamImpact(c,strength){
 if(strength<=0)return;
 c.save();c.globalAlpha*=strength;
 c.fillStyle='rgba(222,192,145,.48)';
 for(const sign of [-1,1]){c.beginPath();c.ellipse(sign*5.5,-.35,3.3,1.05,0,0,Math.PI*2);c.fill();}
 c.strokeStyle='#7d5b45';c.lineWidth=.47;
 c.beginPath();c.ellipse(0,-.3,7.2+(1-strength)*3.8,1.55,0,0,Math.PI*2);c.stroke();
 for(const [x,y,r] of [[-8.1,-1.1,.62],[-5.8,-2.25,.43],[5.7,-2.1,.55],[8.2,-.9,.7]]){
  c.fillStyle='#af7654';c.fillRect(x,y-strength*.55,r,r*.65);
 }
 c.restore();
}
export function drawGolem(c,m,pose={},distance=Infinity){
 const img=image();if(!img)return;
 const direction=['front','back','right','left'].includes(pose.direction)?pose.direction:'front';
 const side=direction==='right'||direction==='left',mirror=direction==='left'?-1:1;
 const parts=PARTS[side?'right':direction],rise=riseFor(m,pose,distance);
 const move=clamp(pose.move||0),wind=clamp(pose.windup||0),hit=clamp(pose.hit||0);
 const age=Number.isFinite(pose.attackAge)?Math.max(0,pose.attackAge):Infinity;
 const slam=age<.21?1-smooth(age/.21):0;
 const recover=age>=.21&&age<.68?1-smooth((age-.21)/.47):0;
 const gait=pose.gait||0,leftStep=Math.sin(gait),rightStep=Math.sin(gait+Math.PI);
 const landing=Math.pow(Math.max(0,Math.cos(gait)),18)*move;
 const weight=landing*.48+slam*1.25-wind*1.05+hit*.6;
 c.save();c.scale(1+rise*.2,1+rise*.2);c.fillStyle='rgba(50,33,24,.27)';c.beginPath();c.ellipse(0,0,5.2+rise*1.1,1.4,0,0,Math.PI*2);c.fill();
 c.scale(mirror,1);
 const wallAlpha=1-smooth((rise-.34)/.54),bodyAlpha=smooth(rise/.72);
 if(wallAlpha>.01)paint(c,img,parts.wall,0,-2.45,side?13:15,5.5,0,wallAlpha,.5,.55);
 if(bodyAlpha>.01){
  const footSpread=side?1.2:2.5;
  const feet=[{x:-footSpread+leftStep*move*.65,y:-Math.max(0,leftStep)*move*.65,rect:parts.legL},
   {x:footSpread+rightStep*move*.65,y:-Math.max(0,rightStep)*move*.65,rect:parts.legR}];
  for(const foot of feet)paint(c,img,foot.rect,foot.x,foot.y,side?3.8:4.25,6.8,0,bodyAlpha,.5,1);
  const bodyY=-6.1-rise*3.2+weight;
  paint(c,img,parts.body,0,bodyY,side?9.5:10.9,5.4+rise*3.5,hit*.075,bodyAlpha);
  const shoulderY=-8.9-rise*3.15+weight,shoulderX=side?3.7:5.05;
  const armLift=wind*2.25+recover*.42;
  for(const sign of [-1,1]){
   const x=sign*(shoulderX+(1-rise)*-.75),swing=sign*armLift+sign*Math.sin(gait)*move*.065;
   const h=8.4+slam*2.1;
   paint(c,img,sign<0?parts.armL:parts.armR,x,shoulderY,h*.62,h,swing+hit*sign*.16,bodyAlpha,.5,.11);
  }
  if(rise>.62)paint(c,img,parts.cap,side?1.2:2.1,-13.3+weight,side?3.1:3.6,3.7,0,(rise-.62)/.38*.86);
 }
 if(rise<1&&rise>.08)dust(c,Math.sin(rise*Math.PI)*.42,5.4);
 dust(c,landing*.48+slam*.94,5.4+slam*3.4);
 slamImpact(c,slam);
 if(hit>.05){c.fillStyle=`rgba(235,209,166,${hit*.85})`;
  for(const [x,y] of [[-5,-11],[4,-7],[1,-14]])c.fillRect(x+hit*.6,y-hit*.4,.55,.42);}
 c.restore();
}
