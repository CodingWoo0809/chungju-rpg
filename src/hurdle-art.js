const ATLAS_URL=new URL('../assets/monsters/hurdle-pilot/hurdle-painted-parts-v1.png',import.meta.url).href;
const TAU=Math.PI*2;
const PARTS={
 front:{body:[76,148,155,178],mask:[300,78,255,250],railL:[545,48,165,250],railR:[720,48,165,250],legL:[890,45,125,300],legR:[1005,45,125,300],foot:[1280,158,125,178]},
 back:{body:[72,455,165,180],mask:[300,390,255,245],railL:[545,365,165,265],railR:[720,365,165,265],legL:[890,355,125,300],legR:[1005,355,125,300],foot:[1280,460,125,178]},
 right:{body:[50,685,210,285],mask:[270,670,230,285],railL:[505,680,190,270],railR:[695,680,190,270],legL:[890,675,135,300],legR:[1010,700,135,270],foot:[1270,790,135,180]}
};

let atlas=null,atlasPromise=null;
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};

export function loadHurdleArt(){
 if(atlasPromise)return atlasPromise;
 if(typeof Image==='undefined')return Promise.resolve(false);
 atlasPromise=new Promise(resolve=>{
  atlas=new Image();atlas.decoding='async';
  atlas.onload=()=>resolve(true);atlas.onerror=()=>{atlas=null;resolve(false);};atlas.src=ATLAS_URL;
 });
 return atlasPromise;
}

function part(c,rect,x,y,w,h,rotation=0,alpha=1){
 if(!atlas?.complete||!atlas.naturalWidth)return false;
 c.save();c.translate(x,y);c.rotate(rotation);c.globalAlpha*=alpha;
 c.drawImage(atlas,...rect,-w/2,-h,w,h);c.restore();return true;
}

function fallbackPart(c,x,y,w,h,color,rotation=0){
 c.save();c.translate(x,y);c.rotate(rotation);c.fillStyle=color;c.strokeStyle='#47372f';c.lineWidth=.28;
 c.beginPath();c.roundRect(-w/2,-h,w,h,Math.min(w,h)*.3);c.fill();c.stroke();c.restore();
}

function drawPart(c,rect,x,y,w,h,rotation=0,alpha=1,color='#e8ddc3'){
 if(!part(c,rect,x,y,w,h,rotation,alpha))fallbackPart(c,x,y,w,h,color,rotation);
}

function stepAt(gait,offset,move){
 const phase=((gait/TAU+offset)%1+1)%1;
 if(move<.04)return{x:0,lift:0,phase};
 if(phase<.58)return{x:(1-phase/.58)*2-1,lift:0,phase};
 const swing=smooth((phase-.58)/.42);
 return{x:-1+swing*2,lift:Math.sin(swing*Math.PI),phase};
}

function railBridge(c,y,roll,back=false){
 c.save();c.translate(0,y);c.rotate(roll);
 const gradient=c.createLinearGradient(-5.2,0,5.2,0);
 gradient.addColorStop(0,'#b9a789');gradient.addColorStop(.16,'#eee2c5');gradient.addColorStop(.5,back?'#b7a081':'#ded0af');gradient.addColorStop(.84,'#eee2c5');gradient.addColorStop(1,'#9d8c73');
 c.fillStyle=gradient;c.strokeStyle='#594b3e';c.lineWidth=.3;
 c.beginPath();c.roundRect(-5.3,-.75,10.6,1.5,.55);c.fill();c.stroke();
 c.fillStyle='#c66f3f';c.fillRect(-3.5,-.72,1.35,1.44);c.fillRect(2.15,-.72,1.35,1.44);
 c.restore();
}

function foot(c,parts,x,y,flip,alpha=1){
 c.save();c.translate(x,y);if(flip)c.scale(-1,1);
 drawPart(c,parts.foot,0,-1.25,3.4,2.5,0,alpha,'#7d5739');c.restore();
}

function leg(c,rect,hipX,hipY,footX,footY,flip,alpha=1){
 const dx=footX-hipX,dy=footY-hipY,length=Math.hypot(dx,dy);
 c.save();c.translate(hipX,hipY);c.rotate(Math.atan2(dy,dx)-Math.PI/2);if(flip)c.scale(-1,1);
 drawPart(c,rect,0,length/2,2.65,length+.7,0,alpha,'#d7c7a4');c.restore();
 c.fillStyle=`rgba(66,57,51,${.72*alpha})`;c.beginPath();c.arc(hipX+(footX-hipX)*.52,hipY+(footY-hipY)*.52,.46,0,TAU);c.fill();
}

function impactDust(c,age){
 if(!Number.isFinite(age)||age<0||age>.18)return;
 const p=age/.18;c.save();c.globalAlpha*=1-p;c.strokeStyle='#d2ad6d';c.lineWidth=.35;
 for(const side of [-1,1]){c.beginPath();c.moveTo(side*2.2,-.25);c.quadraticCurveTo(side*(4+p*2),-1.4-p,side*(6+p*3),-.3);c.stroke();}
 c.restore();
}

