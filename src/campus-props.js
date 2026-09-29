import {surface} from './materials.js';
export const TRAINING_YARD={x:43,y:286,w:128,d:245};
export const CAMPUS_PROPS=[
 {id:'main-gate',x:490,y:531,w:45,d:7,h:12,type:'gate',solid:false},
 {id:'guard-post',x:542,y:512,w:14,d:16,h:13,type:'guardpost',solid:true},   // 교문 바로 옆 수위실 · 상점 (사람 하나 지나갈 틈만 띄운다)
 {id:'electrical-enclosure',x:334,y:478,w:30,d:25,h:10,type:'electrical',solid:true},
 // 사진3·5 · 건축디자인과와 전기전자과 사이의 베이지 벽돌 동아리실.
 {id:'club-house',x:331,y:432,w:36,d:34,h:13,type:'clubhouse',solid:true},
 // 회색 비막이 둘(covered-walk·walk-main)은 자리를 옮기지 않는다. 다만 covered-walk 는 북쪽으로
 // 10칸 연장해 walk-main 을 가로지르게 해서, 네 갈래가 (371,381) 한 점에서 만나게 한다.
 {id:'covered-walk',x:366,y:376,w:10,d:136,h:9.5,type:'canopy',tone:'gray',solid:false},
 // 본관 중앙현관 좌측 입구 ~ 건축디자인과 뒤 ~ 전기전자과 우측 입구를 한 줄로 잇는 비막이 통로.
 {id:'walk-main',x:316,y:376,w:157,d:10,h:9.5,type:'canopy',axis:'x',tone:'gray',solid:false},
 // 사진8 · 전기전자과에서 장이쉼터 쪽: 붉은 벽돌 밴드부 동아리실, 흰 창고, 수돗가, 파란 비막이 통로.
 // 다른 학과 건물들처럼 긴 면을 남북(y)으로 두고(반시계 90°) 잔디밭 구역에 나란히 배치한다.
 // 2026-09 · 등각 화면에서 두 건물이 겹쳐 보이던 문제. 앞뒤(y)로 늘어선 상자는 사이 간격이 건물
 // '폭'보다 커야 실루엣이 안 겹치는데, 폭 22~24 짜리 둘이 6칸 간격으로 붙어 있었다.
 // 밴드부는 북동쪽(장이쉼터가 비켜 준 자리)으로, 창고는 남쪽으로 벌려 화면에서 완전히 떼어 놓았다.
 // 2026-09 · 표시해 준 박스(화면 왼쪽 아래)로 옮겼다. 스크린샷의 투영을 풀어(카메라 418,340 / 줌 9)
 // 박스 네 모서리를 월드 좌표로 역산한 값이다. 겹침은 허용하되 앞뒤 순서는
 // 장이쉼터(먼 모서리 774) > 창고(760) > 밴드부(740) 가 되도록 맞췄다.
 {id:'band-club',x:385,y:292,w:27,d:28,h:12,type:'bandclub',axis:'y',solid:true},
 {id:'store-house',x:381,y:328,w:21,d:22,h:10,type:'whitestore',axis:'y',solid:true},
 // 수돗가와 그 비막이는 한 치수 줄였다(비막이 15x32 → 11x22, 세면대 5.5x20 → 4.5x14).
 // 예전 비막이는 북쪽 끝이 창고 안으로 4칸 박혀 있어서, 건물을 뚫고 나온 것처럼 보였다.
 {id:'washstand',x:384,y:357,w:4.5,d:14,h:3.6,type:'wash',axis:'y',solid:true},
 // 사진9·10 · 전기전자과 옆 통로 → 취업진로부 남쪽 → 승리관 · 꿈키움홀까지 파란 아치 비막이가 한 줄로 이어진다.
 {id:'walk-west',x:150,y:258,w:226,d:9,h:9.5,type:'canopy',axis:'x',solid:false},
 {id:'walk-hall',x:172,y:250,w:9,d:14,h:9.5,type:'canopy',solid:false},
 // 승리관이 뒤로 물러난 만큼 비막이 갈래도 길어져 현관까지 이어진다.
 {id:'walk-jang',x:226,y:224,w:9,d:40,h:9.5,type:'canopy',solid:false},
 // 사진3 · 취업진로부는 일자형이 아니라 ㄱ자다. 북쪽 끝에서 서쪽으로 날개동이 뻗는다.
 {id:'career-wing',x:278,y:154,w:28,d:22,h:10,type:'wing',solid:true},   // 1층 건물
 // 사진8·10 · 취업진로부 오른쪽 주차 비막이 ~ 전기전자과 옆 통로가 한 줄로 이어진다.
 // 서쪽(전기전자과 쪽)에 32칸 잔디 띠를 남기기 위해 통로를 x 350 으로 밀었다.
 {id:'walk-career',x:366,y:158,w:11,d:236,h:9.5,type:'canopy',pillarStep:13,solid:false},
 // 사진2 · 비막이 아래 주차 구획. 기둥 사이(간격 13)마다 한 대씩 비막이에 코를 대고 줄지어 선다.
 // 2026-09 · 비막이가 동쪽(x 366)으로 옮겨가면서 주차도 비막이 서쪽 잔디로 붙였다 —
 // 동쪽에 두면 토목시스템과 좌측 출입구(386,196.5)를 막는다.
 // 사진에서 은색 세단 한 대를 시작으로 짙은 차들이 쭉 이어지므로 여섯 대를 같은 간격으로 세운다.
 {id:'career-car-1',x:352,y:162,w:13,d:8.6,h:4.6,type:'car',axis:'x',tone:'#d8d6cd',solid:true},
 {id:'career-car-2',x:352,y:175,w:13,d:8.6,h:4.6,type:'car',axis:'x',tone:'#3f454a',solid:true},
 {id:'career-car-3',x:352,y:188,w:13,d:8.6,h:4.6,type:'car',axis:'x',tone:'#e8e6dd',solid:true},
 {id:'career-car-4',x:352,y:201,w:13,d:8.6,h:4.6,type:'car',axis:'x',tone:'#2f343a',solid:true},
 {id:'career-car-5',x:352,y:214,w:13,d:8.6,h:4.6,type:'car',axis:'x',tone:'#4a4f54',solid:true},
 {id:'career-car-6',x:352,y:227,w:13,d:8.6,h:4.6,type:'car',axis:'x',tone:'#9aa0a4',solid:true},
 // 주차 구획선 — 비막이 기둥 사이마다 한 칸
 {id:'career-parking',x:351,y:158,w:16,d:82,h:.2,type:'parking',axis:'y',step:13,solid:false},
 // 사진11 · 수돗가 위 아치형 비막이.
  {id:'wash-canopy',x:381,y:353,w:11,d:22,h:9,type:'canopy',tone:'bronze',solid:false},
 // 사진2 · 취업진로부와 밴드부 동아리실 사이, 비막이 옆 보도블럭 위의 수돗가.
 // 바닥에 파인 콘크리트 테두리 + 금속 그레이팅 + 긴 급수 배관과 감아 둔 초록 호스 + 놋쇠 밸브함 둘.
 {id:'career-tap',x:379,y:262,w:18,d:10,h:4.6,type:'waterpoint',solid:true},
 // ── 자동화기계과 일대(사진1~4) ─────────────────────────────────────────────
 // 사진1 · 급식소 쪽 증축부 카페 출입구(동측 외벽 y 358~368) 앞에 선 독립 태양광 구조물.
 // 지붕 위가 아니라 기둥 위에 비스듬히 올라간 형태라, 입구 앞 그늘막처럼 서 있다.
 // 벽에 바짝 붙이면 등각 화면에서 입구를 덮어 버리므로, 입구 정면에서 동쪽으로 한 발 물려 세웠다.
 // 그러면 화면에서 입구 오른쪽에 나란히 서서 둘 다 보인다.
 // 카페 증축부가 북쪽으로 40칸 옮겨가면서(world.js) 그 앞 태양광 구조물도 같은 만큼 따라 올라간다.
 {id:'machine-solar',x:243,y:329,w:15,d:14,h:8.6,type:'solarpv',solid:false},
 // 사진1~3 · 두 건물 사이를 관통하는 비막이길. 전기전자과 좌측 출입구에서 나오면 꺾이는 곳 없이
 // 자동화기계과 우측 현관까지 곧장 이어진다 — 축은 world.js 의 CORRIDOR_AXIS(y 443.5)이고,
 // 세 문(machine:right · electric:left · electric:right)이 전부 그 위에 있다. 폭 7 이라 y 440~447.
 {id:'machine-walk',x:244,y:377.5,w:31,d:7,h:9.5,type:'canopy',axis:'x',solid:false},
 // (2026-09 삭제) 전기전자과 동측 벽을 따라 세로로 붙였던 비막이(electric-walk)는 실제로 없는
 // 구조물이라 제거했다. 동쪽에서 오는 비막이길은 기존 walk-main 이 그대로 담당한다.
 // 사진2 · 비막이 통로 옆 야외 수돗가 — 긴 금속 세면대와 나란한 수도꼭지, 그 위 비막이 지붕.
 {id:'machine-wash-canopy',x:252,y:451,w:14,d:23,h:8.6,type:'canopy',tone:'bronze',solid:false},
 {id:'machine-wash',x:256,y:455,w:5.5,d:16,h:3.6,type:'wash',axis:'y',solid:true},
 // 사진3 · 솔라카 제작소 — 자동화기계과 동측, 교문에 가까운 낮고 긴 빨간 벽돌 실습동.
 // 위치·폭은 예전 벽돌 창고 그대로 두어 통로 폭과 충돌을 바꾸지 않는다. 길이는 존재감을 위해
 // 47→48 로만 살짝 늘렸다 — 남쪽 servo 스폰(264,525)은 solid() 여유폭(3)까지 감안해도
 // 걸리지 않는 한계선이다(473+48+3=524<525).
 {id:'brick-storage',x:246,y:473,w:22,d:48,h:12,type:'solarcar',solid:true},
 // 사진3 · 제작소 앞 포장 바닥을 따라 길게 이어지는 선형 배수로 그레이팅.
 {id:'machine-gutter',x:270,y:452,w:2,d:92,h:.1,type:'gutter',axis:'y',solid:false},
 // (2026-09 삭제) 교문 쪽 보조 출입구 두 개(machine-gate-door · electric-gate-door)는 실제 사진에
 // 없는 문이라 뺐다. 자동화기계과의 출입구는 우측 현관 하나로 정리한다.
 {id:'training-road-fence',x:43,y:531,w:128,d:1,h:6,type:'fence',solid:true},
 // 사진4 · 측량공간(야외 실습장)을 두르는 초록 메시 담장과 발치의 돌.
 // 북쪽은 x 140 까지만 막고 그 동쪽을 출입구로 비워 둔다(안으로 들어갈 수 있어야 한다).
 {id:'yard-fence-north',x:43,y:285,w:97,d:1,h:6.4,type:'meshfence',axis:'x',solid:true},
 {id:'yard-fence-east',x:170,y:300,w:1,d:231,h:6.4,type:'meshfence',axis:'y',solid:true},
 // 사진6 · 자동화기계과 후면 광장: 화강석 계단과 손잡이, 노란 점자블록, 선형 배수로.
 // 건물 북쪽 벽이 40칸 올라갔으므로(y 341→301) 후면 광장도 그대로 40칸 따라 올라간다 —
 // 뒷문(215,296)과의 간격, 급식소 쪽 비막이길(walk-west, y 258~267)과의 간격 모두 유지된다.
 {id:'plaza-step',x:196,y:282,w:44,d:7,h:1.6,type:'plazastep',solid:false},
 {id:'plaza-tactile',x:196,y:290,w:44,d:2.2,h:.15,type:'tactile',axis:'x',solid:false},
 {id:'plaza-gutter',x:150,y:278,w:150,d:2,h:.1,type:'gutter',axis:'x',solid:false},
 {id:'plaza-gutter-hall',x:148,y:250,w:2,d:70,h:.1,type:'gutter',axis:'y',solid:false},
 // 사진1 · 본관과 건축디자인과 사이 길: 주차 구획, 돌출 창고, 볼라드, 자전거 거치대.
 {id:'design-bollards-east',x:450,y:390,w:1.4,d:120,h:3.2,type:'bollard',axis:'y',solid:false},
 {id:'design-bollards-south',x:380,y:511,w:68,d:1.4,h:3.2,type:'bollard',axis:'x',solid:false},
 {id:'main-road-bikes',x:467,y:412,w:4,d:34,h:3.4,type:'bikerack',axis:'y',solid:false},
 // 사진6 · 장이쉼터 쪽 주차 구획. (토목시스템과 앞을 가리던 사각 비막이 구조는 제거)
 {id:'main-west-parking',x:454,y:166,w:17,d:206,h:.2,type:'parking',axis:'y',solid:false},
 // 사진4 · 토목시스템과 앞 야외무대.
 {id:'civil-stage',x:400,y:253,w:32,d:11,h:4,type:'outdoor-stage',solid:true},
 // 사진9 · 운동장 구령대.
 {id:'podium',x:546,y:230,w:28,d:26,h:7,type:'podium',solid:true},
 // 본관 2층 사진 · 운동장 뒤쪽(교문 반대편)에서 교문 쪽으로:
 // 뒤쪽 두 단 단차(둔덕) → 파란 코트(본관 공동현관 y 298.5 선까지) → 골대 2개 → 햇빛막이 응원석 → 담장.
 {id:'back-terrace',x:540,y:44,w:220,d:48,h:4.4,type:'terrace',ground:true,solid:true},
 // 코트는 트랙 바깥으로 한 칸 물린다. 그래서 운동장 둘레의 트랙이 코트 앞에서 끊기지 않는다.
 // 논리 경계는 골대·응원석과의 기존 배치 관계를 유지하고, 실제 도장은 트랙 바깥에서 시작한다.
 // 그래서 트랙 띠를 덮지 않으면서도 코트 설비와 충돌 범위는 바뀌지 않는다.
 {id:'blue-court',x:730,y:95,w:22,d:203,h:.2,type:'bluecourt',paintX:742,hoops:[124,174],solid:false},
 // 뒤쪽 골대는 장성관(체육관 · 남쪽)만 바라보는 외편, 가운데 골대는 앞뒤 양면.
 {id:'court-hoop-back',x:735,y:120,w:7,d:8,h:13,type:'hoop',face:'south',solid:false},
 {id:'court-hoop-mid',x:735,y:170,w:7,d:8,h:13,type:'hoop',face:'both',solid:false},
 {id:'cheer-stand',x:753,y:160,w:10,d:138,h:6.6,type:'bleachers',noFade:true,solid:true},
 {id:'court-bench-1',x:753,y:114,w:3,d:12,h:3.2,type:'parkbench',axis:'y',solid:false},
 {id:'court-bench-2',x:753,y:132,w:3,d:12,h:3.2,type:'parkbench',axis:'y',solid:false},
 // 사진3 · 뒤쪽 잔디 위에 놓인 벤치들
 {id:'back-bench-1',x:576,y:62,w:11,d:3,h:3.2,type:'parkbench',axis:'x',lift:4.4,solid:false},
 {id:'back-bench-2',x:644,y:62,w:11,d:3,h:3.2,type:'parkbench',axis:'x',lift:4.4,solid:false},
 {id:'back-bench-3',x:706,y:62,w:11,d:3,h:3.2,type:'parkbench',axis:'x',lift:4.4,solid:false},
 // 사진7 · 풋살 골대.
 {id:'futsal-1',x:560,y:148,w:4,d:20,h:8,type:'futsal',face:'east',solid:false},
 {id:'futsal-2',x:560,y:300,w:4,d:20,h:8,type:'futsal',face:'east',solid:false},
 {id:'futsal-3',x:718,y:148,w:4,d:20,h:8,type:'futsal',face:'west',solid:false},
 {id:'futsal-4',x:718,y:300,w:4,d:20,h:8,type:'futsal',face:'west',solid:false}
];
// 사진1 · 회색 증축부 앞 잔디에 놓인 둥근 관목들과, 사진2 의 비막이 옆 작은 화단.
for(const [i,[x,y]] of [[332,262],[334,300],[324,420],[332,340],[336,382],[320,318],[380,412],[380,452],[380,492],
 [382,170],[382,206],[382,242],[296,236],[352,222],[196,258],[196,272],[556,392],[600,392],
 // 카페 증축부 앞 관목 두 그루도 증축부를 따라 북쪽으로 40칸 이동(y 344→304, 340→300).
 // 아래 둘은 현관·비막이길 옆 화단이라 그대로 둔다.
 [241,304],[241,388],[249,300],[241,424]].entries())
 CAMPUS_PROPS.push({id:`shrub-${i}`,x,y,w:5,d:4,h:3.2,type:'shrub',solid:false});
