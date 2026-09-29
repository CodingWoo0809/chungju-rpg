import {prepareArchitectureAtlas} from './architecture-atlas.js';

const SOURCE=new URL('../assets/monsters/civil-pilot/survey-sentinel-painted-parts-v1.png',import.meta.url).href;
const X=[0,345,665,955,1250,1536];
const Y=[0,340,680,1024];
const NAMES=['head','hub','legL','legR','rearLeg'];
const PARTS=Object.fromEntries(['front','back','right'].map((direction,row)=>[
 direction,Object.fromEntries(NAMES.map((name,col)=>[
  name,[X[col],Y[row],X[col+1]-X[col],Y[row+1]-Y[row]]
 ]))
]));
const TAU=Math.PI*2;
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};
let atlas=null,source=null,loading=null;

export function loadSurveySentinelArt(){
 if(loading)return loading;
 if(typeof Image==='undefined')return Promise.resolve(false);
 atlas=new Image();atlas.decoding='async';
 loading=new Promise(resolve=>{
  atlas.onload=()=>{source=prepareArchitectureAtlas(atlas,PARTS);resolve(true);};
  atlas.onerror=()=>{atlas=null;resolve(false);};
 });
 atlas.src=SOURCE;return loading;
}

function paint(c,img,rect,x,y,w,h,angle=0,alpha=1,pivotX=.5,pivotY=.5){
 c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=alpha;
 c.drawImage(img,...rect,-w*pivotX,-h*pivotY,w,h);c.restore();
}

function footfall(c,x,amount){
 if(amount<.02)return;
 c.save();c.globalAlpha*=amount;
 c.fillStyle='#9d8565';c.beginPath();c.ellipse(x,-.15,1.5,.38,0,0,TAU);c.fill();
 c.strokeStyle='#d8c4a0';c.lineWidth=.23;
 c.beginPath();c.arc(x,-.25,1.8,Math.PI*1.1,Math.PI*1.9);c.stroke();c.restore();
}

function surveyImpact(c,amount){
 if(amount<.01)return;
 c.save();c.globalAlpha*=amount;
 c.fillStyle='rgba(169,140,97,.66)';
 for(const x of [-5.4,5.4]){
  c.beginPath();c.ellipse(x,-.65,2.5,.85,0,0,TAU);c.fill();
 }
 const rise=(1-amount)*2.2;
 c.fillStyle='#6e5a3d';
 for(const x of [-7.3,-4.6,4.3,7.1]){
  c.beginPath();c.moveTo(x,-.7-rise);c.lineTo(x+.8,-2-rise);
  c.lineTo(x+1.6,-.5-rise);c.closePath();c.fill();
 }
 c.fillStyle='rgba(50,43,31,.72)';
 c.beginPath();c.ellipse(0,-.05,5.8,.48,0,0,TAU);c.fill();
 c.strokeStyle='#726044';c.lineWidth=.42;
 for(const sign of [-1,1]){
  c.beginPath();c.moveTo(sign*2,-.1);c.lineTo(sign*4.8,-1);
  c.lineTo(sign*7,-.4);c.lineTo(sign*8.6,-.85);c.stroke();
 }
 c.strokeStyle='#665944';c.lineWidth=.3;
 c.beginPath();c.moveTo(-1.1,-.2);c.lineTo(1.1,-.2);c.moveTo(0,-1.1);c.lineTo(0,.6);c.stroke();
 c.restore();
}

export function drawSurveySentinel(c,m,pose={}){
 if(!source){loadSurveySentinelArt();return;}
 const direction=['front','back','right','left'].includes(pose.direction)?pose.direction:'front';
 const side=direction==='right'||direction==='left';
 const spriteMirror=direction==='right'?-1:1;
 const parts=PARTS[side?'right':direction];
 const move=clamp(pose.move||0),wind=clamp(pose.windup||0),hit=clamp(pose.hit||0);
 const age=Number.isFinite(pose.attackAge)?Math.max(0,pose.attackAge):Infinity;
 const impact=age<.22?1-smooth(age/.22):0;
 const settle=age>=.22&&age<.58?1-smooth((age-.22)/.36):0;
 const gait=pose.gait||0,time=pose.time||0;
 const stepL=Math.sin(gait),stepR=Math.sin(gait+TAU/3),stepBack=Math.sin(gait+TAU*2/3);
 const liftL=Math.max(0,stepL)*move*1.32,liftR=Math.max(0,stepR)*move*1.32;
 const liftBack=Math.max(0,stepBack)*move*.82;
 const late=smooth((wind-.48)/.52),brace=smooth(wind/.55);
 const lower=impact*2.05+settle*.4;
 const scan=Math.sin(time*.92)*.025*(1-wind);
 const recoil=(pose.recoil?.x||0)*hit*.028;
 c.save();c.fillStyle='rgba(34,32,26,.24)';c.beginPath();c.ellipse(0,0,4.8+impact,1.1,0,0,TAU);c.fill();
 c.scale(spriteMirror,1);
 const stance=side?2.2:3.1;
 const legAngleL=stepL*move*.13+wind*(.1*(1-late)-.17*late)-impact*.17+hit*.09;
 const legAngleR=-stepR*move*.13+wind*(-.1*(1-late)+.17*late)+impact*.17-hit*.09;
 const hipY=-8.6-wind*.88+lower*.45+hit*.2;
 paint(c,source,parts.rearLeg,0,-7.65-brace*.32+liftBack,2.7,8.3,
  stepBack*move*.09-hit*.1,side?.75:.95,.5,.08);
 const far=side?parts.legR:parts.legL,near=side?parts.legL:parts.legR;
 const farX=side?-stance:-stance,nearX=stance;
 paint(c,source,far,farX,hipY-liftL,4.85,9.2,legAngleL,side?.78:1,.5,.08);
 const bodyDrop=Math.abs(stepL-stepR)*move*.22+lower*.85+hit*.36;
 paint(c,source,parts.hub,0,-9.35-wind*.45+bodyDrop,side?7.3:8.3,5.55,
  scan*.35+recoil*.25-hit*.065);
 paint(c,source,near,nearX,hipY-liftR,4.85,9.2,legAngleR,1,.5,.08);
 c.save();c.translate(0,-11.25-wind*.5+bodyDrop);c.rotate(scan-wind*.085+impact*.12+recoil-hit*.16);
 paint(c,source,parts.head,side?.4:0,-3.55,side?8.8:8.4,8.75,
  -late*.045+hit*.12);
 c.restore();
 footfall(c,farX,Math.pow(Math.max(0,-stepL),12)*move*.55);
 footfall(c,nearX,Math.pow(Math.max(0,-stepR),12)*move*.55);
 surveyImpact(c,impact);
 if(hit>.08){c.strokeStyle=`rgba(255,226,156,${hit*.75})`;c.lineWidth=.32;
  c.beginPath();c.moveTo(-4.7,-14);c.lineTo(-6,-14.6);c.moveTo(4,-8.2);c.lineTo(5.4,-7.4);c.stroke();}
 c.restore();
}
