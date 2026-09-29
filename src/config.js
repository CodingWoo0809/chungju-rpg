// 시간 배속: 6교시 하루(등교~종례 = 게임 시간 430분)를 실제 5분에 맞추고,
// 각 시간대에 게임 시간 비율 그대로 나눴다. 1 게임분 ≈ 0.7초, 즉 실제 1분 ≈ 게임 86분.
// 등교 21 + 조회 7 + 교시 35×6 + 쉬는 7×4 + 점심 35 = 301초 ≈ 5분. 방과후는 같은 비율로 133초.
// 베타테스트 피드백(2026-09-20): 기본 이동속도가 예전 "달리기(Shift)" 속도가 되도록 walkSpeed를 올리고,
// Shift는 그보다 더 빠른 질주 속도가 되도록 runSpeed를 새로 올렸다. src/main.js의 control()이 그대로 이 값을 읽는다.
// (2026-09-21) 그 뒤 "둘 다 150%로" 요청에 따라 18→27, 30→45 로 함께 올렸다. 걷기:질주 비율(1:1.67)은 그대로다.
export const CONFIG = { metersPerUnit: .33, zoom: 7.2, playerRadius: 1.6, walkSpeed: 27, runSpeed: 45, inventorySlots: 60, faintMinutes: 20, dayStart: 490, dayEnd: 1110,
 arrivalSeconds: 21, homeroomSeconds: 7, classSeconds: 35, breakSeconds: 7, lunchSeconds: 35, afterSchoolSeconds: 133,
 // 하루가 짧아진 만큼 같은 비율로 줄여 하루치 출석 횟수는 이전과 같게 유지한다.
 attendanceSeconds: 4,
 // ── 몬스터 출현 ─────────────────────────────────────────
 // 등교 직후부터 귀가까지 시간대와 상관없이 계속 나온다(방과후만 조금 더 빠르다).
 spawnFirstSeconds: .3, spawnClassSeconds: 1, spawnAfterSchoolSeconds: .6,
 spawnBurst: 4,            // 한 번에 채울 수 있는 최대 마리 수(비어 있을수록 많이 채운다)
 spawnSpacing: 18,         // 이미 있는 몬스터와 이만큼은 떨어뜨려 세운다
 // 눈앞에서 툭 튀어나오지 않을 만큼만 막는다.
 spawnMinDistance: 46,     // 플레이어에게서 이 거리 안에는 세우지 않는다
 spawnScreenGuard: .22,    // 화면 가로·세로의 이 비율 안(=한가운데)에는 세우지 않는다
 spawnFade: .6,            // 나타날 때 서서히 또렷해지는 시간(초). 툭 튀어나온 느낌을 없앤다
 aggroHoldScreen: 1.1,     // 화면의 이 배수 안에 있으면 추적 시간이 계속 초기화된다
 // 캠퍼스 전체에 한 번에 머무는 몬스터 수(보스 제외).
 // 학과 건물 주변 40자리 + 중립 구역 28자리를 거의 다 채운다.
 // 1440×900 화면 기준 한 화면에 평균 7마리쯤 보인다.
 maxMonsters: 62 };