for(let i=0;i<16;i++)CAMPUS_PROPS.push({id:`yard-rock-${i}`,x:46+i*7.8,y:535+(i%2),w:4.5,d:2.6,h:1.2+(i%3)*.3,type:'rock',solid:false});
const COLORS={brick:'#815244',mortar:'#b79a85',utility:'#c3c8bb',fence:'#55996b',blue:'#439bbb',white:'#e5e4d8'};
function fence(d,ax,ay,bx,by,h){
 const length=Math.hypot(bx-ax,by-ay),point=(t,z)=>({x:ax+(bx-ax)*t,y:ay+(by-ay)*t,z});
 d.poly([point(0,0),point(1,0),point(1,h),point(0,h)],'#55996b15');
 for(let z=1;z<=h;z+=1)d.line([point(0,z),point(1,z)],'#55996b66',.5);
 for(let p=0;p<=length;p+=1.5)d.line([point(p/length,0),point(p/length,h)],'#55996b66',.5);
 for(let p=0;p<=length;p+=7)d.line([point(p/length,0),point(p/length,h+.6)],COLORS.fence,1.8);
 d.line([point(0,h),point(1,h)],COLORS.fence,1.1);
}
function windowPanel(d,x,y,w,h,z,side=false){
 const p=(u,v)=>({x:side?x:x+u,y:side?y+u:y,z:z+v});
 d.poly([p(0,0),p(w,0),p(w,h),p(0,h)],'#47616c','#d3d7ce',.8);
 d.poly([p(.4,h-.4),p(w-.4,h-.4),p(w*.65,h*.45),p(.4,h*.25)],'#c3d8d022');
 for(let u=3;u<w;u+=3)d.line([p(u,0),p(u,h)],'#a6b2ac',.7);
}
function shed(d,o){
 const {x,y,w,d:depth,h}=o,brick=o.type==='storage';
 d.rect(x+2,y+2,w+2,depth+3,'#26342b20');
 d.box(x,y,w,depth,h,COLORS.white,brick?COLORS.brick:COLORS.utility,brick?'#68483f':'#9ca79c');
 if(brick){
  for(let z=1;z<h-.7;z+=.85){
   d.line([{x,y:y+depth,z},{x:x+w,y:y+depth,z},{x:x+w,y,z}],COLORS.mortar+'55',.55);
   for(let u=(Math.round(z/.85)%2)*1.7;u<w;u+=3.4)d.line([{x:x+u,y:y+depth,z},{x:x+u,y:y+depth,z:z+.75}],COLORS.mortar+'44',.45);
   for(let v=(Math.round(z/.85)%2)*1.7;v<depth;v+=3.4)d.line([{x:x+w,y:y+v,z},{x:x+w,y:y+v,z:z+.75}],COLORS.mortar+'44',.45);
  }
 }else{
  for(let z=3;z<h;z+=3)d.line([{x,y:y+depth,z},{x:x+w,y:y+depth,z},{x:x+w,y,z}],'#7f8c8135',.6);
 }
 windowPanel(d,x+3,y+depth+.05,w-6,2.3,7.5);
 windowPanel(d,x+w+.05,y+depth*.35,depth*.36,2.3,7.5,true);
 d.box(x-.6,y-.6,w+1.2,depth+1.2,1.1,COLORS.white,'#d3d5c9','#b7bfb4',h);
 d.rect(x+1.1,y+1.1,w-2.2,depth-2.2,'#a8b3a5',h+1.15);
 d.line([{x:x+1.4,y:y+depth-1.4,z:h+1.2},{x:x+w-1.4,y:y+depth-1.4,z:h+1.2}],'#64756b66',.7);
 if(!brick){
  for(const offset of [4,11,18]){d.box(x+offset,y+5,3,4,1.4,'#aeb8ac','#89988b','#738476',h+1.2);for(let n=0;n<3;n++)d.line([{x:x+offset+.4,y:y+5.7+n,z:h+2.65},{x:x+offset+2.6,y:y+5.7+n,z:h+2.65}],'#53685c',.6);}
 }
}
function electrical(d,o){
 const {x,y,w,d:depth,h}=o;
 d.rect(x,y,w,depth,'#b6b9a8');
 fence(d,x,y,x+w,y,h);fence(d,x,y,x,y+depth,h);
 for(let i=0;i<4;i++){
  const bx=x+2+i*6.5,by=y+4;
  d.box(bx,by,5.8,13,.8,'#a4ac9c','#959d90','#818f80');
  d.box(bx,by,5.8,13,7.6,'#c3c8bb','#b4bdac','#8f9f90',.8);
  d.box(bx-.25,by-.25,6.3,13.5,.45,'#d4d7cb','#a8b2a2','#879b8b',8.4);
  d.line([{x:bx+2.9,y:by+13.05,z:1.4},{x:bx+2.9,y:by+13.05,z:8}],'#667d6a',.7);
  for(let z=5;z<7;z+=.5)d.line([{x:bx+.8,y:by+13.06,z},{x:bx+2.2,y:by+13.06,z}],'#617864',.6);
  d.line([{x:bx+3.4,y:by+13.1,z:3.8},{x:bx+3.4,y:by+13.1,z:4.8}],'#52695a',1);
  d.poly([{x:bx+3.6,y:by+13.1,z:6},{x:bx+4.9,y:by+13.1,z:6},{x:bx+4.25,y:by+13.1,z:7.2}],'#d8bb52','#6e734e',.5);
 }
 fence(d,x+w,y,x+w,y+depth,h);fence(d,x,y+depth,x+w,y+depth,h);
}
function canopy(d,o){
 const {x,y,w,d:depth,h}=o;
 d.rect(x,y,w,depth,'#b5b1a3');
 for(let v=1;v<depth;v+=10)for(const u of [.5,w-.5])d.box(x+u,y+v,.35,.35,h-1,'#a1aaa0','#8c9d92','#63776a');
 const p=(u,v)=>({x:x+u,y:y+v,z:h-1+Math.sin(u/w*Math.PI)*2});
 const light=o.tone==='white'?'#f1efe4':COLORS.white,dark=o.tone==='white'?'#dcded2':COLORS.blue;
 for(let v=0;v<depth;v+=6)for(let u=0;u<w;u+=1){const end=Math.min(v+6,depth);d.poly([p(u,v),p(u+1,v),p(u+1,end),p(u,end)],Math.floor(v/6)%2?light:dark);}
 for(let v=0;v<=depth;v+=6){const points=[];for(let u=0;u<=w;u++)points.push(p(u,v));d.line(points,'#a5c0bf',.65);}
 d.line([p(0,0),p(0,depth)],'#b9c7bc',1);d.line([p(w,0),p(w,depth)],'#b9c7bc',1);
}
function rock(d,o){
 const {x,y,w,d:depth,h}=o;
 d.ellipse(x+w/2,y+depth/2,w*.6,depth*.6,'#27372a22');
 const a={x,y:y+depth*.4,z:0},b={x:x+w*.2,y:y+depth,z:0},c={x:x+w,y:y+depth*.7,z:0},e={x:x+w*.8,y:y+depth*.2,z:h},f={x:x+w*.25,y,z:h*.8};
 d.poly([a,b,c,e,f],'#82897c');d.poly([b,c,e,{x:x+w*.4,y:y+depth*.7,z:h}],'#677565');d.poly([a,f,e,{x:x+w*.4,y:y+depth*.7,z:h}],'#a6ac9e');
}

