'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { XP_REWARDS } from '../lib/progress.js';

const INITIAL = {
  xp: 0,
  completedLessons: {},
  predictions: {},
  predictionStreak: 0,
  bestPredictionStreak: 0,
  predictionsCorrect: 0,
  predictionsAttempted: 0,
  racesCompleted: 0,
  sandboxRuns: 0,
  customArraysRun: 0,
  languageViews: {},
  debugSolved: {},
};

export const useLearningStore = create(
  persist(
    (set, get) => ({
      ...INITIAL,

      completeLesson(algorithm) {
        if (!algorithm || get().completedLessons[algorithm]) return false;
        set((state) => ({
          xp: state.xp + XP_REWARDS.lesson,
          completedLessons: { ...state.completedLessons, [algorithm]: true },
        }));
        return true;
      },

      recordPrediction({ key, correct }) {
        if (!key) return { awarded: false, correct: false };
        const existing = get().predictions[key];
        if (existing) return { awarded: false, correct: existing.correct };

        set((state) => {
          const streak = correct ? state.predictionStreak + 1 : 0;
          return {
            xp: state.xp + (correct ? XP_REWARDS.prediction : 0),
            predictions: {
              ...state.predictions,
              [key]: { correct, at: Date.now() },
            },
            predictionStreak: streak,
            bestPredictionStreak: Math.max(state.bestPredictionStreak, streak),
            predictionsAttempted: state.predictionsAttempted + 1,
            predictionsCorrect: state.predictionsCorrect + (correct ? 1 : 0),
          };
        });
        return { awarded: true, correct };
      },

      recordRace() {
        const first = get().racesCompleted === 0;
        set((state) => ({
          xp: state.xp + (first ? XP_REWARDS.firstRace : XP_REWARDS.race),
          racesCompleted: state.racesCompleted + 1,
        }));
      },

      recordSandboxRun() {
        const first = get().sandboxRuns === 0;
        set((state) => ({
          xp: state.xp + (first ? XP_REWARDS.firstSandbox : 0),
          sandboxRuns: state.sandboxRuns + 1,
          customArraysRun: state.customArraysRun + 1,
        }));
      },

      recordLanguageView(language) {
        if (!language || get().languageViews[language]) return;
        set((state) => ({
          languageViews: { ...state.languageViews, [language]: true },
        }));
      },

      solveDebug(challengeId) {
        if (!challengeId || get().debugSolved[challengeId]) return false;
        set((state) => ({
          xp: state.xp + XP_REWARDS.debug,
          debugSolved: { ...state.debugSolved, [challengeId]: true },
        }));
        return true;
      },

      resetProgress() {
        set({ ...INITIAL });
      },
    }),
    {
      name: 'algoviz-progress-v1',
      version: 1,
      skipHydration: true,
      partialize: (state) => ({
        xp: state.xp,
        completedLessons: state.completedLessons,
        predictions: state.predictions,
        predictionStreak: state.predictionStreak,
        bestPredictionStreak: state.bestPredictionStreak,
        predictionsCorrect: state.predictionsCorrect,
        predictionsAttempted: state.predictionsAttempted,
        racesCompleted: state.racesCompleted,
        sandboxRuns: state.sandboxRuns,
        customArraysRun: state.customArraysRun,
        languageViews: state.languageViews,
        debugSolved: state.debugSolved,
      }),
    },
  ),
);
