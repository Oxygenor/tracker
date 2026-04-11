import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  fetchHabits,
  createHabit,
  updateHabit,
  deleteHabit,
} from '@/lib/supabase'
import type { Habit } from '@/types'

export function useHabits() {
  const { user } = useAuth()
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const data = await fetchHabits(user.id)
      setHabits(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка завантаження')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { load() }, [load])

  async function addHabit(habit: Omit<Habit, 'id' | 'created_at'>) {
    const created = await createHabit(habit)
    setHabits((prev) => [...prev, created])
    return created
  }

  async function editHabit(id: string, updates: Partial<Omit<Habit, 'id' | 'user_id' | 'created_at'>>) {
    await updateHabit(id, updates)
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...updates } : h)))
  }

  async function removeHabit(id: string) {
    await deleteHabit(id)
    setHabits((prev) => prev.filter((h) => h.id !== id))
  }

  return { habits, loading, error, reload: load, addHabit, editHabit, removeHabit, setHabits }
}
