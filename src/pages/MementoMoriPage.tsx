import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { fetchLogsForRange } from '@/lib/supabase'
import { format, addWeeks, differenceInWeeks, parseISO } from 'date-fns'
import { uk } from 'date-fns/locale'

const BIRTH_YEAR_KEY = 'mori_birth_year'
const LIFE_EXPECTANCY = 80
const WEEKS_PER_YEAR = 52

type WeekStatus = 'past-good' | 'past-ok' | 'past-bad' | 'past-empty' | 'current' | 'future'

function getWeekColor(status: WeekStatus): string {
  switch (status) {
    case 'past-good':  return '#6d28d9'
    case 'past-ok':    return '#4c1d95'
    case 'past-bad':   return '#374151'
    case 'past-empty': return '#1f2937'
    case 'current':    return '#f59e0b'
    case 'future':     return '#111827'
    default:           return '#111827'
  }
}

export default function MementoMoriPage() {
  const { user } = useAuth()
  const [birthYear, setBirthYear] = useState<number>(() => {
    const stored = localStorage.getItem(BIRTH_YEAR_KEY)
    return stored ? parseInt(stored) : 1990
  })
  const [inputYear, setInputYear] = useState(String(birthYear))
  const [weekData, setWeekData] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [hoveredWeek, setHoveredWeek] = useState<{ year: number; week: number; label: string } | null>(null)

  const today = new Date()
  const currentYear = today.getFullYear()
  const birthDate = new Date(birthYear, 0, 1)
  const weeksLived = Math.max(0, differenceInWeeks(today, birthDate))
  const totalWeeks = LIFE_EXPECTANCY * WEEKS_PER_YEAR
  const weeksRemaining = Math.max(0, totalWeeks - weeksLived)
  const pctLived = Math.min(100, (weeksLived / totalWeeks) * 100)

  useEffect(() => {
    if (!user) return
    async function load() {
      setLoading(true)
      try {
        const from = format(new Date(birthYear, 0, 1), 'yyyy-MM-dd')
        const to = format(today, 'yyyy-MM-dd')
        const logs = await fetchLogsForRange(user!.id, from, to)
        // Group logs by week key (year-week)
        const weekMap = new Map<string, { total: number; completed: number }>()
        for (const log of logs) {
          const d = parseISO(log.date)
          const yr = d.getFullYear()
          const weekNum = differenceInWeeks(d, new Date(yr, 0, 1))
          const key = `${yr}-${weekNum}`
          if (!weekMap.has(key)) weekMap.set(key, { total: 0, completed: 0 })
          const entry = weekMap.get(key)!
          entry.total++
          if (log.value > 0) entry.completed++
        }
        const result = new Map<string, number>()
        for (const [key, { total, completed }] of weekMap) {
          result.set(key, total > 0 ? completed / total : 0)
        }
        setWeekData(result)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, birthYear])

  function getWeekStatus(year: number, weekIndex: number): WeekStatus {
    const weekStart = addWeeks(new Date(birthYear, 0, 1), year * WEEKS_PER_YEAR + weekIndex)
    const weekEnd = addWeeks(weekStart, 1)
    if (weekStart <= today && weekEnd > today) return 'current'
    if (weekEnd <= today) {
      // Past week
      const actualYear = weekStart.getFullYear()
      const actualWeek = differenceInWeeks(weekStart, new Date(actualYear, 0, 1))
      const key = `${actualYear}-${actualWeek}`
      const pct = weekData.get(key)
      if (pct === undefined) return 'past-empty'
      if (pct >= 0.8) return 'past-good'
      if (pct >= 0.4) return 'past-ok'
      return 'past-bad'
    }
    return 'future'
  }

  function handleYearChange() {
    const y = parseInt(inputYear)
    if (!isNaN(y) && y >= 1900 && y <= currentYear) {
      setBirthYear(y)
      localStorage.setItem(BIRTH_YEAR_KEY, String(y))
    }
  }

  const yearsAge = currentYear - birthYear

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Memento Mori</h1>
          <p className="text-gray-400 text-sm">Кожен квадрат — тиждень твого життя. Живи усвідомлено.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-4">
            <div className="text-2xl font-bold text-amber-400">{yearsAge}</div>
            <div className="text-xs text-gray-500 mt-1">Років прожито</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4">
            <div className="text-2xl font-bold text-violet-400">{weeksLived.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">Тижнів прожито</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-400">{weeksRemaining.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">Тижнів залишилось</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4">
            <div className="text-2xl font-bold text-green-400">{pctLived.toFixed(1)}%</div>
            <div className="text-xs text-gray-500 mt-1">Використано</div>
          </div>
        </div>

        {/* Birth year input */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-sm text-gray-400">Рік народження:</span>
          <input
            type="number"
            value={inputYear}
            onChange={(e) => setInputYear(e.target.value)}
            onBlur={handleYearChange}
            onKeyDown={(e) => e.key === 'Enter' && handleYearChange()}
            className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-violet-500"
            min={1900}
            max={currentYear}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-6 text-xs text-gray-400">
          {[
            { color: '#6d28d9', label: 'Добрий тиждень (≥80% звичок)' },
            { color: '#4c1d95', label: 'Середній (≥40%)' },
            { color: '#374151', label: 'Слабкий (<40%)' },
            { color: '#1f2937', label: 'Без даних' },
            { color: '#f59e0b', label: 'Зараз' },
            { color: '#111827', label: 'Майбутнє' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color, border: '1px solid #374151' }} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center text-gray-500 py-20">Завантаження...</div>
        ) : (
          <div className="relative overflow-x-auto">
            {/* Week numbers header */}
            <div className="flex gap-px mb-1 ml-10">
              {Array.from({ length: WEEKS_PER_YEAR }, (_, i) => (
                <div key={i} className="w-2.5 text-center" style={{ fontSize: '7px', color: '#6b7280' }}>
                  {(i + 1) % 4 === 0 ? i + 1 : ''}
                </div>
              ))}
            </div>

            {/* Rows = years of life */}
            {Array.from({ length: LIFE_EXPECTANCY }, (_, yearIdx) => {
              const ageYear = birthYear + yearIdx
              return (
                <div key={yearIdx} className="flex items-center gap-px mb-px">
                  {/* Year label */}
                  <div className="w-9 text-right pr-1 flex-shrink-0" style={{ fontSize: '8px', color: '#6b7280' }}>
                    {yearIdx % 5 === 0 ? ageYear : ''}
                  </div>
                  {/* Week squares */}
                  {Array.from({ length: WEEKS_PER_YEAR }, (_, weekIdx) => {
                    const status = getWeekStatus(yearIdx, weekIdx)
                    const color = getWeekColor(status)
                    const weekStart = addWeeks(new Date(birthYear, 0, 1), yearIdx * WEEKS_PER_YEAR + weekIdx)
                    const label = format(weekStart, 'd MMM yyyy', { locale: uk })
                    return (
                      <div
                        key={weekIdx}
                        className="w-2.5 h-2.5 rounded-sm cursor-default transition-transform hover:scale-150"
                        style={{ backgroundColor: color, border: status === 'current' ? '1px solid #fbbf24' : 'none' }}
                        onMouseEnter={() => setHoveredWeek({ year: ageYear, week: weekIdx + 1, label })}
                        onMouseLeave={() => setHoveredWeek(null)}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        {/* Tooltip */}
        {hoveredWeek && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm pointer-events-none z-50 shadow-xl">
            <span className="text-gray-300">{hoveredWeek.year} р., тиждень {hoveredWeek.week}</span>
            <span className="text-gray-500 ml-2">({hoveredWeek.label})</span>
          </div>
        )}

        {/* Reflection */}
        <div className="mt-10 bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <p className="text-gray-400 text-sm italic text-center leading-relaxed">
            "Memento mori" — пам'ятай, що ти смертний.<br />
            Не щоб сумувати, а щоб кожен тиждень мав значення.
          </p>
        </div>
      </div>
    </div>
  )
}
