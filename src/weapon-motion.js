export const ATTACK_MOTIONS={
 punch:{
  label:'타격형',
  sheets:{front:'attack',back:'backAttack',right:'rightAttack'},
  contact:{front:3,back:4,right:4},
 },
 swing:{label:'스윙형',rig:true,sheets:{front:'idle',back:'backWalk',right:'right'},contact:{front:3,back:3,right:3}},
 thrust:{label:'찌르기형',rig:true,sheets:{front:'idle',back:'backWalk',right:'right'},contact:{front:4,back:4,right:4}},
};
export const MOTION_FAMILY_KEYS=Object.freeze(Object.keys(ATTACK_MOTIONS));

// 같은 스윙 리그 안에서 무기별 준비와 후속 관성의 차이를 표현한다.
//   windup  준비(뒤로 빼기) 비율 · arc 휘두르는 각도(라디안) · reach 궤적 반경 배수 · follow 타격 후 관성
// 네 번째 모션군을 만들지 않고 이 값만 바꿔 검(빠르고 짧은 후딜)과 파쇄추(큰 준비·늦은 가속·긴 관성)를 가른다.
export const SWING_PROFILE={
 badmintonRacket:{windup:.2,arc:2.0,reach:1,follow:.25},
 'architecture-hero-weapon':{windup:.22,arc:2.1,reach:1.05,follow:.28},
 'architecture-weapon':{windup:.24,arc:2.3,reach:1.2,follow:.3},
 'civil-hero-weapon':{windup:.38,arc:2.4,reach:1.1,follow:.5},
 'civil-weapon':{windup:.42,arc:2.6,reach:1.25,follow:.58},
};
const DEFAULT_SWING={windup:.25,arc:2.1,reach:1,follow:.3};
export function swingProfile(id){return SWING_PROFILE[id]||DEFAULT_SWING;}

// 평소(idle · walk) 한 자루 무기를 드는 각도 — 무기 축이 손에서 뻗는 방향(화면 기준 라디안).
// 정면·후면은 몸 바깥쪽 아래로, 측면은 뒤쪽 아래로 늘어뜨린다. 창은 몸 옆에 세워 든다.
// 한 자루 무기는 몸 뒤 레이어에 그려 스프라이트의 손이 손잡이를 덮게 한다(손에 쥔 것처럼 보이게).
export const HOLD_POSE={
 swing:{front:2.28,back:2.28,right:2.12},
 heavy:{front:2.05,back:2.05,right:1.95},
 upright:{front:-1.95,back:-1.95,right:-1.95},    // 발밑까지 닿는 긴 대검(천공 설계검)은 칼끝을 위로 세워 든다
 thrust:{front:-1.74,back:-1.74,right:-1.86},
};

export function attackHitRatio(family,dir,id){
 const view=dir==='left'?'right':dir;
 if(family==='punch')return ATTACK_MOTIONS.punch.contact[view]/8;
 return family==='thrust'||id?.startsWith('civil-') ? .46 : .4;
}
