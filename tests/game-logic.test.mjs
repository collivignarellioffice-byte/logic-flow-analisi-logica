import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeSessionPoints,
  countCorrect,
  getEmptyAssignments,
  getNextExercise,
  heartsString,
  shuffle,
} from '../game-logic.mjs';

test('creates one empty assignment for every sentence chunk', () => {
  assert.deepEqual(getEmptyAssignments(['Giulia', 'corre']), {
    Giulia: null,
    corre: null,
  });
});

test('counts only exact logical-function matches', () => {
  const correct = { Giulia: 'subject', corre: 'predicato_verbale' };
  const answers = { Giulia: 'subject', corre: 'object' };
  assert.equal(countCorrect(answers, correct), 1);
});

test('does not select exercises already used or explicitly excluded', () => {
  const dataset = [{ id: 1 }, { id: 2 }, { id: 3 }];
  assert.deepEqual(getNextExercise(dataset, [1], 2, () => 0), { id: 3 });
  assert.equal(getNextExercise(dataset, [1, 2, 3]), null);
});

test('keeps lives inside the visual range', () => {
  assert.equal(heartsString(2), '❤️❤️🤍');
  assert.equal(heartsString(-1), '🤍🤍🤍');
  assert.equal(heartsString(5), '❤️❤️❤️');
});

test('calculates session points from completed activities', () => {
  const stats = { classicCorrect: 3, mcqCorrect: 4, detectiveCorrect: 2 };
  assert.equal(computeSessionPoints(stats, true), 53);
});

test('shuffle returns a new array containing the same values', () => {
  const original = [1, 2, 3, 4];
  const shuffled = shuffle(original, () => 0.25);
  assert.deepEqual([...shuffled].sort(), original);
  assert.notEqual(shuffled, original);
});
