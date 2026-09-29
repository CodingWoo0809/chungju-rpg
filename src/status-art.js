// ── R 후속 상태 표시(Revision 78) ───────────────────────────────────────────
// 판정과 무관한 그림 전용. 상태는 m.status(ult-status.js)만 읽는다. 기존 몬스터 · 보스 · Q/R 연출은 건드리지 않고
// 몬스터를 그리기 직전(바닥 층)과 직후(앞 층)에 작게 덧그린다.
//   진흙 구속(토목)  발밑의 진흙 웅덩이 + 발목을 덮는 진흙 테두리. 보스는 경직 동안 크게, 둔화 동안 옅게 끈적이는 자국.
//   구조 취약점(건축) 몸 둘레를 도는 얇은 붉은 도면 선(모서리 표시 사각 틀) + 가운데 조준점.
//   감전(전기)       몸 주변에 작은 파란 불꽃이 깜빡인다.
import {CONFIG} from './config.js';
import {groundEllipse,rnd} from './combat-vfx.js';

const bodyHeight = m => m.kind === 'boss' ? 28 : 12;
const fade = (left, edge = .35) => Math.max(0, Math.min(1, left / edge));

function mudPuddle(d, m, t, r, alpha) {
  const c = d.c, e = groundEllipse(d, m.x, m.y, r);
  c.save();
  c.globalAlpha = alpha;
  // 울퉁불퉁한 가장자리
  c.beginPath();
  for (let i = 0; i <= 28; i++) {
    const a = i / 28 * Math.PI * 2, wob = 1 + (rnd(m.id?.length || 7, i % 28) - .5) * .22 + Math.sin(t * 2 + i) * .02;
    const x = e.x + Math.cos(a) * e.rx * wob, y = e.y + Math.sin(a) * e.ry * wob;
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.closePath();
  const g = c.createRadialGradient(e.x, e.y - e.ry * .2, e.ry * .2, e.x, e.y, e.rx);
  g.addColorStop(0, '#8a6a43'); g.addColorStop(.7, '#6b4f30'); g.addColorStop(1, '#4d3822');
  c.fillStyle = g; c.fill();
  c.lineWidth = 1.2; c.strokeStyle = 'rgba(40,28,16,.55)'; c.stroke();
  // 기포 몇 개
  for (let i = 0; i < 4; i++) {
    const ph = (t * .9 + rnd(9, i)) % 1, a = rnd(3, i) * Math.PI * 2, k = .25 + rnd(5, i) * .5;
    c.globalAlpha = alpha * (1 - ph) * .8;
    c.beginPath(); c.arc(e.x + Math.cos(a) * e.rx * k, e.y + Math.sin(a) * e.ry * k, 1 + ph * 2.2, 0, Math.PI * 2);
    c.strokeStyle = '#b8966a'; c.lineWidth = .9; c.stroke();
  }
  c.restore();
}

function mudCollar(d, m, t, r, alpha) {
  // 몬스터 몸 앞쪽 아래를 덮는 진흙(발목까지 잠긴 느낌)
  const c = d.c, e = groundEllipse(d, m.x, m.y, r * .78, .6);
  c.save(); c.globalAlpha = alpha;
  c.beginPath(); c.ellipse(e.x, e.y, e.rx, e.ry, 0, 0, Math.PI); c.lineTo(e.x - e.rx, e.y);
  for (let i = 0; i <= 6; i++) {                                   // 위로 튀어 오른 진흙 방울
    const x = e.x - e.rx + i / 6 * e.rx * 2, up = (i % 2 ? 2.2 : 3.6) * CONFIG.zoom / 7.2 + Math.sin(t * 3 + i) * .4;
    c.lineTo(x, e.y - up);
  }
  c.closePath(); c.fillStyle = '#6f5233'; c.fill();
  c.strokeStyle = 'rgba(40,28,16,.6)'; c.lineWidth = 1; c.stroke();
  c.restore();
}

function blueprint(d, m, t, alpha) {
  const c = d.c, h = bodyHeight(m), p = d.p(m.x, m.y, h * .5), s = (m.kind === 'boss' ? 62 : 27) * CONFIG.zoom / 7.2;
  c.save(); c.globalAlpha = alpha; c.translate(p.x, p.y);
  c.strokeStyle = 'rgba(236,58,46,.92)'; c.lineWidth = 1.6; c.shadowColor = 'rgba(255,255,255,.75)'; c.shadowBlur = 2;
  // 천천히 도는 설계 사각 틀(모서리 표시만)
  c.save(); c.rotate(t * .6);
  for (let k = 0; k < 4; k++) {
    c.rotate(Math.PI / 2); c.beginPath();
    c.moveTo(s, s - s * .38); c.lineTo(s, s); c.lineTo(s - s * .38, s); c.stroke();
  }
  c.restore();
  // 치수선(점선) + 조준점
  c.setLineDash([3, 3]); c.lineDashOffset = -t * 12;
  c.beginPath(); c.moveTo(-s * 1.35, 0); c.lineTo(s * 1.35, 0); c.moveTo(0, -s * 1.35); c.lineTo(0, s * 1.35); c.stroke();
  c.setLineDash([]);
  const pulse = 1 + Math.sin(t * 6) * .12;
  c.beginPath(); c.arc(0, 0, s * .3 * pulse, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.arc(0, 0, s * .16, 0, Math.PI * 2); c.stroke();
  c.fillStyle = '#ff4a38'; c.beginPath(); c.arc(0, 0, 2.4, 0, Math.PI * 2); c.fill();
  c.restore();
}

function sparks(d, m, t, alpha) {
  const c = d.c, h = bodyHeight(m), w = (m.kind === 'boss' ? 6 : 3.2);
  const beat = Math.floor(t * 14), seed = (m.x * 13 + m.y * 7) | 0;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  for (let i = 0; i < 4; i++) {
    if (rnd(seed + beat, i) < .25) continue;                        // 깜빡임
    const a = rnd(seed + beat, i + 5) * Math.PI * 2, z = h * (.25 + rnd(seed + beat, i + 9) * .7);
    const p = d.p(m.x + Math.cos(a) * w, m.y + Math.sin(a) * w, z), len = (12 + rnd(seed, i) * 8) * CONFIG.zoom / 7.2;
    const pts = [[0, 0]]; let x = 0, y = 0;
    for (let k = 0; k < 3; k++) { x += (rnd(seed + beat, i * 7 + k) - .5) * len; y -= len / 3; pts.push([x, y]); }
    c.globalAlpha = alpha;
    for (const [col, lw] of [['rgba(80,165,255,.5)', 5], ['#7cc4ff', 2.4], ['#f2faff', 1.1]]) {
      c.beginPath(); pts.forEach(([u, v], k) => k ? c.lineTo(p.x + u, p.y + v) : c.moveTo(p.x + u, p.y + v));
      c.strokeStyle = col; c.lineWidth = lw; c.stroke();
    }
  }
  c.restore();
}

// 몬스터를 그리기 직전(바닥)
export function drawStatusGround(d, m, t) {
  const st = m.status; if (!st) return;
  if (st.root > 0) mudPuddle(d, m, t, m.radius + 2.2, fade(st.root));
  else if (st.stagger > 0) mudPuddle(d, m, t, m.radius + 3.5, fade(st.stagger, .2));
  else if (st.slow > 0) mudPuddle(d, m, t, m.radius + 1.5, .45 * fade(st.slow));
}
// 몬스터를 그린 직후(앞)
export function drawStatusFront(d, m, t) {
  const st = m.status; if (!st) return;
  if (m.kind !== 'boss' && st.root > 0) mudCollar(d, m, t, m.radius + 1.6, fade(st.root));
  if (m.kind === 'boss') {                                          // 보스: 경직 동안 진하게, 둔화 동안 옅게 발목 진흙
    if (st.stagger > 0) mudCollar(d, m, t, m.radius + 1.2, fade(st.stagger, .2));
    else if (st.slow > 0) mudCollar(d, m, t, m.radius + 1.2, .55 * fade(st.slow));
  }
  if (st.vuln > 0) blueprint(d, m, t, .9 * fade(st.vuln, .5));
  if (st.shock) sparks(d, m, t, 1);
}

// 보스 보상 분출이 시작될 때 한 번 퍼지는 금빛 원
export function drawLootBurst(d, e, t) {
  const c = d.c, u = 1 - e.life / e.full;
  for (const [k, col] of [[1, '255,226,140'], [.6, '255,250,225']]) {
    const g = groundEllipse(d, e.x, e.y, 6 + u * 26 * k);
    c.save(); c.globalAlpha = Math.max(0, 1 - u) * .8;
    c.beginPath(); c.ellipse(g.x, g.y, g.rx, g.ry, 0, 0, Math.PI * 2);
    c.strokeStyle = `rgb(${col})`; c.lineWidth = 3 * (1 - u) + 1; c.stroke(); c.restore();
  }
  // 위로 솟는 빛기둥
  const p = d.p(e.x, e.y, 0), h = 90 * CONFIG.zoom / 7.2 * Math.min(1, u * 3);
  c.save(); c.globalAlpha = Math.max(0, .55 * (1 - u));
  const g = c.createLinearGradient(0, p.y - h, 0, p.y);
  g.addColorStop(0, 'rgba(255,240,190,0)'); g.addColorStop(1, 'rgba(255,226,140,.9)');
  c.fillStyle = g; c.fillRect(p.x - 10, p.y - h, 20, h); c.restore();
}
