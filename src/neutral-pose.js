const PILOTS=new Set(['hurdle','whistle','tray','sandbag','brush','golem','mud','drone','firefly','android','servo','cogger']);
const states=new WeakMap();
const TAU=Math.PI*2;

const clamp=value=>Math.max(0,Math.min(1,value));
const screenVector=({x=0,y=0})=>({x:(x-y)*.8,y:(x+y)*.42});
const PREVIEW_FACING={
 front:{x:Math.SQRT1_2,y:Math.SQRT1_2},
 back:{x:-Math.SQRT1_2,y:-Math.SQRT1_2},
 right:{x:Math.SQRT1_2,y:-Math.SQRT1_2},
 left:{x:-Math.SQRT1_2,y:Math.SQRT1_2}
};

function initial(m){
 const facing=m.face||{x:0,y:1};
 return{x:m.x,y:m.y,time:0,gait:0,travel:0,move:0,velocity:{x:0,y:0},facing:{...facing},
  direction:directionFor(facing),windup:0,attackAge:Infinity,attackNow:false,preview:null};
}
function stateFor(m){
 let state=states.get(m);
 if(!state){state=initial(m);states.set(m,state);}
 return state;
}

export function isNeutralPilot(m){return PILOTS.has(m?.kind);}

export function directionFor(facing,current='front'){
 const right=(facing?.x||0)-(facing?.y||0),down=(facing?.x||0)+(facing?.y||0);
 const horizontal=current==='left'||current==='right',margin=.16;
 if(horizontal&&Math.abs(down)<=Math.abs(right)+margin){
  if(current==='right'&&right>-.12)return 'right';
  if(current==='left'&&right<.12)return 'left';
 }
 if(!horizontal&&Math.abs(right)<=Math.abs(down)+margin){
  if(current==='front'&&down>-.12)return 'front';
  if(current==='back'&&down<.12)return 'back';
 }
 if(Math.abs(down)>=Math.abs(right))return down>=0?'front':'back';
 return right>=0?'right':'left';
}

export function noteNeutralAttack(m){
 if(!isNeutralPilot(m))return;
 const state=stateFor(m);state.attackAge=0;state.attackNow=true;
}

export function updateNeutralPose(m,dt,{frozen=false}={}){
 if(!isNeutralPilot(m))return;
 const state=stateFor(m),dx=m.x-state.x,dy=m.y-state.y;
 state.x=m.x;state.y=m.y;
 const hit=clamp(Math.max(m.flash||0,m.recoil||0)/Math.max(m.recoilFull||.22,.22));
 if(!frozen){
  const distance=Math.hypot(dx,dy),teleported=distance>4;
  const moving=!teleported&&distance>1e-4&&hit===0;
  const velocity=moving&&dt>0?screenVector({x:dx/dt,y:dy/dt}):{x:0,y:0};
  state.time+=Math.max(0,dt);
  state.velocity=velocity;
  state.move+=((moving?clamp(Math.hypot(velocity.x,velocity.y)/12):0)-state.move)*Math.min(1,dt*14);
  if(moving){state.gait=(state.gait+distance/5*TAU)%TAU;state.travel+=distance;}
  const gaze=m.aggro>0&&m.face?m.face:moving?{x:dx/distance,y:dy/distance}:state.facing;
  const length=Math.hypot(gaze.x,gaze.y)||1;
  state.facing={x:gaze.x/length,y:gaze.y/length};
  state.direction=directionFor(state.facing,state.direction);
  state.windup=m.phase==='windup'?clamp(1-Math.max(0,m.timer)/(m.windupFull||1)):0;
  if(state.attackNow)state.attackNow=false;
  else if(Number.isFinite(state.attackAge)&&m.phase==='recover')state.attackAge+=Math.max(0,dt);
  else if(m.phase!=='recover')state.attackAge=Infinity;
 }
}

export function neutralPose(m){
 const state=stateFor(m),preview=state.preview;
 const recoilWorld={x:m.recoilX||0,y:m.recoilY||0};
 const pose={direction:state.direction,time:state.time,gait:state.gait,move:clamp(state.move),
  velocity:{...state.velocity},facing:{...state.facing},windup:state.windup,
  attackAge:state.attackAge,hit:clamp(Math.max(m.flash||0,m.recoil||0)/Math.max(m.recoilFull||.22,.22)),
  recoil:screenVector(recoilWorld),...(m.kind==='servo'?{travel:state.travel}:{})};
 if(!preview)return pose;
 const facing=PREVIEW_FACING[preview.direction]||pose.facing;
 return{...pose,direction:preview.direction,move:preview.state==='move'?1:0,
  gait:preview.state==='move'?state.time*7:pose.gait,
  ...(m.kind==='servo'?{travel:preview.state==='move'?state.travel+state.time*5:pose.travel}:{}),windup:0,
  attackAge:preview.state==='attack'?(preview.age??0.04):Infinity,hit:preview.state==='hit'?1:0,
  velocity:preview.state==='move'?screenVector(facing):{x:0,y:0},facing:{...facing}};
}

export function previewNeutralPose(m,direction,state,age){
 if(!isNeutralPilot(m))return;
 stateFor(m).preview=direction&&state?{direction,state,age}:null;
}