// 전투 체감 값. 한 대 한 대 때리는 느낌이 나도록 공격 간격과 피격 반응을 여기서 조절한다.
export const COMBAT = {
 baseAttack: 9,          // 무기를 빼고도 들어가는 기본 공격력
 attackTempo: 1.75,      // 무기별 기본 쿨타임 배수(클수록 느리고 묵직하다)
 damageScale: 1.4,       // 한 대의 위력 배수. 템포보다 낮게 두어 전투가 실제로 조금 길어진다
 impactDrag: .34,        // 타격 순간 플레이어 이동 속도 배수(발이 살짝 느려진다)
 impactDragWindow: .16,  // 그 느려짐이 이어지는 시간(초)
 recoveryRatio: .78,     // 공격 모션 길이 = 쿨타임 × 이 값 (모션 사이의 짧은 템포)
 impactRatio: .26,       // 모션 중 타격이 꽂히는 시점의 비율(이 순간에 이펙트·숫자가 뜬다)
 hitstop: .12,           // 맞은 몬스터가 잠깐 멈추는 시간(화면 전체는 멈추지 않는다)
 flash: .26,             // 몬스터 피격 백색 플래시 지속 시간
 recoil: .22,            // 몬스터가 뒤로 밀렸다가 돌아오는 시간
 recoilDistance: 2.6,    // 그 반동의 시각적 거리
 numberLife: .72,        // 데미지 숫자가 떠 있는 시간
 numberRise: 15,         // 데미지 숫자가 떠오르는 높이
 numberBase: 13,         // 데미지 숫자가 시작하는 높이(몬스터 머리 위)
 // ── Q 공명 타격 ─────────────────────────────────────
 // 화면에 그려지는 원이 곧 판정 범위다. 원 안이면 등 뒤에 있는 적까지 360° 전부 맞는다.
 qRange: 30,             // 공명파가 닿는 반경(그려지는 원과 같은 값)
 qPower: 1.45,           // 한 방의 위력 배수(무기 공명 보정과 곱해진다)
 qCooldown: 2.5,         // 쿨타임(초)
 // ── R 최고 기술 범위(Revision 82) ─────────────────────────
 // 네 학과 공통 반경 하나(R_RADIUS). 판정 · 지면 원 · 학과 연출 · 디버그 선이 모두 이 값을 쓴다.
 // 예전 학과별 반경 42 · 30 · 52 · 36(평균 40)의 1.35배 = 54. Q(qRange 30) × 1.2 = 36 보다 넉넉히 넓다.
 rRadius: 54,
 // 지면 원이 보이는 동안(연출 R_LIFE 의 앞 84%, 흐려지기 전까지) 원 안으로 들어온 적도 맞는다 — 한 번의 R 에 한 적당 직접 피해 1회.
 rActiveRatio: .84,
 // ── R 최고 기술 위력(2026-09-28) ─────────────────────────
 // 학과 기본 위력(growth.js ULTIMATES.power)에 공격력 성장을 곱하고(공격력이 ultimateAttackRef 이하이면 기본 위력 그대로),
 // 같은 장비로 쓰는 Q 공명 타격 한 방의 ultimateOverQ 배를 최저선으로 둔다 — 무기가 강해져도 R 이 Q 보다 약해지지 않는다.
 ultimateAttackRef: 18,
 ultimateOverQ: 3,       // 자동화기계과 기준. 다른 학과는 × 학과 기본 위력/ultimateTopPower (Revision 78)
 ultimateTopPower: 150
};

// 비선공 몬스터 AI. 종류별로 MONSTER_TYPES[kind].ai 에 일부만 덮어쓸 수 있다.
export const MONSTER_AI = {
 // 한 번 맞으면 화면 밖으로 벗어날 때까지는 계속 따라온다.
 // 화면 안에 있는 동안은 aggroDuration 이 계속 초기화되고, 시야를 벗어나야 이 시간이 흐르기 시작한다.
 aggroDuration: 7,        // 화면 밖으로 놓친 뒤 쫓아다니는 시간(초)
 chaseDistance: 200,      // 이 거리 안에서만 추적을 이어 간다(화면 대각선보다 넉넉하게)
 disengageDistance: 260,  // 이보다 멀어지면 화면 판정과 무관하게 즉시 포기한다
 wanderRadius: 26,        // 스폰 지점(home)에서 자유롭게 배회하는 반경
 returnRadius: 5,         // 복귀 중 이 안에 들어오면 다시 배회로 바뀐다
 wanderSpeed: .45,        // 배회 이동 속도 = 종족 speed × 이 값
 returnSpeed: .8,         // 복귀 이동 속도 = 종족 speed × 이 값
 pauseMin: 1.2,           // 배회 중 멈춰 서는 최소 시간
 pauseMax: 3.4            // 배회 중 멈춰 서는 최대 시간
};

export const DEPARTMENTS = [
 {id:'architecture',name:'건축디자인과',short:'건디',color:'#b59172',description:'공간을 그리는 손, 상상을 세우는 하루.'},
 {id:'machine',name:'자동화기계과',short:'기계',color:'#789fad',description:'톱니가 맞물리는 순간, 새로운 가능성.'},
 {id:'electric',name:'전기전자과',short:'전기',color:'#c8b86b',description:'작은 불빛에서 시작되는 커다란 발견.'},
 {id:'civil',name:'토목시스템과',short:'토목',color:'#94a77d',description:'단단한 땅 위에 함께 만드는 내일.'}
];
