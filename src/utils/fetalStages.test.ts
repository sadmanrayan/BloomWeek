import test from 'node:test';
import assert from 'node:assert/strict';
import { FETAL_STAGE_ANCHORS, resolveFetalStageBlend } from './fetalStages';

test('resolveFetalStageBlend maps anchor days cleanly with zero out-of-bounds indices', () => {
  const d1 = resolveFetalStageBlend(1);
  assert.equal(d1.lowerIndex, 0);
  assert.equal(d1.upperIndex, 0);
  assert.equal(d1.blend, 0);

  const d60 = resolveFetalStageBlend(60);
  assert.equal(d60.stageId, 'w9');
  assert.equal(d60.blend, 0);

  const d280 = resolveFetalStageBlend(280);
  assert.equal(d280.lowerIndex, FETAL_STAGE_ANCHORS.length - 1);
  assert.equal(d280.upperIndex, FETAL_STAGE_ANCHORS.length - 1);
  assert.equal(d280.stageId, 'w38');
});

test('resolveFetalStageBlend interpolates smoothly day by day with monotonic growthZoom', () => {
  const mid = resolveFetalStageBlend(119); // midpoint between Day 98 (w14) and Day 140 (w20)
  assert.equal(mid.lowerIndex, 2);
  assert.equal(mid.upperIndex, 3);
  assert.ok(mid.blend > 0.45 && mid.blend < 0.55);

  let prevZoom = 0;
  for (let day = 1; day <= 280; day += 7) {
    const res = resolveFetalStageBlend(day);
    assert.ok(res.growthZoom >= prevZoom);
    assert.ok(res.heartUv[0] > 0.3 && res.heartUv[0] < 0.7);
    assert.ok(res.heartUv[1] > 0.2 && res.heartUv[1] < 0.6);
    prevZoom = res.growthZoom;
  }
});
