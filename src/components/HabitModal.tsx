import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Habit, HabitType, HabitCategory, HabitFrequency } from '@/types'

const ICONS = ['⭐', '🌅', '🚶', '🏃', '💪', '🧘', '📚', '💧', '🥗', '😴', '🚭', '🍬', '🍺', '🎯', '✍️', '🎵', '🧹', '💊', '🛁', '🌿', '🧠', '🏊', '🚴', '🎨', '🍎', '☕', '🌙', '💤', '🔥', '❤️']
const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1']

const HABIT_TYPES: { value: HabitType; label: string; desc: string }[] = [
  { value: 'binary', label: 'Бінарна', desc: 'Зробив / не зробив' },
  { value: 'counter', label: 'Лічильник', desc: 'Числовий показник (кроки, склянки води)' },
  { value: 'streak_free', label: 'Без чогось', desc: 'Стрік утримання (без цукру, нікотину)' },
]

const CATEGORIES: { value: HabitCategory; label: string; emoji: string }[] = [
  { value: 'general', label: 'Загальне', emoji: '📌' },
  { value: 'health', label: 'Здоров\'я', emoji: '❤️' },
  { value: 'sport', label: 'Спорт', emoji: '🏋️' },
  { value: 'learning', label: 'Навчання', emoji: '📚' },
  { value: 'mindfulness', label: 'Медитація', emoji: '🧘' },
  { value: 'nutrition', label: 'Харчування', emoji: '🥗' },
  { value: 'productivity', label: 'Продуктивність', emoji: '🎯' },
]

const WEEKDAYS = [
  { short: 'Пн', value: 1 },
  { short: 'Вт', value: 2 },
  { short: 'Ср', value: 3 },
  { short: 'Чт', value: 4 },
  { short: 'Пт', value: 5 },
  { short: 'Сб', value: 6 },
  { short: 'Нд', value: 0 },
]

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<Habit, 'id' | 'created_at'>) => Promise<void>
  userId: string
  initial?: Habit
}

export default function HabitModal({ open, onClose, onSave, userId, initial }: Props) {
  const [name, setName] = useState('')
  const [type, setType] = useState<HabitType>('binary')
  const [icon, setIcon] = useState('⭐')
  const [color, setColor] = useState('#8b5cf6')
  const [unit, setUnit] = useState('')
  const [targetValue, setTargetValue] = useState<string>('')
  const [reminderTime, setReminderTime] = useState('')
  const [category, setCategory] = useState<HabitCategory>('general')
  const [freezeCount, setFreezeCount] = useState(3)
  const [motivation, setMotivation] = useState('')
  const [stakesXp, setStakesXp] = useState(0)
  const [frequency, setFrequency] = useState<HabitFrequency>('daily')
  const [frequencyDays, setFrequencyDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initial) {
      setName(initial.name)
      setType(initial.type)
      setIcon(initial.icon)
      setColor(initial.color)
      setUnit(initial.unit ?? '')
      setTargetValue(initial.target_value?.toString() ?? '')
      setReminderTime(initial.reminder_time ?? '')
      setCategory(initial.category ?? 'general')
      setFreezeCount(initial.freeze_count ?? 3)
      setMotivation(initial.motivation ?? '')
      setStakesXp(initial.stakes_xp ?? 0)
      setFrequency(initial.frequency ?? 'daily')
      setFrequencyDays(initial.frequency_days ?? [0, 1, 2, 3, 4, 5, 6])
    } else {
      setName('')
      setType('binary')
      setIcon('⭐')
      setColor('#8b5cf6')
      setUnit('')
      setTargetValue('')
      setReminderTime('')
      setCategory('general')
      setFreezeCount(3)
      setMotivation('')
      setStakesXp(0)
      setFrequency('daily')
      setFrequencyDays([0, 1, 2, 3, 4, 5, 6])
    }
  }, [initial, open])

  if (!open) return null

  function toggleWeekday(day: number) {
    setFrequencyDays((prev) =>
      prev.includes(day)
        ? prev.length > 1 ? prev.filter((d) => d !== day) : prev
        : [...prev, day]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await onSave({
        user_id: userId,
        name: name.trim(),
        type,
        icon,
        color,
        unit: unit || undefined,
        target_value: targetValue ? Number(targetValue) : undefined,
        reminder_time: reminderTime || undefined,
        is_active: true,
        category,
        freeze_count: freezeCount,
        motivation: motivation.trim() || undefined,
        stakes_xp: stakesXp,
        frequency,
        frequency_days: frequency === 'weekly' ? frequencyDays : [0, 1, 2, 3, 4, 5, 6],
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {initial ? 'Редагувати звичку' : 'Нова звичка'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Icon + Name */}
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: color + '20' }}
              >
                {icon}
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Назва</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Наприклад: Підйом о 5:00"
                required
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Motivation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Навіщо це мені? <span className="text-gray-400 font-normal">(необов'язково)</span>
            </label>
            <input
              type="text"
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              placeholder="Моя причина і мотивація..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Категорія</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5',
                    category === cat.value
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  <span>{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Іконка</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={cn(
                    'w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all',
                    icon === ic ? 'ring-2 ring-violet-500 bg-violet-50 dark:bg-violet-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Колір</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-8 h-8 rounded-full transition-all',
                    color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Тип звички</label>
            <div className="space-y-2">
              {HABIT_TYPES.map(({ value, label, desc }) => (
                <label
                  key={value}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                    type === value
                      ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  )}
                >
                  <input
                    type="radio"
                    name="type"
                    value={value}
                    checked={type === value}
                    onChange={() => setType(value)}
                    className="mt-0.5 accent-violet-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Counter options */}
          {type === 'counter' && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Одиниця</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="кроки, склянки..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ціль</label>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="10000"
                  min={1}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          )}

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Частота</label>
            <div className="flex gap-2 mb-3">
              {(['daily', 'weekly'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-sm font-medium transition-all',
                    frequency === f
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {f === 'daily' ? 'Щодня' : 'Вибрані дні'}
                </button>
              ))}
            </div>
            {frequency === 'weekly' && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Оберіть дні тижня:</p>
                <div className="flex gap-2">
                  {WEEKDAYS.map(({ short, value }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleWeekday(value)}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-xs font-medium transition-all',
                        frequencyDays.includes(value)
                          ? 'bg-violet-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      )}
                    >
                      {short}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reminder + Streak freeze + Stakes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Нагадування
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                🧊 Заморозок стріку
              </label>
              <select
                value={freezeCount}
                onChange={(e) => setFreezeCount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {[0, 1, 2, 3, 5, 7].map((n) => (
                  <option key={n} value={n}>{n} {n === 0 ? '(вимк.)' : n === 1 ? 'раз' : 'рази'}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stakes XP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ⚡ Ставка XP <span className="text-gray-400 font-normal">(бонус за виконання, штраф за пропуск)</span>
            </label>
            <select
              value={stakesXp}
              onChange={(e) => setStakesXp(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value={0}>Без ставки</option>
              <option value={5}>±5 XP (низька)</option>
              <option value={10}>±10 XP (середня)</option>
              <option value={25}>±25 XP (висока)</option>
              <option value={50}>±50 XP (ризикована)</option>
            </select>
            {stakesXp > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Виконав → +{stakesXp} бонусних XP. Пропустив → -{stakesXp} XP.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {saving ? 'Збереження...' : initial ? 'Зберегти' : 'Додати'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
