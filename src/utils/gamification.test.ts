import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getLevelInfo,
  calculateTopicMasteryStatus,
  calculateQuizXp,
} from './gamification';

test('getLevelInfo calculates correct levels and thresholds', () => {
  const b0 = getLevelInfo(0);
  assert.equal(b0.name, 'Beginner');
  assert.equal(b0.level, 1);
  assert.equal(b0.progressPercent, 0);

  const b75 = getLevelInfo(75);
  assert.equal(b75.name, 'Beginner');
  assert.equal(b75.progressPercent, 50);

  const l151 = getLevelInfo(151);
  assert.equal(l151.name, 'Learner');
  assert.equal(l151.level, 2);

  const ex401 = getLevelInfo(401);
  assert.equal(ex401.name, 'Explorer');
  assert.equal(ex401.level, 3);

  const sc801 = getLevelInfo(801);
  assert.equal(sc801.name, 'Scholar');
  assert.equal(sc801.level, 4);

  const exp1501 = getLevelInfo(1501);
  assert.equal(exp1501.name, 'Expert');
  assert.equal(exp1501.level, 5);
  assert.equal(exp1501.progressPercent, 100);
});

test('calculateTopicMasteryStatus categorizes correctly', () => {
  assert.equal(calculateTopicMasteryStatus(0, 0), 'Insufficient Data');
  assert.equal(calculateTopicMasteryStatus(90, 2), 'Strong');
  assert.equal(calculateTopicMasteryStatus(65, 1), 'Improving');
  assert.equal(calculateTopicMasteryStatus(35, 1), 'Needs Revision');
});

test('calculateQuizXp awards appropriate bonuses', () => {
  // 3 out of 5 correct, no comeback: 50 base + 30 bonus = 80
  assert.equal(calculateQuizXp(3, 5, false), 80);

  // 5 out of 5 correct (perfect score): 50 base + 50 bonus + 25 perfect = 125
  assert.equal(calculateQuizXp(5, 5, false), 125);

  // 4 out of 5 correct with comeback: 50 + 40 + 40 comeback = 130
  assert.equal(calculateQuizXp(4, 5, true), 130);
});
