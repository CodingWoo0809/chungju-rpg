const SOURCE=new URL('../assets/monsters/sandbag-pilot/sandbag-painted-parts-v1.png',import.meta.url).href;
const GUARDS=new URL('../assets/monsters/sandbag-pilot/sandbag-guard-arms-v2.png',import.meta.url).href;
const TAU=Math.PI*2;
const X=[0,350,548,784,982,1158,1325,1536];
const Y=[0,337,675,1024];
const PARTS=Object.fromEntries(['front','back','right'].map((direction,row)=>[
 direction,Object.fromEntries(['torso','band','armL','armR','shoeL','shoeR','belt'].map((name,col)=>[
  name,[X[col],Y[row],X[col+1]-X[col],Y[row+1]-Y[row]]]))
]));
const ARM_PARTS=Object.fromEntries(['front','back','right'].map((direction,row)=>[
 direction,{
  left:[120,row*340+18,300,315],
  right:[555,row*340+18,325,315]
 }
]));
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};
let atlas=null,guardAtlas=null,loading=null;
export function loadSandbagArt(){
 if(loading)return loading;
 if(typeof Image==='undefined')return Promise.resolve(false);
 atlas=new Image();atlas.decoding='async';
 guardAtlas=new Image();guardAtlas.decoding='async';
 loading=Promise.all([new Promise(resolve=>{atlas.onload=()=>resolve(true);atlas.onerror=()=>{atlas=null;resolve(false);};}),new Promise(resolve=>{guardAtlas.onload=()=>resolve(true);guardAtlas.onerror=()=>{guardAtlas=null;resolve(false);};})]).then(results=>results.every(Boolean));
 atlas.src=SOURCE;guardAtlas.src=GUARDS;return loading;
}
function image(){if(!atlas)loadSandbagArt();return atlas?.complete&&atlas.naturalWidth?atlas:null;}
function armsImage(){if(!guardAtlas)loadSandbagArt();return guardAtlas?.complete&&guardAtlas.naturalWidth?guardAtlas:null;}
function paint(c,img,rect,x,y,w,h,angle=0,alpha=1,pivotX=.5,pivotY=.5){
 c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=alpha;
 c.drawImage(img,...rect,-w*pivotX,-h*pivotY,w,h);c.restore();
}
function shoe(c,img,rect,x,y,angle,alpha){paint(c,img,rect,x,y,2.85,5.9,angle,alpha,.5,.92);}
function guardArm(c,img,rect,arm,angle=0,alpha=1){
 const left=arm.hand==='left';
 paint(c,img,rect,arm.shoulder.x,arm.shoulder.y,5*(arm.scale||1),4.6*(arm.scale||1),angle,alpha*arm.alpha,left?.27:.75,.12);
}
function hookArm(c,img,rect,arm,angle=0,alpha=1){
 c.save();c.translate(arm.shoulder.x,arm.shoulder.y);c.rotate(angle);c.scale(-1,1);
 paint(c,img,rect,0,0,5,4.6,0,alpha*arm.alpha,.75,.12);c.restore();
}
export function sandbagArmPose(direction,{load=0,impact=0,follow=0,hit=0,move=0,time=0}={}){
 const side=direction==='right'||direction==='left',back=direction==='back';
 const sway=Math.sin(time*2.5)*move*.08;
 const far=side
  ?{shoulder:{x:-3.1,y:-1.8},elbow:{x:-2.8,y:1.5},fist:{x:-1.1,y:-.7},alpha:.76,scale:.82,hand:'left'}
  :{shoulder:{x:-3.8,y:-1.8},elbow:{x:-3.4,y:1.8},fist:{x:-1.4,y:-.7},alpha:back?.94:1,hand:'left'};
 const near=side
  ?{shoulder:{x:3.5,y:-1.8},elbow:{x:3.1,y:1.8},fist:{x:1.1,y:-.7},alpha:1,hand:'right'}
  :{shoulder:{x:3.8,y:-1.8},elbow:{x:3.4,y:1.8},fist:{x:1.4,y:-.7},alpha:back?.94:1,hand:'right'};
 far.shoulder.y+=sway+hit*.28;near.shoulder.y-=sway-hit*.35;
 far.fist.y+=sway+hit*.28;near.fist.y-=sway-hit*.35;
 near.fist.x-=load*.45;
 near.fist.x+=impact*6+follow*3.1;
 return[far,near];
}
function hookArc(c,impact,side){
 if(impact<=0)return;
 c.save();c.strokeStyle=`rgba(172,53,39,${impact*.58})`;c.lineWidth=.38;c.lineCap='round';
 c.beginPath();c.moveTo(side*7.1,-12.7);c.quadraticCurveTo(side*10.8,-12.3,side*9.3,-10.7);c.stroke();c.restore();
}
export function drawSandbag(c,m,pose={}){
 void m;const img=image(),armsImg=armsImage();if(!img||!armsImg)return;
 const direction=['front','back','right','left'].includes(pose.direction)?pose.direction:'front';
 const side=direction==='right'||direction==='left',mirror=direction==='left'?-1:1;
 const parts=PARTS[side?'right':direction],armParts=ARM_PARTS[side?'right':direction],time=pose.time||0,move=clamp(pose.move||0);
 const wind=clamp(pose.windup||0),hit=clamp(pose.hit||0);
 const age=Number.isFinite(pose.attackAge)?Math.max(0,pose.attackAge):Infinity;
 const impact=age<.2?1-smooth(age/.2):0;
 const follow=age>=.2&&age<.53?1-smooth((age-.2)/.33):0;
 const gait=pose.gait||0,stepL=Math.sin(gait),stepR=Math.sin(gait+Math.PI);
 const leftLift=Math.max(0,stepL)*move*.68,rightLift=Math.max(0,stepR)*move*.68;
 const load=smooth(wind),pivot=load*.28+impact*.64+follow*.16;
 const recoil=hit*(pose.recoil?.x||0)*.065;
 const bodyLean=-load*.12+impact*.31+follow*.11-recoil+hit*.34;
 c.save();c.fillStyle='rgba(34,25,20,.26)';c.beginPath();c.ellipse(0,0,4.5+impact*.5,1.15,0,0,TAU);c.fill();
 c.scale(mirror,1);
 const stance=side?1.4:2.15;
 const rearX=-stance+stepL*move*1.05+load*.22;
 const leadX=stance+stepR*move*1.05+pivot*.42;
 const rearY=-leftLift,leadY=-rightLift;
 c.strokeStyle='#765039';c.lineWidth=1.75;c.lineCap='round';
 for(const [hip,foot] of [[side?-.9:-1.8,rearX],[side?.75:1.8,leadX]]){
  c.beginPath();c.moveTo(hip,-7.5);c.quadraticCurveTo((hip+foot)*.5,-5.7,foot,-3.85);c.stroke();
 }
 shoe(c,img,parts.shoeL,rearX,rearY,-load*.08+impact*.12,side?.7:1);
 shoe(c,img,parts.shoeR,leadX,leadY,pivot*.2,1);
 c.save();c.translate(-hit*1.45,-10.5+hit*.75);c.rotate(bodyLean*.18-hit*.1);
 const arms=sandbagArmPose(direction,{load,impact,follow,hit,move,time});
 const throwAmount=clamp(impact+follow*.9);
 paint(c,img,parts.torso,bodyLean*.55+pivot*.3+stepL*move*.28,0,side?8.4:8.65,8.5,bodyLean,1);
 if(!side)guardArm(c,armsImg,armParts.left,arms[0],-.2+load*.05-hit*.1);
 guardArm(c,armsImg,armParts.right,arms[1],.2-load*.12+hit*.12,1-throwAmount);
 if(throwAmount>.01)hookArm(c,armsImg,armParts.right,arms[1],-.12+follow*.22,throwAmount);
 if(side)guardArm(c,armsImg,armParts.left,arms[0],-.2+load*.05-hit*.1);
 c.restore();
 hookArc(c,impact,1);
 if(hit>.1){
  c.strokeStyle=`rgba(255,229,183,${hit*.85})`;c.lineWidth=.45;
  c.beginPath();c.moveTo(-5.7,-13.3);c.lineTo(-7,-14);c.lineTo(-6.3,-12.2);c.moveTo(4.7,-8.8);c.lineTo(6,-8.2);c.lineTo(5.5,-10);c.stroke();
 }
 if(impact>.2){
  c.strokeStyle=`rgba(210,173,125,${impact*.65})`;c.lineWidth=.38;
  for(const sign of [-1,1]){c.beginPath();c.moveTo(sign*2.2,-.2);c.quadraticCurveTo(sign*4.2,-1.1,sign*(5.4+impact*1.3),-.1);c.stroke();}
 }
 c.restore();
}
