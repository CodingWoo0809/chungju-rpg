// 등각 투영의 그리기 순서.
//
// 화면 깊이는 x+y 하나로 정렬한다. 그런데 건물처럼 큰 상자는 가장 가까운 모서리
// (x+w, y+d) 를 기준으로 잡히기 때문에, 그 상자 '앞'에 서 있는 사람·몬스터가
// 더 작은 x+y 를 갖게 되어 건물 뒤로 밀려 사라지는 문제가 생긴다.
// (예: 본관은 깊이 992 인데 운동장 쪽 x 600, y 300 에 선 사람은 900 이라 가려졌다.)
//
// 축에 나란한 상자끼리는 한 축으로 떨어져 있으면 그 축이 앞뒤를 결정한다.
// 두 축이 서로 반대로 떨어져 있으면(대각선) 화면에서 아예 겹치지 않으므로 순서를 따질 필요가 없다.

export function blockerBoxes(boxes) {
  return boxes.map(b => ({ id: b.id, x: b.x, y: b.y, x1: b.x + b.w, y1: b.y + b.d, depth: b.x + b.w + b.y + b.d }));
}

// 점이 상자보다 앞이면 +1, 뒤면 -1, 화면에서 겹치지 않으면 0.
export function sideOf(px, py, b) {
  const xRel = px > b.x1 ? 1 : px < b.x ? -1 : 0;
  const yRel = py > b.y1 ? 1 : py < b.y ? -1 : 0;
  if (xRel * yRel < 0) return 0;              // 대각선으로 비껴 있어 화면에서 겹치지 않는다
  return xRel || yRel;
}

// 사람·몬스터·아이템의 그리기 깊이. 앞에 선 상자보다는 뒤에, 뒤에 선 상자보다는 앞에 둔다.
//
// 주의: 같은 상자 앞에 있는 물체는 전부 `b.depth + .01` 이라는 '같은 값'으로 눌린다. 값이 같으면
// 정렬이 안정 정렬이라 앞뒤가 배열 순서로 정해져 버린다 — 전기전자과(깊이 862)처럼 아주 긴 건물
// 동쪽에서는 창고·밴드부 동아리실·비막이 조각까지 18개가 한꺼번에 862.01 로 눌려, 배열에서 뒤에
// 있던 비막이가 건물 지붕 위에 덧칠되는 문제가 있었다. 그래서 눌린 경우에만 자기 원래 깊이를
// 아주 작은 가중치(1e-6)로 얹어, 눌린 것들끼리의 실제 앞뒤는 그대로 지키게 한다.
// 가중치는 .01 보다 훨씬 작아 다른 상자와의 앞뒤 관계는 건드리지 않는다.
export function actorDepth(px, py, blockers) {
  const own = px + py;
  let depth = own;
  for (const b of blockers) {
    if (sideOf(px, py, b) !== 1) continue;
    if (depth < b.depth) depth = b.depth + .01;   // 이 상자 바로 뒤에 그려지도록 밀어 올린다
  }
  return depth === own ? depth : depth + own * 1e-6;
}
