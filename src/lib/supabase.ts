import { createClient } from '@supabase/supabase-js'
import type { Habit, HabitLog } from '@/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,
    flowType: 'implicit',
  },
})

// ── Habits ──────────────────────────────────────────────────

export async function fetchHabits(userId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createHabit(
  habit: Omit<Habit, 'id' | 'created_at'>
): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .insert(habit)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateHabit(
  id: string,
  updates: Partial<Omit<Habit, 'id' | 'user_id' | 'created_at'>>
): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}

export async function deleteHabit(id: string): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw error
}

// ── Habit Logs ──────────────────────────────────────────────

export async function fetchLogsForDate(
  userId: string,
  date: string
): Promise<HabitLog[]> {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)

  if (error) throw error
  return data ?? []
}

export async function fetchLogsForRange(
  userId: string,
  from: string,
  to: string
): Promise<HabitLog[]> {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function upsertLog(
  log: Omit<HabitLog, 'id' | 'created_at'>
): Promise<HabitLog> {
  const { data, error } = await supabase
    .from('habit_logs')
    .upsert(log, { onConflict: 'habit_id,date' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteLog(habitId: string, date: string): Promise<void> {
  const { error } = await supabase
    .from('habit_logs')
    .delete()
    .eq('habit_id', habitId)
    .eq('date', date)

  if (error) throw error
}

// ── Streak calculation ──────────────────────────────────────

export async function calculateStreak(
  habitId: string,
  userId: string,
  today: string
): Promise<number> {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('date, value')
    .eq('habit_id', habitId)
    .eq('user_id', userId)
    .gt('value', 0)
    .order('date', { ascending: false })

  if (error) throw error
  if (!data || data.length === 0) return 0

  const dates = new Set(data.map((l) => l.date))
  let streak = 0
  const cursor = new Date(today)

  while (true) {
    const dateStr = cursor.toISOString().split('T')[0]
    if (dates.has(dateStr)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}
