import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Habit, HabitType } from '@/types'

const ICONS = ['⭐', '🌅', '🚶', '🏃', '💪', '🧘', '📚', '💧', '🥗', '😴', '🚭', '🍬', '🍺', '🎯', '✍️', '🎵', '🧹', '💊', '🛁', '🌿']
const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1']

const HABIT_TYPES: { value: HabitType; label: string; desc: string }[] = [
  { value: 'binary', label: 'Бінарна', desc: 'Зробив / не зробив' },
  { value: 'counter', label: 'Лічильник', desc: 'Числовий показник (кроки, склянки води)' },
  { value: 'streak_free', label: 'Без чогось', desc: 'Стрік утримання (без цукру, нікотину)' },
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
    } else {
      setName('')
      setType('binary')
      setIcon('⭐')
      setColor('#8b5cf6')
      setUnit('')
      setTargetValue('')
      setReminderTime('')
    }
  }, [initial, open])

  if (!open) return null

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
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900">
            {initial ? 'Редагувати звичку' : 'Нова звичка'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Назва</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Наприклад: Підйом о 5:00"
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Іконка</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={cn(
                    'w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all',
                    icon === ic ? 'ring-2 ring-violet-500 bg-violet-50' : 'hover:bg-gray-100'
                  )}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Колір</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Тип звички</label>
            <div className="space-y-2">
              {HABIT_TYPES.map(({ value, label, desc }) => (
                <label
                  key={value}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                    type === value
                      ? 'border-violet-400 bg-violet-50'
                      : 'border-gray-200 hover:border-gray-300'
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
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Counter options */}
          {type === 'counter' && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Одиниця</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="кроки, склянки..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ціль</label>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="10000"
                  min={1}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
          )}

          {/* Reminder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Нагадування <span className="text-gray-400 font-normal">(необов'язково)</span>
            </label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
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
