import { useState } from 'react'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import { Check, Plus, Flame, Trophy } from 'lucide-react'
import { useHabits } from '@/hooks/useHabits'
import { useHabitLogs } from '@/hooks/useHabitLogs'
import { useAuth } from '@/context/AuthContext'
import { calculateStreak } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import type { Habit } from '@/types'

function CounterInput({
  habit,
  value,
  onChange,
}: {
  habit: Habit
  value: number
  onChange: (v: number) => void
}) {
  const [input, setInput] = useState(value > 0 ? String(value) : '')
  const ref = useRef(false)

  useEffect(() => {
    if (!ref.current) { ref.current = true; return }
    const num = Number(input)
    if (!isNaN(num)) onChange(num)
  }, [input]) // eslint-disable-line

  const pct = habit.target_value ? Math.min(100, (value / habit.target_value) * 100) : 0

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={input}
          min={0}
          onChange={(e) => setInput(e.target.value)}
          onBlur={() => { const n = Number(input); if (!isNaN(n)) onChange(n) }}
          className="w-20 text-right px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          placeholder="0"
        />
        {habit.unit && <span className="text-xs text-gray-400">{habit.unit}</span>}
      </div>
      {habit.target_value && (
        <div className="w-24">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: habit.color }}
            />
          </div>
          <p className="text-xs text-gray-400 text-right mt-0.5">
            {value}/{habit.target_value}
          </p>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const today = format(new Date(), 'yyyy-MM-dd')
  const { habits, loading: habitsLoading } = useHabits()
  const { getLog, toggle, setValue, loading: logsLoading } = useHabitLogs(today)
  const [streaks, setStreaks] = useState<Record<string, number>>({})

  const loading = habitsLoading || logsLoading

  // Load streaks
  useEffect(() => {
    if (!user || habits.length === 0) return
    Promise.all(
      habits.map(async (h) => {
        const s = await calculateStreak(h.id, user.id, today)
        return [h.id, s] as [string, number]
      })
    ).then((entries) => setStreaks(Object.fromEntries(entries)))
  }, [habits, user, today])

  const completed = habits.filter((h) => {
    const log = getLog(h.id)
    return log && log.value > 0
  }).length
  const total = habits.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  const dateLabel = format(new Date(), 'EEEE, d MMMM', { locale: uk })

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 capitalize">{dateLabel}</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-0.5">
          Привіт, {user?.user_metadata?.full_name?.split(' ')[0] ?? 'друже'} 👋
        </h1>
      </div>

      {/* Progress card */}
      {total > 0 && (
        <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-5 mb-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-violet-200 text-sm">Виконано сьогодні</p>
              <p className="text-3xl font-bold mt-0.5">
                {completed}
                <span className="text-xl font-normal text-violet-200">/{total}</span>
              </p>
            </div>
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
                <circle
                  cx="32" cy="32" r="26"
                  fill="none"
                  stroke="white"
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - pct / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                {pct}%
              </span>
            </div>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          {pct === 100 && (
            <div className="flex items-center gap-2 mt-3">
              <Trophy className="w-4 h-4 text-yellow-300" />
              <p className="text-sm text-yellow-100 font-medium">Всі звички виконано! Чудова робота!</p>
            </div>
          )}
        </div>
      )}

      {/* Habits list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Flame className="w-8 h-8 text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Почни свій шлях</h3>
          <p className="text-gray-500 text-sm mb-6">Додай першу звичку і відстежуй прогрес щодня</p>
          <button
            onClick={() => navigate('/habits')}
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Додати звичку
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => {
            const log = getLog(habit.id)
            const done = Boolean(log && log.value > 0)
            const streak = streaks[habit.id] ?? 0

            return (
              <div
                key={habit.id}
                className={cn(
                  'bg-white border rounded-2xl p-4 flex items-center gap-4 shadow-sm transition-all',
                  done ? 'border-green-200 bg-green-50/30' : 'border-gray-100 hover:shadow-md'
                )}
              >
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: habit.color + '20' }}
                >
                  {habit.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={cn('font-semibold truncate', done ? 'text-gray-500 line-through' : 'text-gray-900')}>
                    {habit.name}
                  </p>
                  {streak > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-xs text-orange-500 font-medium">{streak} {streak === 1 ? 'день' : streak < 5 ? 'дні' : 'днів'}</span>
                    </div>
                  )}
                </div>

                {/* Control */}
                <div className="flex-shrink-0">
                  {habit.type === 'counter' ? (
                    <CounterInput
                      habit={habit}
                      value={log?.value ?? 0}
                      onChange={(v) => setValue(habit.id, v)}
                    />
                  ) : (
                    <button
                      onClick={() => toggle(habit.id, log?.value ?? 0)}
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                        done
                          ? 'bg-green-500 text-white shadow-sm'
                          : 'border-2 border-gray-200 hover:border-violet-400 text-transparent hover:text-violet-300'
                      )}
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
