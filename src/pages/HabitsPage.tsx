import { useState } from 'react'
import { Plus, Pencil, Trash2, ListChecks, GripVertical } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useHabits } from '@/hooks/useHabits'
import { useAuth } from '@/context/AuthContext'
import HabitModal from '@/components/HabitModal'
import { updateHabit } from '@/lib/supabase'
import type { Habit, HabitCategory } from '@/types'

const TYPE_LABELS = {
  binary: 'Бінарна',
  counter: 'Лічильник',
  streak_free: 'Без чогось',
}

const CATEGORY_LABELS: Record<HabitCategory, { label: string; emoji: string }> = {
  general: { label: 'Загальне', emoji: '📌' },
  health: { label: 'Здоров\'я', emoji: '❤️' },
  sport: { label: 'Спорт', emoji: '🏋️' },
  learning: { label: 'Навчання', emoji: '📚' },
  mindfulness: { label: 'Медитація', emoji: '🧘' },
  nutrition: { label: 'Харчування', emoji: '🥗' },
  productivity: { label: 'Продуктивність', emoji: '🎯' },
}

function SortableHabitRow({
  habit,
  onEdit,
  onDelete,
  deleting,
}: {
  habit: Habit
  onEdit: (h: Habit) => void
  onDelete: (id: string) => void
  deleting: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: habit.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-gray-300 dark:text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ backgroundColor: habit.color + '20' }}
      >
        {habit.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{habit.name}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: habit.color + '20', color: habit.color }}
          >
            {TYPE_LABELS[habit.type]}
          </span>
          {habit.category && habit.category !== 'general' && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {CATEGORY_LABELS[habit.category]?.emoji} {CATEGORY_LABELS[habit.category]?.label}
            </span>
          )}
          {habit.type === 'counter' && habit.target_value && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Ціль: {habit.target_value} {habit.unit}
            </span>
          )}
          {habit.reminder_time && (
            <span className="text-xs text-gray-400 dark:text-gray-500">🔔 {habit.reminder_time.slice(0, 5)}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onEdit(habit)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(habit.id)}
          disabled={deleting}
          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-gray-400 hover:text-red-500 disabled:opacity-40"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function HabitsPage() {
  const { user } = useAuth()
  const { habits, loading, addHabit, editHabit, removeHabit, setHabits } = useHabits()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Habit | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<HabitCategory | 'all'>('all')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const allCategories = Array.from(new Set(habits.map((h) => h.category ?? 'general'))) as HabitCategory[]
  const filteredHabits = activeCategory === 'all' ? habits : habits.filter((h) => (h.category ?? 'general') === activeCategory)

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = habits.findIndex((h) => h.id === active.id)
    const newIndex = habits.findIndex((h) => h.id === over.id)
    const newHabits = arrayMove(habits, oldIndex, newIndex)
    setHabits(newHabits)

    // Persist sort order
    await Promise.all(
      newHabits.map((h, i) => updateHabit(h.id, { sort_order: i }))
    )
  }

  async function handleSave(data: Omit<Habit, 'id' | 'created_at'>) {
    if (editing) {
      await editHabit(editing.id, data)
    } else {
      await addHabit({ ...data, sort_order: habits.length })
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

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Мої звички</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{habits.length} звичок відстежується</p>
        </div>
        <button
          onClick={() => { setEditing(undefined); setModalOpen(true) }}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Додати</span>
        </button>
      </div>

      {/* Category filter */}
      {habits.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeCategory === 'all'
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Всі ({habits.length})
          </button>
          {allCategories.map((cat) => {
            const count = habits.filter((h) => (h.category ?? 'general') === cat).length
            const info = CATEGORY_LABELS[cat]
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1 ${
                  activeCategory === cat
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {info?.emoji} {info?.label} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-violet-50 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ListChecks className="w-8 h-8 text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Ще немає звичок</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Додай першу звичку щоб почати відстежувати прогрес</p>
          <button
            onClick={() => { setEditing(undefined); setModalOpen(true) }}
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Додати звичку
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredHabits.map((h) => h.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {filteredHabits.map((habit) => (
                <SortableHabitRow
                  key={habit.id}
                  habit={habit}
                  onEdit={(h) => { setEditing(h); setModalOpen(true) }}
                  onDelete={handleDelete}
                  deleting={deletingId === habit.id}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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