function drawFrontBack(c,pose,direction,state){
 const parts=PARTS[direction],back=direction==='back';
 const left=stepAt(pose.gait||0,0,state.move),right=stepAt(pose.gait||0,.5,state.move);
 const stride=1.35*smooth((state.move-.02)/.25),spread=state.compress*.8+pose.hit*.25;
 const lx=-2.05-spread+left.x*stride*.34,rx=2.05+spread+right.x*stride*.34;
 const ly=state.jumpY-left.lift*1.15*state.move,ry=state.jumpY-right.lift*1.15*state.move;
 const hipY=-6.2+state.bodyY,hipRoll=(right.lift-left.lift)*.055*state.move+state.brace;
 c.save();c.rotate(hipRoll);
 leg(c,parts.legL,-1.25,hipY,lx,ly,false,.92);leg(c,parts.legR,1.25,hipY,rx,ry,true,1);
 foot(c,parts,lx,ly,false,.96);foot(c,parts,rx,ry,true,1);
 drawPart(c,parts.body,0,-8.35+state.bodyY,6.4,5.5,hipRoll*.25,1,back?'#76543b':'#a76943');
 const railY=-11.45+state.bodyY;railBridge(c,railY,hipRoll*.35,back);
 if(back){
  drawPart(c,parts.railL,-3.65,railY-.25,4.6,4.2,.92+state.shoulder,.94);
  drawPart(c,parts.railR,3.65,railY-.25,4.6,4.2,-.92-state.shoulder,1);
 }else{
  drawPart(c,parts.railL,-3.75,railY-.3,4.8,4.4,.95+state.shoulder,.98);
  drawPart(c,parts.railR,3.75,railY-.3,4.8,4.4,-.95-state.shoulder,1);
 }
 drawPart(c,parts.mask,state.headLag,-12.8+state.bodyY,5.4,5.5,state.brace*.55,1,back?'#785a40':'#9a704d');
 c.restore();impactDust(c,pose.attackAge);
}

function drawRight(c,pose,state){
 const parts=PARTS.right,far=stepAt(pose.gait||0,.5,state.move),near=stepAt(pose.gait||0,0,state.move);
 const stride=1.7*smooth((state.move-.02)/.25),farX=-.6+far.x*stride,nearX=.65+near.x*stride;
 const farY=state.jumpY-far.lift*1.1*state.move,nearY=state.jumpY-near.lift*1.25*state.move,hipY=-6.3+state.bodyY;
 leg(c,parts.legR,-.7,hipY,farX,farY,true,.62);foot(c,parts,farX,farY,true,.68);
 drawPart(c,parts.railR,-1.6,-11.6+state.bodyY,4.7,4.6,.76+state.shoulder,.65);
 drawPart(c,parts.body,-.2,-8.55+state.bodyY,5.8,5.7,state.brace*.4,1,'#9b6846');railBridge(c,-11.4+state.bodyY,state.brace*.2,false);
 leg(c,parts.legL,.65,hipY,nearX,nearY,false,1);foot(c,parts,nearX,nearY,false,1);
 drawPart(c,parts.railL,1.45,-11.55+state.bodyY,5,4.8,-.72-state.shoulder,1);
 drawPart(c,parts.mask,.75+state.headLag,-12.8+state.bodyY,4.8,5.4,state.brace*.48,1,'#8a603f');
 impactDust(c,pose.attackAge);
}

export function drawHurdle(c,m,pose={}){
 void m;loadHurdleArt();
 const direction=['front','back','right','left'].includes(pose.direction)?pose.direction:'front';
 const move=clamp(Number.isFinite(pose.move)?pose.move:0),windup=clamp(Number.isFinite(pose.windup)?pose.windup:0),hit=clamp(Number.isFinite(pose.hit)?pose.hit:0);
 const attackAge=Number.isFinite(pose.attackAge)?Math.max(0,pose.attackAge):Infinity;
 const compress=Math.sin(windup*Math.PI*.5)*1.55;
 const launch=smooth((windup-.76)/.24)*1.65;
 const land=attackAge<.14?(1-attackAge/.14)*1.25:0;
 const idle=Math.sin((pose.time||0)*1.7)*.13*(1-move);
 const recoilX=Number.isFinite(pose.recoil?.x)?pose.recoil.x:0;
 const brace=clamp(recoilX*.055,-.22,.22)*hit+(direction==='back'?-1:1)*hit*.07;
 const shoulder=Math.sin((pose.gait||0)+Math.PI)*.09*move+windup*.12;
 const state={move,compress,jumpY:-launch,bodyY:compress-launch+land+idle,brace,shoulder,headLag:-brace*2.4-recoilX*.025*hit};
 c.save();if(direction==='left')c.scale(-1,1);
 if(direction==='right'||direction==='left')drawRight(c,{...pose,attackAge},state);
 else drawFrontBack(c,{...pose,attackAge},direction,state);
 c.restore();
}
