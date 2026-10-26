export const LEVELS = [
  { name: 'Novice Tracer', minimum: 0, blurb: 'Learning to see the swaps.' },
  { name: 'Algorithm Apprentice', minimum: 100, blurb: 'Spotting the invariant.' },
  { name: 'Pattern Spotter', minimum: 250, blurb: 'Reading the shape of the work.' },
  { name: 'Master Optimizer', minimum: 450, blurb: 'Choosing the right tool.' },
];

export const XP_REWARDS = {
  lesson: 60,
  prediction: 10,
  debug: 25,
  firstRace: 20,
  race: 5,
  firstSandbox: 5,
};

export function getLevel(xp = 0) {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.minimum) current = level;
  }
  const currentIndex = LEVELS.findIndex((level) => level.name === current.name);
  const next = LEVELS[currentIndex + 1] ?? null;
  const span = next ? next.minimum - current.minimum : 0;
  const earned = xp - current.minimum;
  return {
    ...current,
    index: currentIndex,
    next,
    earned,
    span,
    progress: next ? Math.min(100, Math.round((earned / span) * 100)) : 100,
    toNext: next ? Math.max(0, next.minimum - xp) : 0,
  };
}

export function getBadges(stats) {
  const completedLessons = Object.keys(stats.completedLessons ?? {}).length;
  const solvedDebug = Object.keys(stats.debugSolved ?? {}).length;
  const languages = Object.keys(stats.languageViews ?? {}).length;
  const predictions = stats.predictionsCorrect ?? 0;

  return [
    {
      id: 'first-steps',
      name: 'First Steps',
      mark: '01',
      description: 'Complete your first algorithm lesson.',
      unlocked: completedLessons >= 1,
    },
    {
      id: 'prediction-master',
      name: 'Prediction Master',
      mark: '02',
      description: 'Build a prediction streak of three.',
      unlocked: (stats.bestPredictionStreak ?? 0) >= 3,
    },
    {
      id: 'speed-demon',
      name: 'Speed Demon',
      mark: '03',
      description: 'Finish the Quick Sort lesson.',
      unlocked: Boolean(stats.completedLessons?.quick),
    },
    {
      id: 'edge-case-explorer',
      name: 'Edge Case Explorer',
      mark: '04',
      description: 'Run two custom sandbox traces.',
      unlocked: (stats.customArraysRun ?? 0) >= 2,
    },
    {
      id: 'bug-hunter',
      name: 'Bug Hunter',
      mark: '05',
      description: 'Find your first broken invariant.',
      unlocked: solvedDebug >= 1,
    },
    {
      id: 'case-closed',
      name: 'Case Closed',
      mark: '06',
      description: 'Solve all three debugging challenges.',
      unlocked: solvedDebug >= 3,
    },
    {
      id: 'polyglot',
      name: 'Polyglot',
      mark: '07',
      description: 'Read the lesson in all four languages.',
      unlocked: languages >= 4,
    },
    {
      id: 'racer',
      name: 'Race Strategist',
      mark: '08',
      description: 'Run your first head-to-head race.',
      unlocked: (stats.racesCompleted ?? 0) >= 1,
    },
    {
      id: 'oracle',
      name: 'Oracle',
      mark: '09',
      description: 'Answer ten predictions correctly.',
      unlocked: predictions >= 10,
    },
    {
      id: 'master-optimizer',
      name: 'Master Optimizer',
      mark: '10',
      description: 'Reach 450 XP.',
      unlocked: (stats.xp ?? 0) >= 450,
    },
  ];
}

export function predictionAccuracy(correct = 0, attempted = 0) {
  if (!attempted) return 0;
  return Math.round((correct / attempted) * 100);
}