function parking(d,o){
 const alongY=o.axis!=='x';
 d.rect(o.x,o.y,o.w,o.d,'#8d918a2e');
 d.rect(o.x,o.y,o.w,o.d,null,.02,'#e8e6d8aa');
 const span=alongY?o.d:o.w,step=o.step??(alongY?13:11);
 for(let t=step;t<span;t+=step)
  d.line(alongY?[{x:o.x,y:o.y+t},{x:o.x+o.w,y:o.y+t}]:[{x:o.x+t,y:o.y},{x:o.x+t,y:o.y+o.d}],'#e8e6d8cc',1.4);
}
// 사진8 · 취업진로부 옆 비막이 아래 주차된 차.
function car(d,o){
 // axis:'x' 면 차 길이가 x 축을 향한다(비막이에 코를 대고 선 모양). 기본은 y 축.
 const alongY=o.axis!=='x',body=o.tone||'#dcdcd4',dark='#2c3339';
 const L=alongY?o.d:o.w,S=alongY?o.w:o.d;                 // 길이 · 폭
 // (s,l) = (폭 방향, 길이 방향) 오프셋을 월드 좌표로 옮긴다
 const B=(sx,l,sw,ll,h,roof,wall,side,z=0)=>d.box(alongY?o.x+sx:o.x+l,alongY?o.y+l:o.y+sx,
  alongY?sw:ll,alongY?ll:sw,h,roof,wall,side,z);
 const R=(sx,l,sw,ll,fill,z)=>d.rect(alongY?o.x+sx:o.x+l,alongY?o.y+l:o.y+sx,
  alongY?sw:ll,alongY?ll:sw,fill,z);
 const P=(sx,l,z)=>({x:alongY?o.x+sx:o.x+l,y:alongY?o.y+l:o.y+sx,z});
 d.ellipse(o.x+o.w/2,o.y+o.d/2,alongY?S*.56:L*.52,alongY?L*.52:S*.56,'#26342b26');
 for(const sx of [1.2,S-1.9])for(const l of [2,L-3.4])B(sx,l,.7,1.4,1.1,dark,dark,'#1c2226');
 B(.4,1.2,S-.8,L-2.4,2.4,body,body,'#00000018',1);
 B(1.4,3.6,S-2.8,L-8,1.9,'#b9c6c9','#7e9299','#00000020',3.4);
 d.poly([P(1.6,3.7,3.5),P(S-1.6,3.7,3.5),P(S-1.6,3.7,5.1),P(1.6,3.7,5.1)],'#9fb4bb');
 R(1.6,4,S-3.2,L-8.6,'#cfd9d9',5.35);
 d.line([P(.6,L-1.4,2.2),P(S-.6,L-1.4,2.2)],'#00000022',1.4);
}
function bollard(d,o){
 const alongY=o.axis!=='x',span=alongY?o.d:o.w;
 for(let t=0;t<span;t+=7){
  const x=alongY?o.x:o.x+t,y=alongY?o.y+t:o.y;
  d.box(x,y,1.4,1.4,o.h,'#d7d2c4','#c9542f','#8f8b7f');
  d.box(x,y,1.4,1.4,.5,'#e7e3d6','#e7e3d6','#b6b2a5',o.h*.62);
 }
}
function bikerack(d,o){
 const alongY=o.axis!=='x',span=alongY?o.d:o.w;
 for(let t=1;t<span;t+=4.5){
  const x=alongY?o.x:o.x+t,y=alongY?o.y+t:o.y,w=alongY?o.w:1,dd=alongY?1:o.d;
  d.line([{x,y,z:0},{x,y,z:o.h},{x:x+w,y:y+dd,z:o.h},{x:x+w,y:y+dd,z:0}],'#c9ccc4',1.8);
  d.line([{x,y,z:o.h*.55},{x:x+w,y:y+dd,z:o.h*.55}],'#aeb3aa',1.2);
 }
}
// 사진9 · 구령대: 콘크리트 단, 녹색 곡면 지붕, 스테인리스 난간과 측면 계단.
function podium(d,o){
 const {x,y,w,d:depth,h}=o;
 d.rect(x+2,y+2,w+2,depth+2,'#26342b1e');
 d.box(x,y,w,depth,h,'#dcd9cc','#e2dfd2','#b3b1a4');
 d.box(x+.6,y+.6,w-1.2,depth-1.2,.5,'#cfccbf','#cfccbf','#a9a79a',h);
 for(const [u,v] of [[x+1.5,y+1.5],[x+w-2.5,y+1.5],[x+1.5,y+depth-2.5],[x+w-2.5,y+depth-2.5]])
  d.box(u,v,.8,.8,9,'#9aa39c','#b9c0b8','#7c867f',h+.5);
 for(let i=0;i<3;i++)                                       // 난간
  d.line([{x:x+1.9,y:y+1.9,z:h+2+i*3},{x:x+w-2.1,y:y+1.9,z:h+2+i*3},{x:x+w-2.1,y:y+depth-2.1,z:h+2+i*3}],'#c6ccc4',1.2);
 const rise=3.2,seg=14;                                     // 곡면 지붕
 const arc=t=>h+9.5+Math.sin(t*Math.PI)*rise;
 for(let i=0;i<seg;i++){
  const a=i/seg,b=(i+1)/seg;
  d.poly([{x:x+1,y:y+depth*a,z:arc(a)},{x:x+w-1,y:y+depth*a,z:arc(a)},{x:x+w-1,y:y+depth*b,z:arc(b)},{x:x+1,y:y+depth*b,z:arc(b)}],i<2?'#4f7d4e':'#5d8a5a');
 }
 for(let i=0;i<=seg;i++){const t=i/seg;d.line([{x:x+1,y:y+depth*t,z:arc(t)+.1},{x:x+w-1,y:y+depth*t,z:arc(t)+.1}],'#3f6a41aa',.6);}
 for(let s=0;s<4;s++)d.box(x+w,y+depth-4-s*2.4,3.4,2.4,h-s*1.7,'#d0cdc0','#bdbab0','#a3a196');
 d.line([{x:x+w+3.4,y:y+depth-4,z:h+2},{x:x+w+3.4,y:y+depth-13,z:2}],'#c6ccc4',1.6);
}
// 사진8 · 담장 앞 농구 골대.
// 본관 2층 사진 · 코트 골대. face 가 'both' 면 앞뒤 두 방향으로 백보드가 달린 양면 골대다.
function courtHoop(d,o){
 const {x,y,w,d:depth,h}=o,cx=x+w/2,cy=y+depth/2;
 const faces=o.face==='both'?[1,-1]:o.face==='north'?[-1]:[1];
 d.ellipse(cx,cy,3.2,1.8,'#26342b22');
 d.box(cx-1.6,cy-1.6,3.2,3.2,.5,'#8e968f','#a3aba4','#767f78');            // 기초
 d.box(cx-.8,cy-.8,1.6,1.6,h-2.6,'#9aa39c','#b3bab2','#7d867f',.5);        // 기둥
 for(const dir of faces){
  const arm=cy+dir*3.4,board=cy+dir*5.2;
  d.line([{x:cx,y:cy,z:h-2.6},{x:cx,y:arm,z:h-2.2},{x:cx,y:board,z:h-1.9}],'#9aa39c',2.4);
  d.poly([{x:cx-3.3,y:board,z:h-5.6},{x:cx+3.3,y:board,z:h-5.6},
          {x:cx+3.3,y:board,z:h},{x:cx-3.3,y:board,z:h}],'#f2f0e6','#8c9690',1.1);
  d.poly([{x:cx-1.4,y:board+dir*.06,z:h-4.6},{x:cx+1.4,y:board+dir*.06,z:h-4.6},
          {x:cx+1.4,y:board+dir*.06,z:h-2.8},{x:cx-1.4,y:board+dir*.06,z:h-2.8}],null,'#b07050',1.1);
  d.ellipse(cx,board+dir*2.2,2.3,1.1,null,h-5.1,'#c9723f');
  for(let i=0;i<7;i++){const a=i/7*Math.PI*2;
   d.line([{x:cx+Math.cos(a)*2.1,y:board+dir*2.2+Math.sin(a)*1,z:h-5.1},{x:cx,y:board+dir*2.2,z:h-7.3}],'#e6e4d8',.8);}
 }
}
// 사진2·3 · 운동장 뒤쪽의 길게 이어진 두 단 단차. 윗면은 운동장과 이어지는 잔디다.
function terrace(d,o){
 const {x,y,w,d:depth,h}=o,riser=h/2,tread=3.6;
 d.rect(x+1.5,y+1.5,w+2,depth+2,'#26342b1e');
 for(let i=0;i<2;i++){                                               // 아래 단 → 위 단, 화강석 블록 두 켜
  const sy=y+depth-tread*(2-i),sz=riser*(i+1);
  d.box(x,sy,w,tread,sz,'#cfcabb','#d6d1c2','#aaa598');
  for(let u=0;u<w;u+=7.5)d.line([{x:x+u,y:sy+tread,z:sz-riser},{x:x+u,y:sy+tread,z:sz}],'#a09b8e88',.7);   // 블록 줄눈
  d.line([{x,y:sy+tread,z:sz},{x:x+w,y:sy+tread,z:sz}],'#efece0',1.1);
 }
 d.box(x,y,w,depth-tread*2,h,'#6f8a5a','#d6d1c2','#aaa598');         // 둔덕 본체
 surface(d,x+.4,y+.4,w-.8,depth-tread*2-.4,'grass',h+.03);           // 윗면 잔디
 d.rect(x+.4,y+.4,w-.8,depth-tread*2-.4,'#57794622',h+.04);
 for(let u=0;u<w;u+=7.5)d.line([{x:x+u,y:y+depth-tread*2,z:0},{x:x+u,y:y+depth-tread*2,z:h}],'#a09b8e77',.7);
 for(let u=6;u<w;u+=11)d.ellipse(x+u,y+depth-tread*2-2,2.6,1.1,'#4f7143aa',h+.04);   // 잔디 가장자리
}
// 본관 2층 사진 · 파란 우레탄 코트. 골대 두 개 사이가 실제 경기 코트이고, 나머지는 그냥 파란 포장이다.
function blueCourt(d,o){
 const {x:logicalX,y,w,d:depth}=o,x=o.paintX??logicalX,line='#eef2ee',hoops=o.hoops||[];
 d.rect(x-1.4,y-1.4,w+2.8,depth+2.8,'#7d8f86');                        // 코트 둘레 회색 턱
 d.rect(x,y,w,depth,'#3d84b4');                                        // 파란 우레탄
 for(let v=0;v<depth;v+=6)d.rect(x,y+v,w,3,'#ffffff10');               // 롤러 자국
 surface(d,x,y,w,depth,'court',.01);                                   // Revision 60 · 우레탄 알갱이 결(투명 덧칠 · 색·라인 불변)
 d.rect(x+1.6,y+1.6,w-3.2,depth-3.2,null,.02,line);                    // 바깥 라인
 if(hoops.length<2)return;
 const cx=x+w/2,[a,b]=hoops,mid=(a+b)/2,half=Math.abs(b-a)/2;
 d.rect(x+1.6,a-half*.25,w-3.2,(b-a)+half*.5,null,.025,line);          // 경기 코트 사이드 라인
 d.line([{x:x+1.6,y:mid,z:.03},{x:x+w-1.6,y:mid,z:.03}],line,1.2);     // 센터 라인
 d.ellipse(cx,mid,5.2,5.2,null,.03,line);                              // 센터 서클
 for(const hy of hoops){
  const dir=hy<mid?1:-1,base=hy+dir*2;
  d.rect(cx-6,Math.min(base,base+dir*15),12,15,'#2a6c99',.028);        // 페인트 존
  surface(d,cx-6,Math.min(base,base+dir*15),12,15,'court',.029);
  d.rect(cx-6,Math.min(base,base+dir*15),12,15,null,.03,line);
  d.ellipse(cx,base+dir*15,4.4,4.4,null,.03,line);                     // 자유투 서클
  const arc=[];                                                        // 3점 라인
  for(let k=0;k<=22;k++){const t=-Math.PI/2+k/22*Math.PI;
   arc.push({x:cx+Math.sin(t)*(w/2-2.2),y:base+dir*Math.cos(t)*18,z:.03});}
  d.line([{x:cx-(w/2-2.2),y:base,z:.03},...arc,{x:cx+(w/2-2.2),y:base,z:.03}],line,1.2);
 }
}
// 본관 2층 사진 · 담장 안쪽 응원석: 콘크리트 단 3단 + 초록·흰 줄무늬 곡면 햇빛막이.
// 가까이 가면 햇빛막이만 비쳐서 단과 좌석이 보인다(단은 항상 또렷하게).
function bleachers(d,o,state){
 const {x,y,w,d:depth,h}=o,tiers=3;
 d.rect(x+1.5,y+1.5,w+2,depth+2,'#26342b1e');
 for(let i=0;i<tiers;i++){                                             // 담장 쪽으로 갈수록 높아지는 단
  const step=w/tiers,sx=x+i*step,sz=h*(i+1)/tiers;
  d.box(sx,y,step,depth,sz,'#d7d3c6','#e0dccf','#b2ae a1'.replace(' ',''));
  d.rect(sx+.25,y,step-.5,depth,'#c8c4b6',sz+.02);                     // 발판
  d.poly([{x:sx,y:y+depth,z:sz},{x:sx+step,y:y+depth,z:sz},{x:sx+step,y:y+depth,z:sz-.5},{x:sx,y:y+depth,z:sz-.5}],'#9d9a8d');
  for(let v=1.5;v<depth;v+=6)d.box(sx+.5,y+v,step-1.2,3.4,.4,'#4f7d8e','#3f6a7a','#33596a',sz+.04);   // 파란 관람 좌석
 }
 for(let v=0;v<=depth;v+=9){                                           // 뒤쪽 스테인리스 난간
  d.line([{x:x+w-.4,y:y+v,z:h},{x:x+w-.4,y:y+v,z:h+4.6}],'#c6ccc4',1.2);
 }
 for(const z of [h+2.4,h+4.6])d.line([{x:x+w-.4,y,z},{x:x+w-.4,y:y+depth,z}],'#d2d8d0',1.1);
 // 응원석 단은 언제나 또렷하게 두고, 가까이 가면 햇빛막이만 비쳐서 안이 보이게 한다.
 const near=state&&state.scene==='campus'&&state.player.x>x-26&&state.player.x<x+w+16
  &&state.player.y>y-26&&state.player.y<y+depth+26;
 d.c.save();if(near)d.c.globalAlpha=.3;
 const eave=h+5.6,rise=3.2,seg=Math.max(10,Math.round(depth/7));       // 곡면 햇빛막이
 const arc=u=>eave+Math.sin(u/w*Math.PI)*rise;
 for(let v=0;v<depth;v+=9){                                            // 지지 기둥
  for(const u of [1.2,w-1.2])d.box(x+u-.35,y+v,.7,.7,arc(u)-.4,'#dcdad0','#e7e5db','#b0aca2');
 }
 for(let i=0;i<seg;i++){
  const a=y-1+(depth+2)*i/seg,b=y-1+(depth+2)*(i+1)/seg,green=i%2===0;
  for(let u=0;u<w;u+=1){
   const nu=Math.min(u+1,w);
   d.poly([{x:x+u,y:a,z:arc(u)},{x:x+nu,y:a,z:arc(nu)},{x:x+nu,y:b,z:arc(nu)},{x:x+u,y:b,z:arc(u)}],green?'#4e9c6d':'#f4f3ea');
  }
 }
 for(let i=0;i<=seg;i++){const v=y-1+(depth+2)*i/seg,pts=[];
  for(let u=0;u<=w;u++)pts.push({x:x+u,y:v,z:arc(u)+.05});d.line(pts,'#cfd6cd55',.5);}
 for(const u of [0,w]){const pts=[];for(let v=y-1;v<=y+depth+1;v+=4)pts.push({x:x+u,y:v,z:arc(u)});d.line(pts,'#b7bdb2',1.3);}
 d.c.restore();
 d.label(x+w/2,y+depth+3,'응원석','#314337',0,true);
}
// 골대 뒤 나무 그늘의 등받이 벤치.
function parkBench(d,o){
 const alongY=o.axis!=='x',{x,y,w,d:depth}=o,L=o.lift||0;
 const len=alongY?depth:w,thick=alongY?w:depth;
 d.rect(x+.4,y+.4,w,depth,'#26342b1e',L+.02);
 for(let t=.8;t<len;t+=len-1.6){
  const bx=alongY?x+.3:x+t,by=alongY?y+t:y+.3;
  d.box(bx,by,alongY?thick-.6:.7,alongY?.7:thick-.6,1.5,'#8d9a96','#aab2ac','#7b847e',L);
 }
 d.box(x,y,w,depth,.42,'#b5824c','#9a6b3c','#7c5530',L+1.5);           // 좌판
 for(let t=.6;t<len-.4;t+=1.5)
  d.line(alongY?[{x,y:y+t,z:L+1.94},{x:x+w,y:y+t,z:L+1.94}]:[{x:x+t,y,z:L+1.94},{x:x+t,y:y+depth,z:L+1.94}],'#00000018',.5);
 const back=alongY?{x:x+w-.35,y,w:.35,d:depth}:{x,y:y+depth-.35,w,d:.35};   // 등받이
 d.box(back.x,back.y,back.w,back.d,1.7,'#b5824c','#9a6b3c','#7c5530',L+1.9);
}
// 사진7 · 풋살 골대.
function futsalGoal(d,o){
 const {x,y,d:depth,h}=o,front=o.face==='east'?x+o.w:x,back=o.face==='east'?x:x+o.w;
 const post=(v)=>d.line([{x:front,y:v,z:0},{x:front,y:v,z:h}],'#eeeade',2.2);
 post(y);post(y+depth);
 d.line([{x:front,y,z:h},{x:front,y:y+depth,z:h}],'#eeeade',2.2);
 d.poly([{x:front,y,z:h},{x:front,y:y+depth,z:h},{x:back,y:y+depth,z:h*.45},{x:back,y,z:h*.45}],'#e9ece238');
 for(let i=0;i<=6;i++){const v=y+depth*i/6;d.line([{x:front,y:v,z:h},{x:back,y:v,z:h*.45},{x:back,y:v,z:0}],'#dfe4da66',.6);}
 for(let z=1;z<h;z+=1.6)d.line([{x:front,y,z},{x:back,y,z:z*.5},{x:back,y:y+depth,z:z*.5},{x:front,y:y+depth,z}],'#dfe4da4d',.5);
}




