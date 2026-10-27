import test from 'node:test';
import assert from 'node:assert/strict';
import { countWords, calculateScorePercentage, formatEvidenceBadge } from './study';

test('countWords accurately calculates word count', () => {
  assert.equal(countWords(''), 0);
  assert.equal(countWords('   '), 0);
  assert.equal(countWords('Hello world'), 2);
  assert.equal(countWords('   Glycolysis occurs in cytoplasm   '), 4);
});

test('calculateScorePercentage handles edge cases and math', () => {
  assert.equal(calculateScorePercentage(0, 0), 0);
  assert.equal(calculateScorePercentage(3, 4), 75);
  assert.equal(calculateScorePercentage(4, 4), 100);
  assert.equal(calculateScorePercentage(1, 3), 33);
});

test('formatEvidenceBadge returns appropriate labels and variants', () => {
  assert.deepEqual(formatEvidenceBadge('Supported'), {
    label: 'Evidence Supported',
    variant: 'success',
  });
  assert.deepEqual(formatEvidenceBadge('Partially Supported'), {
    label: 'Partially Supported',
    variant: 'warning',
  });
  assert.deepEqual(formatEvidenceBadge('Out of Syllabus'), {
    label: 'Out of Syllabus',
    variant: 'danger',
  });
  assert.deepEqual(formatEvidenceBadge('Not Found'), {
    label: 'Not Found in Notes',
    variant: 'neutral',
  });
});
