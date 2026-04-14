export type HabitType = 'binary' | 'counter' | 'streak_free'
export type HabitCategory = 'general' | 'health' | 'sport' | 'learning' | 'mindfulness' | 'nutrition' | 'productivity'
export type HabitFrequency = 'daily' | 'weekly'

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
  // v2 fields
  motivation?: string
  stakes_xp?: number
  frequency?: HabitFrequency
  frequency_days?: number[] // 0=Нд, 1=Пн, 2=Вт, 3=Ср, 4=Чт, 5=Пт, 6=Сб
  // v3 fields
  identity?: string     // "Я роблю це, бо я — бігун"
  consequence?: string  // "Якщо я не роблю це — ..."
}

export interface HabitLog {
  id: string
  habit_id: string
  user_id: string
  date: string // ISO date YYYY-MM-DD
  value: number // 1/0 for binary, count for counter, 1 for streak_free check-in
  note?: string
  mood?: number // 1-5
  is_partial?: boolean // 2-хвилинне правило
  created_at: string
}

export interface FutureLetter {
  id: string
  user_id: string
  title: string
  content: string
  habit_id?: string
  target_pct: number
  unlock_date: string
  is_burned: boolean
  opened_at?: string
  created_at: string
}

export interface HabitWithStreak extends Habit {
  current_streak: number
  today_log?: HabitLog
}

export type TaskDifficulty = 'easy' | 'medium' | 'hard'

export interface Task {
  id: string
  user_id: string
  title: string
  difficulty: TaskDifficulty
  date: string // YYYY-MM-DD
  completed: boolean
  xp_reward: number
  created_at: string
}
