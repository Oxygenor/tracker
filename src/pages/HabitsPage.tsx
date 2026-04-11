import { useState } from 'react'
import { Plus, Pencil, Trash2, ListChecks } from 'lucide-react'
import { useHabits } from '@/hooks/useHabits'
import { useAuth } from '@/context/AuthContext'
import HabitModal from '@/components/HabitModal'
import type { Habit } from '@/types'

const TYPE_LABELS = {
  binary: 'Бінарна',
  counter: 'Лічильник',
  streak_free: 'Без чогось',
}

export default function HabitsPage() {
  const { user } = useAuth()
  const { habits, loading, addHabit, editHabit, removeHabit } = useHabits()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Habit | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleSave(data: Omit<Habit, 'id' | 'created_at'>) {
    if (editing) {
      await editHabit(editing.id, data)
    } else {
      await addHabit(data)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await removeHabit(id)
    } finally {
      setDeletingId(null)
    }
  }

  function openAdd() {
    setEditing(undefined)
    setModalOpen(true)
  }

  function openEdit(habit: Habit) {
    setEditing(habit)
    setModalOpen(true)
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Мої звички</h1>
          <p className="text-sm text-gray-500 mt-0.5">{habits.length} звичок відстежується</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Додати</span>
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ListChecks className="w-8 h-8 text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Ще немає звичок</h3>
          <p className="text-gray-500 text-sm mb-6">Додай першу звичку щоб почати відстежувати прогрес</p>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Додати звичку
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
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
                <p className="font-semibold text-gray-900 truncate">{habit.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: habit.color + '20', color: habit.color }}
                  >
                    {TYPE_LABELS[habit.type]}
                  </span>
                  {habit.type === 'counter' && habit.target_value && (
                    <span className="text-xs text-gray-400">
                      Ціль: {habit.target_value} {habit.unit}
                    </span>
                  )}
                  {habit.reminder_time && (
                    <span className="text-xs text-gray-400">🔔 {habit.reminder_time.slice(0, 5)}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => openEdit(habit)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(habit.id)}
                  disabled={deletingId === habit.id}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-500 disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <HabitModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        userId={user!.id}
        initial={editing}
      />
    </div>
  )
}
