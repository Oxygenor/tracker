import { useMemo } from 'react'
import type { HabitStat } from './useStatsData'

export interface Achievement {
  id: string
  title: string
  description: string
  emoji: string
  earned: boolean
  progress?: number // 0-100
}

export interface GamificationData {
  xp: number
  level: number
  levelTitle: string
  xpForCurrentLevel: number
  xpForNextLevel: number
  xpProgress: number // 0-100
  achievements: Achievement[]
  totalCompletions: number
}

const LEVEL_TITLES = [
  'Новачок',
  'Початківець',
  'Практикант',
  'Послідовний',
  'Стійкий',
  'Досвідчений',
  'Майстер',
  'Чемпіон',
  'Легенда',
  'Непереможний',
]

function getLevel(xp: number): number {
  // Level thresholds: 0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000
  const thresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000]
  let level = 0
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) { level = i; break }
  }
  return Math.min(level, LEVEL_TITLES.length - 1)
}

function getLevelXP(level: number): number {
  const thresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000]
  return thresholds[Math.min(level, thresholds.length - 1)]
}

export function useGamification(habitStats: HabitStat[]): GamificationData {
  return useMemo(() => {
    const totalCompletions = habitStats.reduce((s, h) => s + h.allLogs.filter((l) => l.value > 0).length, 0)
    const xp = totalCompletions * 10

    const level = getLevel(xp)
    const levelTitle = LEVEL_TITLES[level]
    const xpForCurrentLevel = getLevelXP(level)
    const xpForNextLevel = getLevelXP(level + 1)
    const xpProgress = xpForNextLevel > xpForCurrentLevel
      ? Math.round(((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100)
      : 100

    const bestStreak = habitStats.reduce((m, h) => Math.max(m, h.allTimeStreak), 0)
    const habitsCount = habitStats.length
    const habitsWithStreak7 = habitStats.filter((h) => h.streak >= 7).length
    const habitsWithStreak30 = habitStats.filter((h) => h.streak >= 30).length
    const perfect7Days = habitStats.length > 0
      ? habitStats.every((h) => {
          const last7 = h.allLogs.slice(-7)
          return last7.filter((l) => l.value > 0).length === 7
        })
      : false

    const achievements: Achievement[] = [
      {
        id: 'first_step',
        title: 'Перший крок',
        description: 'Виконай звичку вперше',
        emoji: '🌱',
        earned: totalCompletions >= 1,
      },
      {
        id: 'habit_10',
        title: 'Розгін',
        description: '10 виконань',
        emoji: '🔥',
        earned: totalCompletions >= 10,
        progress: Math.min(100, Math.round((totalCompletions / 10) * 100)),
      },
      {
        id: 'habit_100',
        title: 'Сотня',
        description: '100 виконань звичок',
        emoji: '💯',
        earned: totalCompletions >= 100,
        progress: Math.min(100, Math.round((totalCompletions / 100) * 100)),
      },
      {
        id: 'habit_500',
        title: 'Залізна воля',
        description: '500 виконань звичок',
        emoji: '⚡',
        earned: totalCompletions >= 500,
        progress: Math.min(100, Math.round((totalCompletions / 500) * 100)),
      },
      {
        id: 'streak_7',
        title: 'Тижнева серія',
        description: '7 днів поспіль',
        emoji: '📅',
        earned: bestStreak >= 7,
        progress: Math.min(100, Math.round((bestStreak / 7) * 100)),
      },
      {
        id: 'streak_30',
        title: 'Місячна серія',
        description: '30 днів поспіль',
        emoji: '🏆',
        earned: bestStreak >= 30,
        progress: Math.min(100, Math.round((bestStreak / 30) * 100)),
      },
      {
        id: 'streak_100',
        title: 'Легенда',
        description: '100 днів поспіль',
        emoji: '👑',
        earned: bestStreak >= 100,
        progress: Math.min(100, Math.round((bestStreak / 100) * 100)),
      },
      {
        id: 'multi_habit',
        title: 'Колекціонер',
        description: 'Додай 5+ звичок',
        emoji: '🎯',
        earned: habitsCount >= 5,
        progress: Math.min(100, Math.round((habitsCount / 5) * 100)),
      },
      {
        id: 'all_7days',
        title: 'Перфекціоніст',
        description: '7 ідеальних днів поспіль',
        emoji: '✨',
        earned: perfect7Days,
      },
      {
        id: 'multi_streak_7',
        title: 'Майстер звичок',
        description: '3+ звички по 7 днів',
        emoji: '🌟',
        earned: habitsWithStreak7 >= 3,
        progress: Math.min(100, Math.round((habitsWithStreak7 / 3) * 100)),
      },
      {
        id: 'multi_streak_30',
        title: 'Геракл',
        description: '3+ звички по 30 днів',
        emoji: '🦁',
        earned: habitsWithStreak30 >= 3,
        progress: Math.min(100, Math.round((habitsWithStreak30 / 3) * 100)),
      },
      {
        id: 'level_5',
        title: 'Досвідчений',
        description: 'Досягни 5-го рівня',
        emoji: '🎖️',
        earned: level >= 5,
      },
    ]

    return {
      xp,
      level,
      levelTitle,
      xpForCurrentLevel,
      xpForNextLevel,
      xpProgress,
      achievements,
      totalCompletions,
    }
  }, [habitStats])
}