// 사진4 · 토목과 앞 야외무대: 검은 무대단, 흰 아치형 막구조 지붕, 옆 계단, 뒤편 현수막과 전광판.
function outdoorStage(d,o){
 const {x,y,w,d:depth,h}=o;
 d.rect(x+1.5,y+1.5,w+2,depth+2,'#26342b1e');
 d.box(x,y,w,depth,h,'#2f3237','#d5d3c8','#aeaca1');              // 무대단(윗면은 검은 바닥)
 d.rect(x+.8,y+.8,w-1.6,depth-1.6,'#24272b',h+.05);
 for(let u=3;u<w-2;u+=5)d.line([{x:x+u,y:y+1,z:h+.1},{x:x+u,y:y+depth-1,z:h+.1}],'#3b3f46',.6);
 d.line([{x:x+.8,y:y+depth-.9,z:h+.06},{x:x+w-.8,y:y+depth-.9,z:h+.06}],'#dcd9cd',.9);   // 무대 앞코 라인
 for(let i=0;i<4;i++)d.box(x+w,y+depth-3.4-i*2.1,2.3,2.1,h-.9-i*.95,'#d3d0c4','#c2bfb3','#a8a59a'); // 측면 계단
 for(let i=0;i<5;i++)                                              // 계단 스테인리스 난간
  d.line([{x:x+w+2.4,y:y+depth-3.4,z:h+2.6},{x:x+w+2.4,y:y+depth-11,z:h-1.2},{x:x+w+2.4,y:y+depth-11,z:h-3.6}].slice(i<3?0:1),'#cdd2cb',i?.9:1.4);
 // 사진2 · 뒤가 높고 앞으로 흘러내리는 흰 막구조 캐노피. 앞쪽에만 흰 기둥 두 본.
 const back=h+20.5,front=h+11.5,seg=16,span=depth+5;
 const arc=t=>front+(back-front)*(1-t)+Math.sin(t*Math.PI)*3.6;
 for(const px of [x+2.4,x+w-3.4]){
  d.box(px,y+depth+2.2,1.3,1.3,arc(1)-.6,'#f2f0e6','#fbf9ef','#cdcbbf');
  d.box(px-.8,y+depth+1.4,2.9,2.9,.9,'#e8e6da','#efedE1','#c4c2b6');
 }
 for(let i=0;i<seg;i++){
  const a=i/seg,b=(i+1)/seg;
  d.poly([{x:x+1,y:y-1+span*a,z:arc(a)},{x:x+w-1,y:y-1+span*a,z:arc(a)},
          {x:x+w-1,y:y-1+span*b,z:arc(b)},{x:x+1,y:y-1+span*b,z:arc(b)}],i<3?'#eceadf':i>seg-4?'#fbfaf2':'#f5f4ea');
 }
 for(let i=0;i<=seg;i+=2){const t=i/seg;
  d.line([{x:x+1,y:y-1+span*t,z:arc(t)+.06},{x:x+w-1,y:y-1+span*t,z:arc(t)+.06}],'#cfccbe66',.6);}
 for(const px of [x+1,x+w-1]){
  const rim=[];for(let i=0;i<=seg;i++){const t=i/seg;rim.push({x:px,y:y-1+span*t,z:arc(t)});}
  d.line(rim,'#c2bfb1',1.3);
 }
 d.line([{x:x+1,y:y-1+span,z:arc(1)},{x:x+w-1,y:y-1+span,z:arc(1)}],'#b6b3a5',2);   // 앞 처마
 d.poly([{x:x+2,y:y-.1,z:9},{x:x+w-2,y:y-.1,z:9},{x:x+w-2,y:y-.1,z:13.4},{x:x+2,y:y-.1,z:13.4}],'#6b4c93','#e6e2f0',.8);   // 뒤편 현수막
 for(let u=5;u<w-4;u+=6)d.line([{x:x+u,y:y-.15,z:9.6},{x:x+u,y:y-.15,z:12.8}],'#efe7f7aa',1.4);
 d.poly([{x:x+1,y:y-.16,z:17.6},{x:x+w-1,y:y-.16,z:17.6},{x:x+w-1,y:y-.16,z:22},{x:x+1,y:y-.16,z:22}],'#15181e','#7f868f',1.2); // 전광판
 for(let u=3;u<w-2;u+=2.6)d.line([{x:x+u,y:y-.22,z:18.3},{x:x+u,y:y-.22,z:21.3}],'#4d7fb8aa',1.2);
 d.line([{x:x+1,y:y-.2,z:17.4},{x:x+w-1,y:y-.2,z:17.4}],'#b7442f',1.6);
}


