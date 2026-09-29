const STORAGE_KEY='chungju-rpg-audio-v1';
const DEFAULTS=Object.freeze({volume:.22,mute:false,music:true,effects:true});
const MELODY=[0,4,7,11,7,4,2,7,9,7,4,2,0,7,4,2];
function readPreferences(storage){
 try{const value=JSON.parse(storage?.getItem(STORAGE_KEY)||'null');if(!value||typeof value!=='object')return {...DEFAULTS};return {volume:typeof value.volume==='number'&&Number.isFinite(value.volume)?Math.max(0,Math.min(1,value.volume)):DEFAULTS.volume,mute:typeof value.mute==='boolean'?value.mute:false,music:typeof value.music==='boolean'?value.music:true,effects:typeof value.effects==='boolean'?value.effects:true};}catch{return {...DEFAULTS};}
}
export class GameAudio{
 constructor(options={}){
  try{this.storage=options.storage??globalThis.localStorage;}catch{this.storage=null;}
  this.preferences=readPreferences(this.storage);
  this.createContext=options.createContext||(()=>{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;return Audio?new Audio():null;});
  this.context=null;this.master=null;this.nodes=new Set();this.paused=true;this.disposed=false;this.nextNote=0;this.note=0;this.nextStep=0;this.nextBird=0;this.pending=null;this.unlocking=null;
 }
 settings(){return {...this.preferences};}
 set(key,value){
  if(key==='volume'){if(typeof value!=='number'||!Number.isFinite(value))return false;this.preferences.volume=Math.max(0,Math.min(1,value));}
  else if(['mute','music','effects'].includes(key)&&typeof value==='boolean')this.preferences[key]=value;
  else return false;
  try{this.storage?.setItem(STORAGE_KEY,JSON.stringify(this.preferences));}catch{}
  if(this.preferences.mute||this.preferences.volume===0)this.silence();
  if(key==='music'&&!value)this.stopNodes('music');
  if(key==='effects'&&!value){this.stopNodes('effects');this.pending=null;}
  this.volume();return true;
 }
 async unlock(){
  if(this.disposed)return false;if(this.unlocking)return this.unlocking;
  this.unlocking=this.resumeContext();
  try{return await this.unlocking;}finally{this.unlocking=null;}
 }
 async resumeContext(){
  try{
   if(!this.context){this.context=this.createContext();if(!this.context)return false;this.master=this.context.createGain();this.master.gain.value=0;this.master.connect(this.context.destination);}
   if(this.context.state==='suspended')await this.context.resume();
   this.volume();return this.context.state==='running';
  }catch{return false;}
 }
 audible(){return !this.disposed&&!this.paused&&!this.preferences.mute&&this.preferences.volume>0&&this.context?.state==='running';}
 volume(){if(!this.master)return;const now=this.context.currentTime;this.master.gain.cancelScheduledValues(now);this.master.gain.setValueAtTime(this.audible()?this.preferences.volume:0,now);}
 stopNodes(channel){for(const voice of [...this.nodes])if(!channel||voice.channel===channel){try{voice.osc.stop();}catch{}voice.osc.disconnect();voice.gain.disconnect();this.nodes.delete(voice);}}
 silence(){this.stopNodes();if(this.master){const now=this.context.currentTime;this.master.gain.cancelScheduledValues(now);this.master.gain.setValueAtTime(0,now);}this.nextNote=0;this.nextStep=0;}
 tone(frequency,duration,level=.1,type='sine',delay=0,channel='effects',endFrequency=frequency){
  if(!this.audible()||this.nodes.size>=24)return false;
  const c=this.context,start=c.currentTime+delay,osc=c.createOscillator(),gain=c.createGain();
  osc.type=type;osc.frequency.setValueAtTime(frequency,start);osc.frequency.exponentialRampToValueAtTime(Math.max(20,endFrequency),start+duration);
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(level,start+.015);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  osc.connect(gain);gain.connect(this.master);const voice={osc,gain,channel};this.nodes.add(voice);
  osc.onended=()=>{osc.disconnect();gain.disconnect();this.nodes.delete(voice);};osc.start(start);osc.stop(start+duration+.03);return true;
 }
 play(kind){
  if(!this.preferences.effects||this.preferences.mute||this.disposed)return false;
  if(!this.audible()){if(['success','bell'].includes(kind))this.pending={kind,until:Date.now()+30000};return false;}
  switch(kind){
   case 'success':[523.25,659.25,783.99,1046.5].forEach((f,i)=>this.tone(f,.4,.12,'sine',i*.11));break;
   case 'bell':[659.25,523.25,587.33,392].forEach((f,i)=>{this.tone(f,1,.13,'sine',i*.3);this.tone(f*2,.45,.025,'sine',i*.3);});break;
   case 'heavy':this.tone(150,.2,.3,'triangle',0,'effects',35);break;
   case 'light':case 'attack':this.tone(230,.09,.2,'triangle',0,'effects',65);break;
   case 'hit':this.tone(90,.12,.2,'triangle',0,'effects',35);break;
   case 'dodge':this.tone(320,.16,.07,'sine',0,'effects',110);break;
   case 'step':this.tone(95,.055,.07,'triangle',0,'effects',40);break;
   default:return false;
  }
  return true;
 }
 update(state,paused=false){
  const silent=paused||globalThis.document?.hidden===true;
  if(silent!==this.paused){this.paused=silent;if(silent)this.silence();else this.volume();}
  if(!this.audible()){if(this.nodes.size)this.silence();return;}
  if(this.pending){const pending=this.pending;this.pending=null;if(pending.until>Date.now())this.play(pending.kind);}
  const now=this.context.currentTime;
  if(this.preferences.music&&now>=this.nextNote){
   const campus=state.scene==='campus',base=campus?196:146.83,f=base*2**(MELODY[this.note%MELODY.length]/12);
   this.tone(f,2.2,.07,'sine',0,'music');
   if(this.note%4===0){this.tone(base/2,3,.055,'sine',0,'music');this.tone(base*.75,2.6,.025,'sine',0,'music');}
   this.note++;this.nextNote=now+(campus?1.2:1.6);
  }
  if(this.preferences.effects&&state.player?.moving&&now>=this.nextStep){this.play('step');this.nextStep=now+.33;}
  if(this.preferences.effects&&state.scene==='campus'&&now>=this.nextBird){this.tone(1700,.16,.016,'sine',0,'effects',2200);this.tone(1950,.14,.012,'sine',.19,'effects',1450);this.nextBird=now+13;}
 }
 async dispose(){this.disposed=true;this.pending=null;this.silence();this.master?.disconnect();try{await this.context?.close();}catch{}}
}
