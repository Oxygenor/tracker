import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { fetchLogsForRange, calculateStreak, calculateAllTimeStreak, fetchAllLogsForHabit } from '@/lib/supabase'
import { useHabits } from '@/hooks/useHabits'
import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns'
import { uk } from 'date-fns/locale'
import type { HabitLog } from '@/types'

export interface DayPoint {
  date: string
  label: string
  completed: number
  total: number
  pct: number
}

export interface HabitStat {
  id: string
  name: string
  icon: string
  color: string
  streak: number
  allTimeStreak: number
  completionRate: number // 0-100
  totalDone: number
  data: { date: string; label: string; value: number }[]
  allLogs: { date: string; value: number }[]
}

export function useStatsData(period: 7 | 30) {
  const { user } = useAuth()
  const { habits } = useHabits()
  const [days, setDays] = useState<DayPoint[]>([])
  const [habitStats, setHabitStats] = useState<HabitStat[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user || habits.length === 0) { setLoading(false); return }
    setLoading(true)

    const today = new Date()
    const from = format(subDays(today, period - 1), 'yyyy-MM-dd')
    const to = format(today, 'yyyy-MM-dd')

    const logs: HabitLog[] = await fetchLogsForRange(user.id, from, to)
    const logMap = new Map<string, HabitLog>()
    logs.forEach((l) => logMap.set(`${l.habit_id}_${l.date}`, l))

    const interval = eachDayOfInterval({ start: parseISO(from), end: today })

    // Overall completion per day
    const dayPoints: DayPoint[] = interval.map((d) => {
      const dateStr = format(d, 'yyyy-MM-dd')
      const label = format(d, period === 7 ? 'EEE' : 'd MMM', { locale: uk })
      const completed = habits.filter((h) => {
        const log = logMap.get(`${h.id}_${dateStr}`)
        return log && log.value > 0
      }).length
      const total = habits.length
      return { date: dateStr, label, completed, total, pct: total > 0 ? Math.round((completed / total) * 100) : 0 }
    })
    setDays(dayPoints)

    // Per-habit stats
    const stats: HabitStat[] = await Promise.all(
      habits.map(async (h) => {
        const [streak, allTimeStreak, allLogs] = await Promise.all([
          calculateStreak(h.id, user.id, to),
          calculateAllTimeStreak(h.id, user.id),
          fetchAllLogsForHabit(h.id, user.id),
        ])
        const data = interval.map((d) => {
          const dateStr = format(d, 'yyyy-MM-dd')
          const label = format(d, period === 7 ? 'EEE' : 'd', { locale: uk })
          const log = logMap.get(`${h.id}_${dateStr}`)
          return { date: dateStr, label, value: log?.value ?? 0 }
        })
        const totalDone = data.filter((d) => d.value > 0).length
        return {
          id: h.id,
          name: h.name,
          icon: h.icon,
          color: h.color,
          streak,
          allTimeStreak,
          completionRate: Math.round((totalDone / period) * 100),
          totalDone,
          allLogs,
          data,
        }
      })
    )
    setHabitStats(stats)
    setLoading(false)
  }, [user, habits, period])

  useEffect(() => { load() }, [load])

  return { days, habitStats, loading }
}
