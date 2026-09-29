import {playerAttackPose} from './player-attack-pose.js';
import {drawPlayerAttack} from './player-attack-art.js';
import {ATTACK_MOTIONS} from './weapon-motion.js';
import {PLAYER_HEIGHT} from './player-anchors.js';
const FILES = {
 idle: 'honggildong_idle_v1',
 walk: 'honggildong_walk_front_v2',
 attack: 'honggildong_attack_v1',
 right: 'honggildong_idle_right_v1',
 backWalk: 'honggildong_walk_back_v2',
 rightWalk: 'honggildong_walk_right_v2',
 backAttack: 'honggildong_attack_back_v2',
 rightAttack: 'honggildong_attack_right_v2',
};
const sheets = {};
const travel = new WeakMap();
const previews = new WeakMap();
export const WALK_CYCLE_DISTANCE = 16;

function frameBounds(img, frameSize, frameCount) {
 const canvas = document.createElement('canvas');
 canvas.width = img.width; canvas.height = img.height;
 const ctx = canvas.getContext('2d', {willReadFrequently: true});
 ctx.drawImage(img, 0, 0);
 const {data} = ctx.getImageData(0, 0, img.width, img.height);
 return Array.from({length: frameCount}, (_, frame) => {
  let top = frameSize, bottom = 0;
  for (let y = 0; y < frameSize; y++) {
   for (let x = frame * frameSize; x < (frame + 1) * frameSize; x += 2) {
    if (data[(y * img.width + x) * 4 + 3] > 10) {
     top = Math.min(top, y); bottom = Math.max(bottom, y); break;
    }
   }
  }
  return top <= bottom ? {top, bottom} : {top: 0, bottom: frameSize};
 });
}

export function loadPlayerSprites() {
 // 스윙·찌르기 공격 시트는 weapon-motion.js 의 ATTACK_MOTIONS 에 파일 이름이 적히는 순간 함께 읽는다.
 const extra = Object.values(ATTACK_MOTIONS).flatMap(m => Object.entries(m.files || {}))
  .filter(([key, file]) => file && !FILES[key]);
 for (const [key, file] of [...Object.entries(FILES), ...extra]) {
  const img = new Image();
  img.src = new URL(`../assets/external/spritegen/honggildong_v1/${file}.png`, import.meta.url).href;
  img.onload = () => {
   const frameSize = img.height;
   const frameCount = Math.max(1, Math.round(img.width / frameSize));
   sheets[key] = {img, frameSize, frameCount, bounds: frameBounds(img, frameSize, frameCount)};
  };
 }
}

// 지금까지 불러온 시트(키 → 시트). 옷 입은 시트를 미리 칠해 둘 때 쓴다(outfit-art.js).
export function loadedPlayerSheets() { return sheets; }

export function facingBucket(f) {
 const right = f.x - f.y, down = f.x + f.y;
 if (Math.abs(down) >= Math.abs(right)) return down >= 0 ? 'front' : 'back';
 return right >= 0 ? 'right' : 'left';
}

export function advancePlayerGait(player, distance) {
 if (!Number.isFinite(distance) || distance <= 0 || distance > 10) return;
 travel.set(player, ((travel.get(player) || 0) + distance) % WALK_CYCLE_DISTANCE);
}

export function playerGaitFrame(player, frameCount = 8) {
 return Math.floor((travel.get(player) || 0) / WALK_CYCLE_DISTANCE * frameCount) % frameCount;
}

// Normal attacks begin with anticipation; contact is visited once on the shared clock.
export function playerAttackFrame(progress, frameCount = 8, contactFrame = 3) {

 return Math.min(frameCount - 1, Math.floor(Math.min(1, Math.max(0, progress)) * frameCount));
}

export function previewPlayerPose(player, pose = null) {
 if (pose) previews.set(player, pose);
 else previews.delete(player);
}

const directionSheet = {
 front: {idle: 'idle', walk: 'walk', attack: 'attack'},
 back: {idle: 'backWalk', walk: 'backWalk', attack: 'backAttack'},
 right: {idle: 'right', walk: 'rightWalk', attack: 'rightAttack'},
 left: {idle: 'right', walk: 'rightWalk', attack: 'rightAttack'},
};

