export type HabitType = 'binary' | 'counter' | 'streak_free'
export type HabitCategory = 'general' | 'health' | 'sport' | 'learning' | 'mindfulness' | 'nutrition' | 'productivity'

export interface Habit {
  id: string
  user_id: string
  name: string
  type: HabitType
  icon: string
  color: string
  unit?: string
  target_value?: number
  reminder_time?: string
  is_active: boolean
  created_at: string
  category?: HabitCategory
  sort_order?: number
  freeze_count?: number
}

export interface HabitLog {
  id: string
  habit_id: string
  user_id: string
  date: string // ISO date YYYY-MM-DD
  value: number // 1/0 for binary, count for counter, 1 for streak_free check-in
  note?: string
  created_at: string
}

export interface HabitWithStreak extends Habit {
  current_streak: number
  today_log?: HabitLog
}
