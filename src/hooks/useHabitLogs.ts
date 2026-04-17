import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { fetchLogsForDate, upsertLog, deleteLog } from '@/lib/supabase'
import type { HabitLog } from '@/types'
import { format } from 'date-fns'

export function useHabitLogs(date?: string) {
  const { user } = useAuth()
  const today = date ?? format(new Date(), 'yyyy-MM-dd')
  const [logs, setLogs] = useState<HabitLog[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const data = await fetchLogsForDate(user.id, today)
      setLogs(data)
    } finally {
      setLoading(false)
    }
  }, [user, today])

  useEffect(() => { load() }, [load])

  function getLog(habitId: string) {
    return logs.find((l) => l.habit_id === habitId)
  }

  async function toggle(habitId: string, currentValue: number) {
    if (!user) return
    if (currentValue > 0) {
      await deleteLog(habitId, today)
      setLogs((prev) => prev.filter((l) => l.habit_id !== habitId))
    } else {
      const log = await upsertLog({
        habit_id: habitId,
        user_id: user.id,
        date: today,
        value: 1,
        is_partial: false,
      })
      setLogs((prev) => [...prev.filter((l) => l.habit_id !== habitId), log])
    }
  }

  async function setPartial(habitId: string) {
    if (!user) return
    const existing = getLog(habitId)
    // Якщо вже повне — не змінюємо
    if (existing && !existing.is_partial) return
    const log = await upsertLog({
      habit_id: habitId,
      user_id: user.id,
      date: today,
      value: 1,
      is_partial: true,
      note: existing?.note,
      mood: existing?.mood,
    })
    setLogs((prev) => [...prev.filter((l) => l.habit_id !== habitId), log])
  }

  async function setValue(habitId: string, value: number) {
    if (!user) return
    if (value <= 0) {
      await deleteLog(habitId, today)
      setLogs((prev) => prev.filter((l) => l.habit_id !== habitId))
    } else {
      const existing = getLog(habitId)
      const log = await upsertLog({
        habit_id: habitId,
        user_id: user.id,
        date: today,
        value,
        note: existing?.note,
        mood: existing?.mood,
      })
      setLogs((prev) => [...prev.filter((l) => l.habit_id !== habitId), log])
    }
  }

  async function setNote(habitId: string, note: string) {
    if (!user) return
    const existing = getLog(habitId)
    if (!existing) return
    const log = await upsertLog({
      habit_id: habitId,
      user_id: user.id,
      date: today,
      value: existing.value,
      note: note || undefined,
      mood: existing.mood,
    })
    setLogs((prev) => [...prev.filter((l) => l.habit_id !== habitId), log])
  }

  async function setMood(habitId: string, mood: number) {
    if (!user) return
    const existing = getLog(habitId)
    if (!existing) return
    const log = await upsertLog({
      habit_id: habitId,
      user_id: user.id,
      date: today,
      value: existing.value,
      note: existing.note,
      mood,
    })
    setLogs((prev) => [...prev.filter((l) => l.habit_id !== habitId), log])
  }

  return { logs, loading, getLog, toggle, setValue, setNote, setMood, setPartial }
}
