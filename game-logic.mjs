export function getEmptyAssignments(chunks) {
  return Object.fromEntries(chunks.map((chunk) => [chunk, null]));
}

export function countCorrect(assignments, correctMap) {
  return Object.keys(correctMap).reduce(
    (total, chunk) => total + Number(assignments[chunk] === correctMap[chunk]),
    0
  );
}

export function getNextExercise(dataset, usedIds = [], excludeId = null, random = Math.random) {
  const pool = dataset.filter(
    (item) => !usedIds.includes(item.id) && item.id !== excludeId
  );

  if (pool.length === 0) return null;
  return pool[Math.floor(random() * pool.length)];
}

export function heartsString(lives, maximum = 3) {
  const safeLives = Math.max(0, Math.min(maximum, lives));
  return '❤️'.repeat(safeLives) + '🤍'.repeat(maximum - safeLives);
}

export function computeSessionPoints(stats, dailyCompleted) {
  return (
    stats.classicCorrect * 10 +
    stats.mcqCorrect +
    stats.detectiveCorrect * 2 +
    Number(dailyCompleted) * 15
  );
}

export function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}
