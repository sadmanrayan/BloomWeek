import test from 'node:test';
import assert from 'node:assert/strict';
import { TRIMESTER_CARE_GUIDES, getTrimesterCareGuide } from './nutritionGuide';

test('all three trimesters provide complete foods, avoidances, and warning signs', () => {
  const trimesters = [1, 2, 3] as const;

  for (const t of trimesters) {
    const guide = getTrimesterCareGuide(t);
    assert.equal(guide.trimester, t);
    assert.ok(guide.headline.length > 10);
    assert.ok(guide.priorityNutrients.length >= 3);
    assert.ok(guide.recommendedFoods.length >= 5, `Trimester ${t} should list >= 5 recommended foods`);
    assert.ok(guide.foodsToAvoid.length >= 5, `Trimester ${t} should list >= 5 items to avoid`);
    assert.ok(guide.warningSigns.length >= 5, `Trimester ${t} should list >= 5 warning signs`);
  }

  assert.equal(Object.keys(TRIMESTER_CARE_GUIDES).length, 3);
  assert.match(getTrimesterCareGuide(1).priorityNutrients[0], /Folate/i);
  assert.match(getTrimesterCareGuide(2).priorityNutrients[0], /Calcium/i);
  assert.match(getTrimesterCareGuide(3).warningSigns[0].symptom, /movement/i);
});
