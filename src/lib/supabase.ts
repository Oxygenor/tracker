import { createClient } from '@supabase/supabase-js'
import type { Habit, HabitLog, FutureLetter } from '@/types'

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
    .order('sort_order', { ascending: true })
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

export async function fetchAllLogsForHabit(habitId: string, userId: string): Promise<{ date: string; value: number }[]> {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('date, value')
    .eq('habit_id', habitId)
    .eq('user_id', userId)
    .order('date', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function calculateAllTimeStreak(habitId: string, userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('date, value')
    .eq('habit_id', habitId)
    .eq('user_id', userId)
    .gt('value', 0)
    .order('date', { ascending: false })

  if (error) throw error
  if (!data || data.length === 0) return 0

  const dates = data.map((l) => l.date).sort().reverse()
  let maxStreak = 1
  let currentStreak = 1

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1])
    const curr = new Date(dates[i])
    const diff = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 1) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 1
    }
  }
  return maxStreak
}

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

// ── Bad Days ────────────────────────────────────────────────

export async function fetchBadDays(userId: string, from: string, to: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('bad_days')
    .select('date')
    .eq('user_id', userId)
    .gte('date', from)
    .lte('date', to)

  if (error) throw error
  return (data ?? []).map((r) => r.date as string)
}

export async function markBadDay(userId: string, date: string): Promise<void> {
  const { error } = await supabase
    .from('bad_days')
    .upsert({ user_id: userId, date }, { onConflict: 'user_id,date' })

  if (error) throw error
}

export async function removeBadDay(userId: string, date: string): Promise<void> {
  const { error } = await supabase
    .from('bad_days')
    .delete()
    .eq('user_id', userId)
    .eq('date', date)

  if (error) throw error
}

// ── Future Letters ──────────────────────────────────────────

export async function fetchLetters(userId: string): Promise<FutureLetter[]> {
  const { data, error } = await supabase
    .from('future_letters')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createLetter(
  letter: Omit<FutureLetter, 'id' | 'created_at' | 'opened_at' | 'is_burned'>
): Promise<FutureLetter> {
  const { data, error } = await supabase
    .from('future_letters')
    .insert({ ...letter, is_burned: false })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function openLetter(id: string): Promise<void> {
  const { error } = await supabase
    .from('future_letters')
    .update({ opened_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function burnLetter(id: string): Promise<void> {
  const { error } = await supabase
    .from('future_letters')
    .update({ is_burned: true })
    .eq('id', id)

  if (error) throw error
}

export async function deleteLetter(id: string): Promise<void> {
  const { error } = await supabase
    .from('future_letters')
    .delete()
    .eq('id', id)

  if (error) throw error
}
