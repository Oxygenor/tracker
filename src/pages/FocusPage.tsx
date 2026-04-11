import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, Coffee, Brain, Check } from 'lucide-react'
import { useHabits } from '@/hooks/useHabits'
import { useHabitLogs } from '@/hooks/useHabitLogs'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Habit } from '@/types'

type TimerMode = 'work' | 'break' | 'long_break'
type TimerState = 'idle' | 'running' | 'paused' | 'done'

const MODE_CONFIG: Record<TimerMode, { label: string; minutes: number; color: string; emoji: string }> = {
  work: { label: 'Фокус', minutes: 25, color: '#8b5cf6', emoji: '🧠' },
  break: { label: 'Пауза', minutes: 5, color: '#10b981', emoji: '☕' },
  long_break: { label: 'Довга пауза', minutes: 15, color: '#3b82f6', emoji: '🌿' },
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function FocusPage() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const { habits } = useHabits()
  const { getLog, toggle } = useHabitLogs(today)

  const [mode, setMode] = useState<TimerMode>('work')
  const [state, setState] = useState<TimerState>('idle')
  const [secondsLeft, setSecondsLeft] = useState(MODE_CONFIG.work.minutes * 60)
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null)
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0)
  const [justCompleted, setJustCompleted] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startSecondsRef = useRef(MODE_CONFIG.work.minutes * 60)

  const totalSeconds = MODE_CONFIG[mode].minutes * 60
  const pct = ((totalSeconds - secondsLeft) / totalSeconds) * 100
  const config = MODE_CONFIG[mode]

  const activeHabits = habits.filter((h) => {
    const log = getLog(h.id)
    return !(log && log.value > 0)
  })

  const selectedHabit = habits.find((h) => h.id === selectedHabitId)

  function switchMode(newMode: TimerMode) {
    stopTimer()
    setMode(newMode)
    const secs = MODE_CONFIG[newMode].minutes * 60
    setSecondsLeft(secs)
    startSecondsRef.current = secs
    setState('idle')
    setJustCompleted(false)
  }

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  function startTimer() {
    setState('running')
    setJustCompleted(false)
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          stopTimer()
          setState('done')
          setJustCompleted(true)
          if (mode === 'work') {
            setCompletedPomodoros((p) => p + 1)
            setTotalFocusMinutes((m) => m + MODE_CONFIG.work.minutes)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function pauseTimer() {
    stopTimer()
    setState('paused')
  }

  function resetTimer() {
    stopTimer()
    const secs = MODE_CONFIG[mode].minutes * 60
    setSecondsLeft(secs)
    setState('idle')
    setJustCompleted(false)
  }

  async function markHabitDone() {
    if (!selectedHabitId) return
    const log = getLog(selectedHabitId)
    if (!log || log.value === 0) {
      await toggle(selectedHabitId, 0)
    }
  }

  useEffect(() => {
    return () => stopTimer()
  }, [stopTimer])

  // Оновлення title браузера
  useEffect(() => {
    if (state === 'running') {
      document.title = `${formatTime(secondsLeft)} — ${config.label} | HabitFlow`
    } else {
      document.title = 'HabitFlow'
    }
    return () => { document.title = 'HabitFlow' }
  }, [secondsLeft, state, config.label])

  const circumference = 2 * Math.PI * 110
  const strokeDashoffset = circumference * (1 - pct / 100)

  return (
    <div className="p-4 sm:p-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Режим фокусу</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Pomodoro техніка для глибокої роботи</p>
      </div>

      {/* Статистика сесії */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{completedPomodoros}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Помодоро сьогодні</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalFocusMinutes}хв</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Часу у фокусі</p>
        </div>
      </div>

      {/* Вибір режиму */}
      <div className="flex gap-2 mb-6">
        {(Object.entries(MODE_CONFIG) as [TimerMode, typeof MODE_CONFIG.work][]).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={cn(
              'flex-1 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1',
              mode === key
                ? 'text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            )}
            style={mode === key ? { backgroundColor: cfg.color } : undefined}
          >
            <span>{cfg.emoji}</span>
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Таймер */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-64 h-64">
          <svg className="w-64 h-64 -rotate-90" viewBox="0 0 240 240">
            {/* Track */}
            <circle
              cx="120" cy="120" r="110"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-100 dark:text-gray-700"
            />
            {/* Progress */}
            <circle
              cx="120" cy="120" r="110"
              fill="none"
              stroke={config.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl mb-1">{config.emoji}</span>
            <span className="text-5xl font-bold text-gray-900 dark:text-gray-100 font-mono">
              {formatTime(secondsLeft)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">{config.label}</span>
          </div>
        </div>

        {/* Кнопки управління */}
        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={resetTimer}
            className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-2xl transition-colors"
          >
            <RotateCcw className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>

          <button
            onClick={state === 'running' ? pauseTimer : startTimer}
            disabled={state === 'done' && !justCompleted}
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all active:scale-95"
            style={{ backgroundColor: config.color }}
          >
            {state === 'running' ? (
              <Pause className="w-7 h-7" />
            ) : (
              <Play className="w-7 h-7 ml-0.5" />
            )}
          </button>

          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  i < completedPomodoros % 4 ? 'bg-violet-500' : 'bg-gray-300 dark:bg-gray-600'
                )}
              />
            ))}
          </div>
        </div>

        {/* Сповіщення про завершення */}
        {justCompleted && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl text-center">
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
              {mode === 'work' ? '🎉 Фокус-сесія завершена! Час відпочити.' : '✅ Пауза закінчилась! Готовий до нового фокусу?'}
            </p>
            {mode === 'work' && completedPomodoros % 4 === 0 && completedPomodoros > 0 && (
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">Чудово! Час для довгої паузи (15 хв)</p>
            )}
          </div>
        )}
      </div>

      {/* Прив'язка до звички */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
          <Brain className="w-4 h-4 text-violet-500" />
          На якій звичці фокусуєшся?
        </h2>

        {activeHabits.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-3">Всі звички виконані! 🎉</p>
        ) : (
          <div className="space-y-2">
            {activeHabits.slice(0, 5).map((habit: Habit) => (
              <button
                key={habit.id}
                onClick={() => setSelectedHabitId(habit.id === selectedHabitId ? null : habit.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left',
                  selectedHabitId === habit.id
                    ? 'ring-2 ring-violet-400'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
                style={selectedHabitId === habit.id ? { backgroundColor: habit.color + '15' } : undefined}
              >
                <span className="text-xl">{habit.icon}</span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1">{habit.name}</span>
                {selectedHabitId === habit.id && (
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: habit.color }} />
                )}
              </button>
            ))}
          </div>
        )}

        {selectedHabit && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Фокусуєшся на: <span className="font-medium text-gray-700 dark:text-gray-300">{selectedHabit.name}</span>
            </p>
            {!getLog(selectedHabit.id)?.value ? (
              <button
                onClick={markHabitDone}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <Check className="w-4 h-4" />
                Відмітити як виконано
              </button>
            ) : (
              <p className="text-center text-sm text-green-600 dark:text-green-400 font-medium">✓ Виконано!</p>
            )}
          </div>
        )}
      </div>

      {/* Підказки */}
      <div className="mt-4 space-y-2">
        <div className="flex items-start gap-2 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
          <Brain className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-violet-700 dark:text-violet-300">
            <strong>25 хв фокус</strong> → прибери всі відволікання, відкрий лише потрібне
          </p>
        </div>
        <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
          <Coffee className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-green-700 dark:text-green-300">
            <strong>5 хв пауза</strong> → встань, потягнись, вип'єш води
          </p>
        </div>
      </div>
    </div>
  )
}
