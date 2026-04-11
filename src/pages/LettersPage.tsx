import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  fetchLetters,
  createLetter,
  openLetter,
  burnLetter,
  deleteLetter,
  fetchHabits,
  supabase,
} from '@/lib/supabase'
import type { FutureLetter, Habit } from '@/types'
import { format, parseISO, isPast, differenceInDays } from 'date-fns'
import { uk } from 'date-fns/locale'
import { Mail, Lock, Flame, Trash2, Eye, X } from 'lucide-react'

type TabType = 'inbox' | 'write'

function getHabitCompletion(habitId: string | undefined, logs: { habit_id: string; value: number }[]): number {
  if (!habitId) return 0
  const habitLogs = logs.filter((l) => l.habit_id === habitId)
  if (habitLogs.length === 0) return 0
  const done = habitLogs.filter((l) => l.value > 0).length
  return Math.round((done / habitLogs.length) * 100)
}

function isLetterUnlocked(letter: FutureLetter, habitCompletion: number): boolean {
  const dateUnlocked = isPast(parseISO(letter.unlock_date))
  const pctUnlocked = habitCompletion >= letter.target_pct
  return dateUnlocked || pctUnlocked
}

export default function LettersPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<TabType>('inbox')
  const [letters, setLetters] = useState<FutureLetter[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [logs, setLogs] = useState<{ habit_id: string; value: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [openedLetter, setOpenedLetter] = useState<FutureLetter | null>(null)
  const [burning, setBurning] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [habitId, setHabitId] = useState('')
  const [targetPct, setTargetPct] = useState(80)
  const [unlockDate, setUnlockDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 3)
    return format(d, 'yyyy-MM-dd')
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    async function load() {
      setLoading(true)
      try {
        const [fetchedLetters, fetchedHabits] = await Promise.all([
          fetchLetters(user!.id),
          fetchHabits(user!.id),
        ])
        setLetters(fetchedLetters)
        setHabits(fetchedHabits)

        // Fetch last 90 days of logs for habit completion calc
        const to = format(new Date(), 'yyyy-MM-dd')
        const from = format(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
        const { data } = await supabase
          .from('habit_logs')
          .select('habit_id, value')
          .eq('user_id', user!.id)
          .gte('date', from)
          .lte('date', to)
        setLogs(data ?? [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  async function handleCreate() {
    if (!user || !title.trim() || !content.trim()) return
    setSaving(true)
    try {
      const letter = await createLetter({
        user_id: user.id,
        title: title.trim(),
        content: content.trim(),
        habit_id: habitId || undefined,
        target_pct: targetPct,
        unlock_date: unlockDate,
      })
      setLetters((prev) => [letter, ...prev])
      setTitle('')
      setContent('')
      setHabitId('')
      setTargetPct(80)
      setTab('inbox')
    } finally {
      setSaving(false)
    }
  }

  async function handleOpen(letter: FutureLetter) {
    const completion = getHabitCompletion(letter.habit_id, logs)
    if (!isLetterUnlocked(letter, completion)) return
    if (!letter.opened_at) {
      await openLetter(letter.id)
      setLetters((prev) => prev.map((l) => l.id === letter.id ? { ...l, opened_at: new Date().toISOString() } : l))
    }
    setOpenedLetter({ ...letter, opened_at: letter.opened_at ?? new Date().toISOString() })
  }

  async function handleBurn(id: string) {
    setBurning(id)
    await new Promise((r) => setTimeout(r, 1200))
    await burnLetter(id)
    setLetters((prev) => prev.map((l) => l.id === id ? { ...l, is_burned: true } : l))
    setBurning(null)
    setOpenedLetter(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Видалити лист?')) return
    await deleteLetter(id)
    setLetters((prev) => prev.filter((l) => l.id !== id))
    setOpenedLetter(null)
  }

  const activeLettres = letters.filter((l) => !l.is_burned)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Mail className="w-6 h-6 text-violet-500" />
          Листи майбутньому собі
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Напиши лист, який відкриється коли ти досягнеш мети або в певну дату.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'inbox', label: `Скринька (${activeLettres.length})` },
          { id: 'write', label: '+ Написати' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id as TabType)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === id
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Inbox */}
      {tab === 'inbox' && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center text-gray-400 py-12">Завантаження...</div>
          ) : activeLettres.length === 0 ? (
            <div className="text-center py-16">
              <Mail className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Скринька порожня</p>
              <button
                onClick={() => setTab('write')}
                className="mt-3 text-violet-500 text-sm hover:underline"
              >
                Написати перший лист
              </button>
            </div>
          ) : (
            activeLettres.map((letter) => {
              const completion = getHabitCompletion(letter.habit_id, logs)
              const unlocked = isLetterUnlocked(letter, completion)
              const habit = habits.find((h) => h.id === letter.habit_id)
              const daysLeft = differenceInDays(parseISO(letter.unlock_date), new Date())

              return (
                <div
                  key={letter.id}
                  onClick={() => handleOpen(letter)}
                  className={`relative rounded-2xl border p-4 transition-all cursor-pointer ${
                    unlocked
                      ? 'bg-white dark:bg-gray-800 border-violet-200 dark:border-violet-700 hover:shadow-md hover:border-violet-400'
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                  } ${letter.opened_at ? 'opacity-70' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      unlocked ? 'bg-violet-100 dark:bg-violet-900/40' : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      {unlocked ? (
                        <Mail className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                      ) : (
                        <Lock className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className={`font-semibold truncate ${unlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                          {unlocked ? letter.title : '• • • • • • • •'}
                        </h3>
                        {letter.opened_at && (
                          <span className="text-xs text-gray-400 flex-shrink-0">Прочитано</span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                        <span>
                          {unlocked
                            ? `Відкрито ${format(parseISO(letter.unlock_date), 'd MMM yyyy', { locale: uk })}`
                            : daysLeft > 0
                            ? `Відкриється через ${daysLeft} ${daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дні' : 'днів'}`
                            : 'Скоро відкриється'
                          }
                        </span>
                        {habit && (
                          <span className="flex items-center gap-1">
                            <span>{habit.icon}</span>
                            <span>{habit.name}: {completion}% / {letter.target_pct}%</span>
                          </span>
                        )}
                      </div>

                      {/* Progress bar for habit condition */}
                      {habit && !unlocked && (
                        <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden w-48">
                          <div
                            className="h-full bg-violet-500 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (completion / letter.target_pct) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(letter.id) }}
                      className="text-gray-300 dark:text-gray-600 hover:text-red-400 p-1 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Write form */}
      {tab === 'write' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Тема листа</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Дорогий я, через рік..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-violet-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Текст листа</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Напиши що думаєш зараз, що хочеш сказати собі в майбутньому..."
              rows={8}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-violet-400 resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Дата відкриття</label>
            <input
              type="date"
              value={unlockDate}
              onChange={(e) => setUnlockDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-violet-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
              Пов'язати зі звичкою (необов'язково)
            </label>
            <select
              value={habitId}
              onChange={(e) => setHabitId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-violet-400"
            >
              <option value="">— без звички —</option>
              {habits.map((h) => (
                <option key={h.id} value={h.id}>{h.icon} {h.name}</option>
              ))}
            </select>
          </div>

          {habitId && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                Відсоток виконання для відкриття: <span className="text-violet-500">{targetPct}%</span>
              </label>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={targetPct}
                onChange={(e) => setTargetPct(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>10%</span>
                <span>100%</span>
              </div>
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={saving || !title.trim() || !content.trim()}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            {saving ? 'Запечатую...' : 'Запечатати лист'}
          </button>
        </div>
      )}

      {/* Letter modal */}
      {openedLetter && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full shadow-2xl max-h-[85vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-violet-500" />
                <h2 className="font-semibold text-gray-900 dark:text-white">{openedLetter.title}</h2>
              </div>
              <button onClick={() => setOpenedLetter(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              <p className="text-xs text-gray-400 mb-4">
                Написано {format(parseISO(openedLetter.created_at), 'd MMMM yyyy', { locale: uk })}
              </p>
              <div className="text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-serif text-base">
                {openedLetter.content}
              </div>
            </div>

            {/* Actions */}
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex gap-3">
              {!openedLetter.is_burned && (
                <button
                  onClick={() => handleBurn(openedLetter.id)}
                  disabled={burning === openedLetter.id}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-60"
                >
                  <Flame className={`w-4 h-4 ${burning === openedLetter.id ? 'animate-bounce' : ''}`} />
                  {burning === openedLetter.id ? 'Спалюю...' : 'Спалити ритуально'}
                </button>
              )}
              <button
                onClick={() => setOpenedLetter(null)}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm transition-colors"
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