// 사진3 · 비막이 통로: 아치 지붕 + 스테인리스 기둥(하부는 목재 마감), 회색 또는 파란 패널.
function walkway(d,o){
 const alongY=o.axis!=='x',{x,y,w,d:depth,h}=o;
 const span=alongY?w:depth,run=alongY?depth:w;
 const gray=o.tone==='gray'||o.tone==='white',bronze=o.tone==='bronze';
 const light=bronze?'#b9b2a4':gray?'#e8e6dc':'#e5e4d8',dark=bronze?'#7d7365':gray?'#c9c7bb':'#439bbb';
 surface(d,x,y,w,depth,'brick');
 const p=(u,v)=>alongY?{x:x+u,y:y+v,z:h-1.4+Math.sin(u/span*Math.PI)*2.3}:{x:x+v,y:y+u,z:h-1.4+Math.sin(u/span*Math.PI)*2.3};
 const step=o.pillarStep??9;                                // 기둥 간격 (주차 칸이 들어가는 곳은 넓힌다)
 for(let v=1;v<run;v+=step)for(const u of [.7,span-.7]){       // 스테인리스 기둥 + 목재 하부
  const px=alongY?x+u:x+v,py=alongY?y+v:y+u;
  d.box(px,py,.55,.55,h-1.2,'#e4e2d8','#eeece2','#b9b7ad');
  d.box(px-.12,py-.12,.8,.8,3.4,'#b0693a','#c07b46','#8d5330',1.4);
 }
 for(let v=0;v<run;v+=6)for(let u=0;u<span;u+=1){
  const end=Math.min(v+6,run);
  d.poly([p(u,v),p(u+1,v),p(u+1,end),p(u,end)],Math.floor(v/6)%2?light:dark);
 }
 for(let v=0;v<=run;v+=6){const pts=[];for(let u=0;u<=span;u++)pts.push(p(u,v));d.line(pts,'#a9b5b666',.65);}
 for(const u of [0,span]){const pts=[];for(let v=0;v<=run;v+=3)pts.push(p(u,v));d.line(pts,'#b9c2c0',1.2);}
}
// 사진3·5 · 베이지 벽돌 동아리실.
function clubHouse(d,o,tone){
 const {x,y,w,d:depth,h}=o,body=tone==='band'?'#8f3f35':'#cbab7e',mortar=tone==='band'?'#b5867a':'#e0cdab';
 d.rect(x+2,y+2,w+2,depth+3,'#26342b22');
 d.box(x,y,w,depth,h,'#cfcec2',body,tone==='band'?'#77332b':'#b2926a');
 for(let z=1.4;z<h-1;z+=.9){
  d.line([{x,y:y+depth,z},{x:x+w,y:y+depth,z},{x:x+w,y,z}],mortar+'66',.5);
  for(let u=(Math.round(z/.9)%2)*1.8;u<w;u+=3.6)d.line([{x:x+u,y:y+depth,z},{x:x+u,y:y+depth,z:z+.8}],mortar+'44',.45);
  for(let v=(Math.round(z/.9)%2)*1.8;v<depth;v+=3.6)d.line([{x:x+w,y:y+v,z},{x:x+w,y:y+v,z:z+.8}],mortar+'44',.45);
 }
 if(o.axis==='y'){                                   // 반시계 90° · 긴 면과 출입구가 +x 쪽을 향한다
  for(let v=3;v<depth-5;v+=8)windowPanel(d,x+w+.05,y+v,5,3,5.4,true);
  windowPanel(d,x+w*.28,y+depth+.05,w*.4,3,5.4);
  const door=(v0,v1,fill,edge)=>d.poly([{x:x+w+.06,y:y+v0,z:.2},{x:x+w+.06,y:y+v1,z:.2},
   {x:x+w+.06,y:y+v1,z:5},{x:x+w+.06,y:y+v0,z:5}],fill,edge,1);
  if(tone==='band'){                                 // 사진1·2 · 초록 문과 흰 문, 그 사이 파란 게시판
   door(depth-7.4,depth-3.8,'#4f7d45','#e5e3d6');
   door(2.4,5.6,'#eeece0','#4f7d45');
   d.poly([{x:x+w+.07,y:y+depth*.42,z:5.6},{x:x+w+.07,y:y+depth*.42+7,z:5.6},
    {x:x+w+.07,y:y+depth*.42+7,z:9.4},{x:x+w+.07,y:y+depth*.42,z:9.4}],'#3f7fa8','#e7e5d8',1);
   d.line([{x:x+w+.09,y:y+depth*.42+.8,z:7},{x:x+w+.09,y:y+depth*.42+6.2,z:8.4}],'#bfe0ea',1.1);
  }else door(depth-6,depth-2.4,'#4c5a52','#d6d5c8');
 }else{
  for(let u=3;u<w-5;u+=8)windowPanel(d,x+u,y+depth+.05,5,3,5.4);
  windowPanel(d,x+w+.05,y+depth*.3,depth*.34,3,5.4,true);
  d.poly([{x:x+w-6,y:y+depth+.06,z:.2},{x:x+w-2.4,y:y+depth+.06,z:.2},{x:x+w-2.4,y:y+depth+.06,z:4.8},{x:x+w-6,y:y+depth+.06,z:4.8}],'#4c5a52','#d6d5c8',.8);
 }
 d.box(x-.5,y-.5,w+1,depth+1,1.1,'#dedcd0','#c8c6ba','#a9a79b',h);
 if(tone==='band'){                                  // 사진1 · 옥상은 초록색 방수 도장
  d.rect(x+1.3,y+1.3,w-2.6,depth-2.6,'#5d8a58',h+1.16);
  d.line([{x:x+1.3,y:y+depth-1.3,z:h+1.18},{x:x+w-1.3,y:y+depth-1.3,z:h+1.18}],'#47703f88',.8);
 }
 d.label(x+w/2,y+depth/2,tone==='band'?'밴드부 동아리실':'동아리실','#314337',h+2.6,true);   // Revision 61 · 이름을 옥상에
}
// 사진8 · 흰색 창고.
function whiteStore(d,o){
 const {x,y,w,d:depth,h}=o;
 d.rect(x+1.5,y+1.5,w+2,depth+2,'#26342b1e');
 d.box(x,y,w,depth,h,'#e2e0d4','#f1efe6','#c6c4b8');
 for(let z=3;z<h;z+=3)d.line([{x,y:y+depth,z},{x:x+w,y:y+depth,z},{x:x+w,y,z}],'#c3c1b555',.55);
 if(o.axis==='y'){                                   // 반시계 90° · 셔터가 +x 쪽 긴 면에 달린다
  for(const v of [4,depth-11]){
   d.poly([{x:x+w+.05,y:y+v,z:.3},{x:x+w+.05,y:y+v+7,z:.3},{x:x+w+.05,y:y+v+7,z:6.2},{x:x+w+.05,y:y+v,z:6.2}],'#f4f3ea','#a9a89c',.8);
   for(let z=.8;z<6;z+=.7)d.line([{x:x+w+.08,y:y+v,z},{x:x+w+.08,y:y+v+7,z}],'#cdccc0',.5);
  }
 }else for(const u of [4,w-11]){
  d.poly([{x:x+u,y:y+depth+.05,z:.3},{x:x+u+7,y:y+depth+.05,z:.3},{x:x+u+7,y:y+depth+.05,z:6.2},{x:x+u,y:y+depth+.05,z:6.2}],'#f4f3ea','#a9a89c',.8);
  for(let z=.8;z<6;z+=.7)d.line([{x:x+u,y:y+depth+.08,z},{x:x+u+7,y:y+depth+.08,z}],'#cdccc0',.5);
 }
 d.box(x-.5,y-.5,w+1,depth+1,1,'#eae8dc','#d2d0c4','#b2b0a4',h);
 d.label(x+w/2,y+depth/2,'창고','#314337',h+2.4,true);                                      // Revision 61 · 이름을 옥상에
}
// 사진8 · 수돗가: 스테인리스 물받이와 수도꼭지, 위에 화분.
function washStand(d,o){
 const {x,y,w,d:depth}=o;
 d.rect(x-1,y-1,w+2,depth+2,'#b9b3a2');
 d.box(x,y,w,depth,2.4,'#cfd3cf','#dfe2dc','#a9aea8');
 d.box(x+.5,y+.5,w-1,depth-1,.4,'#8d9a96','#b6bdb6','#8d9a96',2.4);
 if(o.axis==='y'){                                   // 반시계 90° · 수도꼭지가 남북으로 늘어서고 +x 쪽을 향한다
  for(let v=1.6;v<depth-1;v+=2.6){
   d.line([{x:x+.9,y:y+v,z:2.8},{x:x+.9,y:y+v,z:4.4},{x:x+1.9,y:y+v,z:4.4}],'#b8bcb6',1.5);
   d.ellipse(x+w-1.4,y+v,.9,.7,'#c8b05a',2.85);
  }
  d.line([{x:x+w,y,z:.1},{x:x+w,y:y+depth,z:.1}],'#8d9a96',1.6);
 }else{
  for(let u=1.6;u<w-1;u+=2.6){
   d.line([{x:x+u,y:y+.9,z:2.8},{x:x+u,y:y+.9,z:4.4},{x:x+u,y:y+1.9,z:4.4}],'#b8bcb6',1.5);
   d.ellipse(x+u,y+depth-1.4,.9,.7,'#c8b05a',2.85);
  }
  d.line([{x,y:y+depth,z:.1},{x:x+w,y:y+depth,z:.1}],'#8d9a96',1.6);
 }
}
function shrub(d,o){
 const {x,y,w,d:depth}=o;
 d.ellipse(x+w/2,y+depth/2,w*.55,depth*.5,'#26342b22');
 d.ellipse(x+w/2,y+depth/2,w*.5,depth*.46,'#52814f',1.1);
 d.ellipse(x+w/2-.5,y+depth/2-.4,w*.34,depth*.3,'#6d9b5e',2.2);
 d.ellipse(x+w/2,y+depth/2,w*.2,depth*.18,'#7fae6c',3);
}

