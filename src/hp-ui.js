// Revision 81 · 학생 피드백: 플레이어 체력 표시 두 곳(머리 위 작은 체력바 · 왼쪽 아래 HUD 체력바)이
// 같은 체력 값(state.player.hp / maxHp)과 같은 기준을 쓰도록 한곳에 모았다. 전투 · 회복 규칙은 건드리지 않는다.
//   60% 초과 → 보통(ok) · 30% 초과 ~ 60% 이하 → 주의(warn) · 30% 이하 → 위험(low, 빨강)
export const HP_WARN = .6, HP_LOW = .3;
export const HP_COLORS = Object.freeze({ ok: '#5dbb8c', warn: '#e2a53a', low: '#e0524a' });
export const LOW_HP_MESSAGE = '체력이 얼마 남지 않았어요! 잠시 물러나 체력을 회복하세요.';

export function hpRatio(player) {
  const max = player?.maxHp > 0 ? player.maxHp : 100;
  const hp = Number.isFinite(player?.hp) ? player.hp : 0;
  return Math.max(0, Math.min(1, hp / max));
}
export function hpTone(ratio) { return ratio <= HP_LOW ? 'low' : ratio <= HP_WARN ? 'warn' : 'ok'; }

// 머리 위 체력바. 캐릭터 발밑 좌표에서 z 만큼 위(머리 · 투구 위 여백)에 30×4px 로 작게 그린다.
// 무기는 몸 옆 · 앞으로 들려 있어 이 높이까지 올라오지 않는다(실제 화면 확인 · Revision 81).
export const HEAD_BAR = Object.freeze({ z: 8, width: 30, height: 4 });
export function headBarBox(project, player) {
  const p = project(player.x, player.y, HEAD_BAR.z);
  return { x: Math.round(p.x - HEAD_BAR.width / 2), y: Math.round(p.y - HEAD_BAR.height / 2), w: HEAD_BAR.width, h: HEAD_BAR.height };
}
export function drawHeadHpBar(c, project, player) {
  if (!player || !(player.hp > 0)) return null;
  const ratio = hpRatio(player), tone = hpTone(ratio), box = headBarBox(project, player);
  c.save();
  c.fillStyle = '#1d2b26b3'; c.fillRect(box.x - 1, box.y - 1, box.w + 2, box.h + 2);
  c.fillStyle = '#fffdf52e'; c.fillRect(box.x, box.y, box.w, box.h);
  c.fillStyle = HP_COLORS[tone]; c.fillRect(box.x, box.y, Math.max(1, Math.round(box.w * ratio)), box.h);
  c.restore();
  return { ...box, tone, ratio };
}

// HUD 저체력 경고: 30% 이하로 '들어가는 순간' 한 번만 짧게 알리고, 30% 초과로 회복하면 다시 알릴 수 있게 된다.
// 같은 위험 구간에 머무르는 동안에는 다시 띄우지 않는다(메시지 도배 방지).
export function lowHpWatch(watch, player) {
  const low = player?.hp > 0 && hpTone(hpRatio(player)) === 'low';
  if (!low) { if (hpRatio(player) > HP_LOW) watch.warned = false; return false; }
  if (watch.warned) return false;
  watch.warned = true; return true;
}
