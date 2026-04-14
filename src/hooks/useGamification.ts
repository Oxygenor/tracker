import { useMemo } from 'react'
import { getMonth } from 'date-fns'
import type { HabitStat } from './useStatsData'
import type { Habit } from '@/types'

export interface Achievement {
  id: string
  title: string
  description: string
  emoji: string
  earned: boolean
  progress?: number // 0-100
  seasonal?: boolean
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
  comboBonus: number // 0 | 50 | 100 (percent extra XP)
  season: Season
}

export interface Season {
  name: string
  emoji: string
  color: string
  months: number[]
}

const SEASONS: Season[] = [
  { name: 'Зима', emoji: '❄️', color: '#60a5fa', months: [11, 0, 1] },
  { name: 'Весна', emoji: '🌸', color: '#34d399', months: [2, 3, 4] },
  { name: 'Літо', emoji: '☀️', color: '#fbbf24', months: [5, 6, 7] },
  { name: 'Осінь', emoji: '🍂', color: '#f97316', months: [8, 9, 10] },
]

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

export function getCurrentSeason(): Season {
  const month = getMonth(new Date())
  return SEASONS.find((s) => s.months.includes(month)) ?? SEASONS[0]
}

export function useGamification(habitStats: HabitStat[], habits?: Habit[], bonusXP = 0): GamificationData {
  return useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const currentMonth = getMonth(new Date())
    const season = SEASONS.find((s) => s.months.includes(currentMonth)) ?? SEASONS[0]

    // Базові виконання (10 XP кожне)
    const totalCompletions = habitStats.reduce((s, h) => s + h.allLogs.filter((l) => l.value > 0).length, 0)

    // Бонуси за ставки (stakes_xp)
    const stakesBonus = habitStats.reduce((sum, h) => {
      const habit = habits?.find((hb) => hb.id === h.id)
      const stakes = habit?.stakes_xp ?? 0
      if (stakes === 0) return sum
      const todayLog = h.allLogs.find((l) => l.date === today)
      if (todayLog && todayLog.value > 0) return sum + stakes
      return sum - stakes // штраф за пропуск
    }, 0)

    const xp = Math.max(0, totalCompletions * 10 + stakesBonus + bonusXP)

    // Комбо бонус (скільки виконано поспіль сьогодні)
    const todayCompletions = habitStats.filter((h) => {
      const log = h.allLogs.find((l) => l.date === today)
      return log && log.value > 0
    }).length
    const comboBonus = todayCompletions === habitStats.length && habitStats.length > 0
      ? 100
      : todayCompletions >= 3 ? 50 : 0

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

    // Сезонні досягнення: щоб розблокувати — потрібно набрати 50+ виконань за сезон
    const seasonStart = (() => {
      const y = new Date().getFullYear()
      const monthStarts: Record<string, string> = {
        '❄️': `${y}-12-01`,
        '🌸': `${y}-03-01`,
        '☀️': `${y}-06-01`,
        '🍂': `${y}-09-01`,
      }
      return monthStarts[season.emoji] ?? `${y}-01-01`
    })()
    const seasonCompletions = habitStats.reduce((s, h) => {
      return s + h.allLogs.filter((l) => l.value > 0 && l.date >= seasonStart).length
    }, 0)

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
      // Сезонні
      {
        id: `season_${season.emoji}`,
        title: `Дух ${season.name === 'Зима' ? 'зими' : season.name === 'Весна' ? 'весни' : season.name === 'Літо' ? 'літа' : 'осені'}`,
        description: `50+ виконань цього ${season.name === 'Зима' ? 'взимку' : season.name === 'Весна' ? 'навесні' : season.name === 'Літо' ? 'влітку' : 'восени'}`,
        emoji: season.emoji,
        earned: seasonCompletions >= 50,
        progress: Math.min(100, Math.round((seasonCompletions / 50) * 100)),
        seasonal: true,
      },
      {
        id: 'combo_master',
        title: 'Майстер комбо',
        description: 'Виконай всі звички одного дня',
        emoji: '⚡',
        earned: comboBonus === 100,
        seasonal: false,
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
      comboBonus,
      season,
    }
  }, [habitStats, habits, bonusXP])
}