// 교문 안쪽 수위실. 사진 그대로 회색 콘크리트 블록 벽 + 접수 창구 + 초록 철문.
function guardPost(d,o){
 const {x,y,w,d:dep,h}=o;
 d.box(x-1,y-1,w+2,dep+2,.5,'#b7b5ac','#a9a79e','#95938b');          // 기단
 d.box(x,y,w,dep,h,'#cfcdc4','#c2c0b7','#a6a49b',.5);                // 본체
 for(let z=1;z<h;z+=2.2){                                            // 블록 줄눈
  d.line([{x:x+w,y,z},{x:x+w,y:y+dep,z}],'#a9a79e',.8);
  d.line([{x,y:y+dep,z},{x:x+w,y:y+dep,z}],'#a9a79e',.8);
 }
 d.box(x-.6,y-.6,w+1.2,dep+1.2,1,'#8f9a90','#9aa59b','#7e8880',h+.4); // 옥상 테두리
 // 운동장 쪽(+y) 면: 접수 창구
 d.poly([{x:x+2.4,y:y+dep+.06,z:5.2},{x:x+w-2.4,y:y+dep+.06,z:5.2},
         {x:x+w-2.4,y:y+dep+.06,z:9.6},{x:x+2.4,y:y+dep+.06,z:9.6}],'#8fb6bd','#e9e7dd',1);
 d.line([{x:x+w/2,y:y+dep+.1,z:5.2},{x:x+w/2,y:y+dep+.1,z:9.6}],'#e9e7dd',1);
 d.poly([{x:x+2,y:y+dep+.1,z:4.3},{x:x+w-2,y:y+dep+.1,z:4.3},
         {x:x+w-2,y:y+dep+.1,z:5.2},{x:x+2,y:y+dep+.1,z:5.2}],'#ddd9cb');   // 창구 선반
 // 교문 쪽(+x) 면: 초록 철문
 d.poly([{x:x+w+.06,y:y+3.4,z:0},{x:x+w+.06,y:y+dep-3.4,z:0},
         {x:x+w+.06,y:y+dep-3.4,z:8.4},{x:x+w+.06,y:y+3.4,z:8.4}],'#4f7a5e','#3c5f49',1);
 d.ellipse(x+w+.12,y+dep-5,.4,.4,'#e6d9a8',4.2);
 d.label(x+w/2,y+dep,'수위실',"#3a4a3c",h+3.4);
}
// 사진4 · 측량공간을 두르는 초록 메시 담장. 초록 각관 기둥 + 촘촘한 철망 + 발치의 잡석.
function meshFence(d,o){
 const alongY=o.axis==='y',span=alongY?o.d:o.w,h=o.h;
 const at=(t,z)=>alongY?{x:o.x,y:o.y+t,z}:{x:o.x+t,y:o.y,z};
 for(let t=0;t<span;t+=3.2){                                   // 발치에 늘어놓은 잡석
  const p=at(t,0);
  d.ellipse(p.x+(alongY?-1.6:0),p.y+(alongY?0:1.6),1.5,1,'#9d9b90');
  d.ellipse(p.x+(alongY?-1.9:.6),p.y+(alongY?.6:1.9),.9,.6,'#c0bdb0');
 }
 d.poly([at(0,.6),at(span,.6),at(span,h-.8),at(0,h-.8)],'#4f9b6a1c');
 for(let t=0;t<=span;t+=1.5)d.line([at(t,.6),at(t,h-.8)],'#4f9b6a55',.5);   // 세로 철망
 for(let z=1.4;z<h-.8;z+=1.3)d.line([at(0,z),at(span,z)],'#4f9b6a55',.5);   // 가로 철망
 for(let t=0;t<=span;t+=8){                                    // 초록 각관 기둥
  d.line([at(t,0),at(t,h)],'#2f6f47',2.2);
  d.line([at(t,0),at(t,h)],'#57a97a',1.1);
 }
 for(const z of [.8,h-.8])d.line([at(0,z),at(span,z)],'#2f6f47',1.6);       // 상하 가로대
}
// 사진3 · 취업진로부의 ㄱ자 날개동. 본동과 같은 갈색 벽돌 기단 + 크림색 상부.
function careerWing(d,o){
 const {x,y,w,d:depth,h}=o;
 d.rect(x+2,y+2,w+2,depth+3,'#26342b20');
 d.box(x,y,w,depth,h,'#b9bba8','#ddd8c6','#c2bcaa');
 // 갈색 벽돌 기단 — 보이는 두 면에만 덧칠한다(윗면을 그리면 건물을 가로지르는 띠가 생긴다)
 const base=Math.min(4.2,h*.42);                                 // 1층이라 기단도 낮다
 d.poly([{x:x+w,y,z:0},{x:x+w,y:y+depth,z:0},{x:x+w,y:y+depth,z:base},{x:x+w,y,z:base}],'#755549');
 d.poly([{x,y:y+depth,z:0},{x:x+w,y:y+depth,z:0},{x:x+w,y:y+depth,z:base},{x,y:y+depth,z:base}],'#8a6553');
 for(let z=1;z<base;z+=1.2){
  d.line([{x,y:y+depth,z},{x:x+w,y:y+depth,z}],'#b08b76aa',.45);
  d.line([{x:x+w,y,z},{x:x+w,y:y+depth,z}],'#b08b76aa',.45);
 }
 for(const z of [base,base+.4]){                                 // 기단 위 크림색 띠
  d.line([{x,y:y+depth,z},{x:x+w,y:y+depth,z},{x:x+w,y,z}],'#f1eee0',z===base?2.2:1);
 }
 const sill=base+.9,gh=Math.max(2.4,h-sill-1.8);                // 1층짜리라 창 한 줄만 들어간다
 for(let u=2.4;u<w-5;u+=7.6){                                    // 앞면 창
  d.poly([{x:x+u,y:y+depth,z:sill},{x:x+u+5,y:y+depth,z:sill},{x:x+u+5,y:y+depth,z:sill+gh},{x:x+u,y:y+depth,z:sill+gh}],'#42606a','#e4e5dd',.6);
  d.line([{x:x+u+2.5,y:y+depth,z:sill},{x:x+u+2.5,y:y+depth,z:sill+gh}],'#e4e5dd',.6);
 }
 for(let v=2.4;v<depth-5;v+=7.6)                                 // 오른쪽 면 창
  d.poly([{x:x+w,y:y+v,z:sill},{x:x+w,y:y+v+5,z:sill},{x:x+w,y:y+v+5,z:sill+gh},{x:x+w,y:y+v,z:sill+gh}],'#42606a','#e4e5dd',.6);
 d.line([{x,y:y+depth,z:h-1.4},{x:x+w,y:y+depth,z:h-1.4},{x:x+w,y,z:h-1.4}],'#f1eee0',2);
}
// 사진2 · 취업진로부와 밴드부 동아리실 사이의 수돗가.
function waterPoint(d,o){
 const {x,y,w,d:depth}=o;
 d.rect(x,y,w,depth,'#b9b3a2');                                  // 콘크리트 테두리
 d.rect(x+1.2,y+1.2,w-2.4,depth-2.4,'#6d6f68',.05);              // 파인 배수 구덩이
 for(let v=1.8;v<depth-1.8;v+=1.1)                               // 금속 그레이팅 살
  d.line([{x:x+1.4,y:y+v,z:.08},{x:x+w-1.4,y:y+v,z:.08}],'#adb0a6',.7);
 d.rect(x+1.2,y+1.2,w-2.4,depth-2.4,null,.09,'#8f938a');
 const px=x+w-4.2,py=y+depth-2.6;                                // 길게 선 급수 배관
 d.line([{x:px,y:py,z:0},{x:px,y:py,z:7.6}],'#8d9a96',2.4);
 d.line([{x:px,y:py,z:7.6},{x:px-3.2,y:py,z:7.6},{x:px-3.2,y:py,z:6.2}],'#9aa7a2',1.9);
 d.ellipse(px-3.2,py,.6,.45,'#8d9a96',6.1);
 for(let i=0;i<5;i++)                                            // 감아 둔 초록 호스
  d.ellipse(px+.4,py+1.2,2.1-i*.16,1.3-i*.1,i%2?'#4f8f56':'#3f7a48',.3+i*.34);
 d.rect(x+w,y+depth-6.4,5.6,6.8,'#b9b3a2');                      // 옆에 붙은 콘크리트 받침
 for(const oy of [depth-5.6,depth-2.8])                          // 그 위의 놋쇠 밸브함 둘
  d.box(x+w+1.4,y+oy,2.4,2,1.5,'#d8b45c','#c8a24a','#96762f');
 d.box(x+1.6,y+depth*.3,2.4,2,1.1,'#cfd3cf','#dfe2dc','#a9aea8');  // 낮은 콘크리트 받침
}
// 사진1 · 카페 출입구 앞 독립 태양광 구조물. 네 기둥 위에 남쪽으로 기울어진 짙은 남색 패널이 얹힌다.
function solarPanel(d,o){
 const {x,y,w,d:depth,h}=o,lo=h-2.6,hi=h;                        // +y 쪽이 낮게 기운다
 d.ellipse(x+w/2,y+depth/2,w*.45,depth*.42,'#26342b1e');
 for(const[px,py]of[[x+1.2,y+1.2],[x+w-1.9,y+1.2],[x+1.2,y+depth-1.9],[x+w-1.9,y+depth-1.9]]){
  const top=py<y+depth/2?hi:lo;
  d.box(px,py,.7,.7,top,'#9aa29a','#b3bab2','#7d867e');
  d.line([{x:px+.35,y:py+.35,z:top*.45},{x:px+.35,y:py+.35,z:top*.45}],'#8e968e',1);
 }
 const P=(u,v)=>({x:x+u,y:y+v,z:v<depth/2?hi:lo});               // 기울어진 패널면
 d.poly([P(0,0),P(w,0),P(w,depth),P(0,depth)],'#2f3f63','#8e95a0',1.1);
 for(let u=w/4;u<w-.5;u+=w/4)d.line([P(u,0),P(u,depth)],'#7f8794',1);
 d.line([P(0,depth/2),P(w,depth/2)],'#7f8794',1.2);
 for(let u=1;u<w;u+=1.6)d.line([P(u,.6),P(u,depth-.6)],'#4a5c85aa',.5);
 d.poly([P(0,0),P(w,0),{x:x+w,y,z:hi-.7},{x,y,z:hi-.7}],'#6d7585');   // 위쪽 테두리 두께
 d.line([P(0,0),P(w,0)],'#c3c8ce',1);
}
// 사진3 · 솔라카 제작소: 1층짜리 낮고 긴 빨간 벽돌 실습동, 위에 두꺼운 흰 파라펫 띠, 노란 양문형 출입문.
function solarCarShop(d,o){
 const {x,y,w,d:depth,h}=o,BR='#8d5344',MR='#c0a189';
 d.rect(x+2,y+2,w+3,depth+3,'#26342b22');
 d.box(x,y,w,depth,h,'#d8d5c8',BR,'#75473c');
 for(let z=1;z<h-.6;z+=.9){                                      // 벽돌 줄눈(동측 · 남측 면)
  d.line([{x:x+w,y,z},{x:x+w,y:y+depth,z},{x,y:y+depth,z}],MR+'50',.5);
  for(let v=(Math.round(z/.9)%2)*1.8;v<depth;v+=3.6)d.line([{x:x+w,y:y+v,z},{x:x+w,y:y+v,z:z+.8}],MR+'40',.45);
  for(let u=(Math.round(z/.9)%2)*1.8;u<w;u+=3.6)d.line([{x:x+u,y:y+depth,z},{x:x+u,y:y+depth,z:z+.8}],MR+'40',.45);
 }
 const E=(v,z)=>({x:x+w+.06,y:y+v,z});                           // 통로를 향한 동측 면
 for(const[v0,vw,fill,line]of[[depth*.42,9,'#f0c21f','#c89a0d'],[depth*.42+10.4,4.2,'#b9bcb2','#8e9189'],[8,4.2,'#b9bcb2','#8e9189']]){
  d.poly([E(v0,.2),E(v0+vw,.2),E(v0+vw,7.4),E(v0,7.4)],fill,line,.9);   // 노란 양문 · 회색 작은 문
  if(vw>6){
   d.line([E(v0+vw/2,.2),E(v0+vw/2,7.4)],line,1.2);
   for(const v of [v0+vw*.28,v0+vw*.72])d.ellipse(x+w+.1,y+v,.5,.7,'#8c6f10',3.6);
  }else d.ellipse(x+w+.1,y+v0+vw*.75,.4,.6,'#767a72',3.6);
  d.poly([E(v0-.5,7.4),E(v0+vw+.5,7.4),E(v0+vw+.5,8.1),E(v0-.5,8.1)],'#d9d6c9');   // 문 위 인방
 }
 for(const v of [depth*.16,depth*.72])                           // 벽에 붙은 작은 환기 후드
  d.poly([E(v,8.6),E(v+3.4,8.6),E(v+3.4,10),E(v,10)],'#a9aca3','#84877f',.7);
 d.box(x-.7,y-.7,w+1.4,depth+1.4,1.9,'#dedbcd','#eeebdd','#bab7a9',h);   // 두꺼운 흰 파라펫 띠
 d.rect(x+1,y+1,w-2,depth-2,'#b5b8ad',h+1.95);
 d.line([{x:x+1.4,y:y+depth-1.4,z:h+2},{x:x+w-1.4,y:y+depth-1.4,z:h+2}],'#6f8076aa',.8);
 d.label(x+w/2,y+depth/2,'솔라카 제작소','#314337',h+3.4,true);                              // Revision 61 · 이름을 옥상에
}
// 사진6 · 광장 앞 화강석 계단과 스테인리스 손잡이.
function plazaStep(d,o){
 const {x,y,w,d:depth}=o;
 for(let i=0;i<3;i++)d.rect(x-i*.9,y+i*1.2,w+i*1.8,depth-i*1.2,i%2?'#cfcabb':'#dcd8ca',.55+i*.55);
 d.line([{x,y:y+depth,z:.1},{x:x+w,y:y+depth,z:.1}],'#a9a496',1.2);
 for(const u of [1.5,w-1.5]){                                   // 양끝 손잡이
  d.line([{x:x+u,y:y+depth-.5,z:0},{x:x+u,y:y+depth-.5,z:4.4}],'#4a4f4c',1.8);
  d.line([{x:x+u,y:y+.5,z:1.8},{x:x+u,y:y+.5,z:5.6}],'#4a4f4c',1.8);
  d.line([{x:x+u,y:y+depth-.5,z:4.4},{x:x+u,y:y+.5,z:5.6}],'#5d635f',2);
 }
}
// 사진6 · 계단 앞 노란 점자블록.
function tactileStrip(d,o){
 const alongY=o.axis==='y',span=alongY?o.d:o.w;
 d.rect(o.x,o.y,o.w,o.d,'#d8b43f');
 for(let t=.6;t<span;t+=1.4){
  const p=alongY?{x:o.x+.6,y:o.y+t}:{x:o.x+t,y:o.y+.6};
  d.ellipse(p.x,p.y,.45,.32,'#b8942c',.06);
  const q=alongY?{x:o.x+o.w-.6,y:o.y+t}:{x:o.x+t,y:o.y+o.d-.6};
  d.ellipse(q.x,q.y,.45,.32,'#b8942c',.06);
 }
}
// 사진2·6 · 광장을 가로지르는 선형 배수로 그레이팅.
function gutterLine(d,o){
 const alongY=o.axis==='y',span=alongY?o.d:o.w;
 d.rect(o.x,o.y,o.w,o.d,'#9a978c');
 d.rect(o.x+.25,o.y+.25,o.w-.5,o.d-.5,'#5f625c',.02);
 for(let t=.5;t<span;t+=1.1)
  d.line(alongY?[{x:o.x+.3,y:o.y+t,z:.04},{x:o.x+o.w-.3,y:o.y+t,z:.04}]
               :[{x:o.x+t,y:o.y+.3,z:.04},{x:o.x+t,y:o.y+o.d-.3,z:.04}],'#b6b3a6',.7);
}
// 점이 다각형 안에 있는지(짝수-홀수 규칙). building-art.js 의 inside() 와 같은 판정이며,
// 순환 import 를 만들지 않으려고 여기에도 같은 6줄을 둔다.
function insidePoly(p,poly){
 let hit=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];
  if(((a.y>p.y)!==(b.y>p.y))&&(p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x))hit=!hit;
 }
 return hit;
}
// 이 프롭이 실제로 플레이어를 가리는가. 등각에서 상자의 화면 실루엣은 육각형이고,
// 건물이 쓰는 것과 똑같은 꼭짓점 순서를 쓴다(윗면 뒤 두 점 → 오른쪽 면 → 앞면 → 왼쪽 위).
// 발밑(z=0)과 머리(z=3) 중 하나라도 실루엣 안에 들어오면 가려지는 것으로 본다.
export function occludesPlayer(d,o,state){
 const outline=[d.p(o.x,o.y,o.h),d.p(o.x+o.w,o.y,o.h),d.p(o.x+o.w,o.y,0),
   d.p(o.x+o.w,o.y+o.d,0),d.p(o.x,o.y+o.d,0),d.p(o.x,o.y+o.d,o.h)];
 return insidePoly(d.p(state.player.x,state.player.y,3),outline)
   ||insidePoly(d.p(state.player.x,state.player.y),outline);
}
export function drawCampusProp(d,o,state){
 d.c.save();
 if(state?.scene==='campus'&&o.h>3.5&&!o.noFade){                    // 바닥 표시(코트·주차 구획)는 흐려지지 않는다
  // 2026-09 · 예전에는 "화면에 투영한 꼭짓점들의 사각 범위(AABD) + 8px" 안에 플레이어가 있으면 흐리게 했다.
  // 등각에서 상자의 실루엣은 육각형이라 그 사각 범위에는 빈 모서리가 넓게 남는다(밴드부 동아리실·창고
  // 기준 42~43%). 그래서 건물 옆이나 대각선 앞 — 가려질 이유가 전혀 없는 자리 — 에 서 있어도 지붕까지
  // 통째로 흐려졌다. 건물(building-art.js drawBuilding)은 처음부터 실루엣 육각형 안쪽인지를 직접 재기
  // 때문에 같은 문제가 없었다. 프롭도 같은 판정을 쓰도록 맞춘다 — 실제로 가려질 때의 동작(알파 .38)은 그대로다.
  if(occludesPlayer(d,o,state))d.c.globalAlpha=.38;
 }
 if(o.type==='gate'){
  for(const [x,y] of [[490,539],[533,533]]){d.box(x,y,4,5,12,'#c5c7c1','#9b9e98','#757f78');for(let z=2;z<12;z+=3)d.line([{x,y:y+5,z},{x:x+4,y:y+5,z}],'#e1e0d6',1);fence(d,x+4,y,x+4,y-12,7);}
 }
 else if(o.type==='guardpost')guardPost(d,o);
 else if(o.type==='rock')rock(d,o);
 else if(o.type==='electrical')electrical(d,o);
 else if(o.type==='canopy')walkway(d,o);
 else if(o.type==='clubhouse')clubHouse(d,o,'club');
 else if(o.type==='bandclub')clubHouse(d,o,'band');
 else if(o.type==='whitestore')whiteStore(d,o);
 else if(o.type==='wash')washStand(d,o);
 else if(o.type==='solarpv')solarPanel(d,o);
 else if(o.type==='solarcar')solarCarShop(d,o);
 else if(o.type==='shrub')shrub(d,o);
 else if(o.type==='fence')fence(d,o.x,o.y,o.x+o.w,o.y,o.h);
 else if(o.type==='meshfence')meshFence(d,o);
 else if(o.type==='wing')careerWing(d,o);
 else if(o.type==='waterpoint')waterPoint(d,o);
 else if(o.type==='plazastep')plazaStep(d,o);
 else if(o.type==='tactile')tactileStrip(d,o);
 else if(o.type==='gutter')gutterLine(d,o);
 else if(o.type==='parking')parking(d,o);
 else if(o.type==='car')car(d,o);
 else if(o.type==='bollard')bollard(d,o);
 else if(o.type==='bikerack')bikerack(d,o);
 else if(o.type==='podium')podium(d,o);
 else if(o.type==='hoop')courtHoop(d,o);
 else if(o.type==='terrace')terrace(d,o);
 else if(o.type==='bluecourt')blueCourt(d,o);
 else if(o.type==='bleachers')bleachers(d,o,state);
 else if(o.type==='parkbench')parkBench(d,o);
 else if(o.type==='futsal')futsalGoal(d,o);
 else if(o.type==='outdoor-stage')outdoorStage(d,o);
 else shed(d,o);
 d.c.restore();
}
