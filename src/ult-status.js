// ── 최고 기술(R) 학과별 후속 효과 (Revision 78) ─────────────────────────────
// R 직접 피해(combat.js ultimateDamage)는 그대로 두고, 맞은 적에게 학과마다 다른 상태를 남긴다.
//   자동화기계과  없음 — 네 학과 중 가장 높은 직접 피해가 곧 장점이다.
//   전기전자과    감전: R 이 실제로 준 직접 피해의 20% 를 4초 동안 1초마다 4번 나눠 준다(마지막 틱이 나머지를 채워 합이 정확히 20%).
//   건축디자인과  구조 취약점 분석: 5초 동안 플레이어에게 받는 피해 +15%. R 피해가 들어간 뒤에 걸리므로 그 R 에는 소급되지 않는다.
//   토목시스템과  진흙 구속: 일반 몬스터 3초 완전 구속(이동 · 공격 불가, 준비 중이던 공격은 취소).
//                 보스는 1초 경직 뒤 3초 동안 이동속도 40% 감소 — 페이즈 전환 중에는 걸리지 않고, 전환이 시작되면 경직은 풀린다.
// 같은 효과는 수치가 쌓이지 않고 다시 걸리면 지속시간만 새로 시작한다. 상태는 몬스터 객체의 status 에만 있고(저장 형식 변경 없음),
// 몬스터가 죽거나 플레이어와 다른 장면에 있게 되거나(combat.js) 게임을 불러오면(simulation.js initSimulation) 지운다.
export const ULT_STATUS = Object.freeze({
  shockShare: .2, shockTime: 4, shockTicks: 4,
  vulnTime: 5, vulnBonus: .15,
  rootTime: 3,
  bossStagger: 1, bossSlowTime: 3, bossSlow: .4,
  // 학과 공명 3/3(Revision 79)
  shockShareEmpowered: .3, vulnBonusEmpowered: .2, rootTimeEmpowered: 4, bossSlowEmpowered: .5,
});

export function clearStatuses(m) { if (m) delete m.status; }

// R 한 번이 적 하나에 맞은 직후 부른다. dealt = 그 적에게 실제로 들어간 직접 피해.
// empowered = 학과 공명 3/3(dept-resonance.js, Revision 79): 감전 30% · 취약 +20% · 일반 구속 4초 · 보스 둔화 50%. 지속시간 · 경직 1초는 그대로.
export function applyUltimateStatus(m, dept, dealt, empowered = false) {
  const S = ULT_STATUS;
  if (dept === 'electric') {
    const total = Math.max(0, dealt) * (empowered ? S.shockShareEmpowered : S.shockShare);
    if (total > 0) (m.status ??= {}).shock = { total, left: total, ticks: S.shockTicks, next: S.shockTime / S.shockTicks, time: S.shockTime };
  } else if (dept === 'architecture') {
    Object.assign(m.status ??= {}, { vuln: S.vulnTime, vulnBonus: empowered ? S.vulnBonusEmpowered : S.vulnBonus });   // 다시 걸면 시간 갱신, 배율은 새로 건 쪽
  } else if (dept === 'civil') {
    if (m.kind === 'boss') {
      if (m.phase === 'shift') return;                              // 페이즈 전환 연출 중에는 끊지 않는다
      Object.assign(m.status ??= {}, { stagger: S.bossStagger, slow: S.bossSlowTime, slowAmount: empowered ? S.bossSlowEmpowered : S.bossSlow });
    } else {
      (m.status ??= {}).root = empowered ? S.rootTimeEmpowered : S.rootTime;
      if (m.phase === 'windup') { m.phase = 'recover'; m.timer = 0; }   // 준비 중이던 공격은 취소
    }
  }
}

// 플레이어가 주는 피해 배율(구조 취약점).
export function playerDamageMultiplier(m) { return m?.status?.vuln > 0 ? 1 + (m.status.vulnBonus ?? ULT_STATUS.vulnBonus) : 1; }
export const isRooted = m => (m?.status?.root || 0) > 0;
export const isStaggered = m => (m?.status?.stagger || 0) > 0;
// 보스 이동 배율: 경직 중 0, 둔화 중 0.6, 평소 1.
export function bossSpeedFactor(m) { return isStaggered(m) ? 0 : (m?.status?.slow || 0) > 0 ? 1 - (m.status.slowAmount ?? ULT_STATUS.bossSlow) : 1; }

// 매 프레임 상태 시간을 줄이고 감전 틱을 낸다. hurt(amount) 는 실제로 피해를 줬으면 true(보스 전환 중이면 false → 그 틱은 미뤄진다).
export function tickStatuses(m, dt, hurt) {
  const st = m.status; if (!st) return;
  if (st.shock) {
    const sh = st.shock;
    sh.next -= dt;
    while (sh.next <= 0 && sh.ticks > 0) {
      const amount = sh.ticks === 1 ? sh.left : sh.total / ULT_STATUS.shockTicks;
      if (!hurt(amount)) { sh.next = 0; break; }                    // 전환 중: 다음 프레임에 다시
      sh.left -= amount; sh.ticks--; sh.next += ULT_STATUS.shockTime / ULT_STATUS.shockTicks;
    }
    sh.time = Math.max(0, sh.time - dt);
    if (sh.ticks <= 0) delete st.shock;
  }
  if (st.vuln > 0) { st.vuln = Math.max(0, st.vuln - dt); if (!st.vuln) { delete st.vuln; delete st.vulnBonus; } }
  if (st.root > 0) { st.root = Math.max(0, st.root - dt); if (!st.root) delete st.root; }
  if (st.stagger > 0) { st.stagger = Math.max(0, st.stagger - dt); if (!st.stagger) delete st.stagger; }
  else if (st.slow > 0) { st.slow = Math.max(0, st.slow - dt); if (!st.slow) { delete st.slow; delete st.slowAmount; } }   // 둔화는 경직이 끝난 뒤부터 흐른다
  if (!Object.keys(st).length) delete m.status;
}