// Swing and thrust use the approved idle art as articulated parts, never the punch sheet.
export function attackSheetFor(family, dir) {
 const view = dir === 'left' ? 'right' : dir;
 const motion = ATTACK_MOTIONS[family];
 const key = motion?.sheets?.[view];
 if (key) return {key, family, rig:!!motion.rig, contact: motion.contact?.[view] ?? 3, fallback: false};
 const punch = ATTACK_MOTIONS.punch;
 return {key: punch.sheets[view], family: 'punch', contact: punch.contact[view], fallback: family !== 'punch'};
}

export function pickPlayerFrame(player, time, family = 'punch', equipment=null) {
 const preview = previews.get(player);
 if (preview) {
  const attack = preview.state === 'attack' ? attackSheetFor(family, preview.dir) : null;
  const key = attack ? attack.key : directionSheet[preview.dir][preview.state];
  const sheet = sheets[key];
  if (!sheet) return null;
  return {sheet, key, index: preview.index % sheet.frameCount, mirror: preview.dir === 'left', dir: preview.dir, state: preview.state,
   family: attack?.family, fallback: attack?.fallback, contact: attack?.contact,
   rig:attack?.rig?playerAttackPose(family,preview.dir,preview.index/7,equipment):null};
 }
 const dir = facingBucket((player.attackAnimation?.remaining>0?player.attackAnimation.aim:null) || player.facing || {x: 0, y: 1});
 const mirror = dir === 'left';
 // 공명 타격(Q) · 최고 기술(R)은 공격 자세 없이 무기를 든 기본 자세 그대로 서고, 연출은 combat-vfx.js 가 맡는다.
 const animation = player.attackAnimation?.remaining > 0 && !['q','r'].includes(player.attackAnimation.kind) && (!Object.hasOwn(player.attackAnimation,'equipment') || player.attackAnimation.equipment===equipment) ? player.attackAnimation : null;
 if (animation) {
  const attack = attackSheetFor(family, dir);
  const sheet = sheets[attack.key];
  if (!sheet) return null;
  const progress = Math.min(1, Math.max(0, 1 - animation.remaining / animation.duration));
  return {sheet, key: attack.key, index: playerAttackFrame(progress, sheet.frameCount, attack.contact), mirror, dir, state: 'attack',
   progress, family: attack.family, fallback: attack.fallback, contact: attack.contact,
   rig:attack.rig?playerAttackPose(family,dir,progress,equipment):null};
 }
 if (player.moving) {
  const sheet = sheets[directionSheet[dir].walk];
  if (!sheet) return null;
  return {sheet, key: directionSheet[dir].walk, index: playerGaitFrame(player, sheet.frameCount), mirror, dir, state: 'walk'};
 }
 const sheet = sheets[directionSheet[dir].idle];
 if (!sheet) return null;
 const index = dir === 'front' ? Math.floor(time * 3) % sheet.frameCount : dir === 'back' ? 0 : Math.min(3, sheet.frameCount - 1);
 return {sheet, key: directionSheet[dir].idle, index, mirror, dir, state: 'idle'};
}

const TARGET_HEIGHT = PLAYER_HEIGHT;
const DIRECTION_WIDTH = {
 idle: {front: 1, back: 1, right: .87, left: .87},
 walk: {front: 1, back: 1, right: 1, left: 1},
 attack: {front: 1, back: .91, right: .91, left: .91},
};
// drawPlayerSprite 가 이 프레임을 그리는 크기. 무기의 손 위치(player-anchors.js)도 같은 값으로 옮긴다.
export function spriteGeometry(visual) {
 if(visual.rig){const s=visual.rig.source;return {frameSize:384,top:s.top,bottom:s.bottom,widthScale:s.width};}
 const {sheet, index} = visual;
 const {top, bottom} = sheet.bounds[index];
 return {frameSize: sheet.frameSize, top, bottom, widthScale: DIRECTION_WIDTH[visual.state]?.[visual.dir] ?? 1};
}
export function drawPlayerSprite(ctx, visual) {
 if(visual.rig){drawPlayerAttack(ctx,visual);return;}
 const {sheet, index, mirror} = visual;
 const {img, frameSize} = sheet;
 const {top, bottom} = sheet.bounds[index];
 const scale = TARGET_HEIGHT / Math.max(1, bottom - top);
 const width = frameSize * scale * DIRECTION_WIDTH[visual.state][visual.dir];
 ctx.save();
 if (mirror) ctx.scale(-1, 1);
 ctx.drawImage(img, index * frameSize, 0, frameSize, frameSize,
  -width / 2, -bottom * scale, width, frameSize * scale);
 ctx.restore();
}
