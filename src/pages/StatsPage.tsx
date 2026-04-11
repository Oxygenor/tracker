import { useState, useMemo } from 'react'
import { Flame, Trophy, TrendingUp, Calendar, Star, Brain, Clock, Zap } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { useStatsData } from '@/hooks/useStatsData'
import YearHeatmap from '@/components/YearHeatmap'
import { cn } from '@/lib/utils'
import { format, addDays } from 'date-fns'
import { uk } from 'date-fns/locale'

const WEEKDAY_NAMES = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number; name: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-gray-600 dark:text-gray-400">
          {p.name}: <span className="font-semibold text-gray-900 dark:text-gray-100">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

function StreakBadge({ value }: { value: number }) {
  if (value === 0) return <span className="text-xs text-gray-400 dark:text-gray-500">немає стріку</span>
  return (
    <span className="inline-flex items-center gap-1 text-orange-500 font-semibold text-sm">
      <Flame className="w-4 h-4" />
      {value} {value === 1 ? 'день' : value < 5 ? 'дні' : 'днів'}
    </span>
  )
}

export default function StatsPage() {
  const [period, setPeriod] = useState<7 | 30>(7)
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null)
  const { days, habitStats, loading } = useStatsData(period)

  const avgPct = days.length
    ? Math.round(days.reduce((s, d) => s + d.pct, 0) / days.length)
    : 0

  const bestCurrentStreak = habitStats.reduce((m, h) => Math.max(m, h.streak), 0)
  const bestAllTimeStreak = habitStats.reduce((m, h) => Math.max(m, h.allTimeStreak), 0)
  const bestHabit = habitStats.find((h) => h.streak === bestCurrentStreak && bestCurrentStreak > 0)
  const totalCompletions = habitStats.reduce((s, h) => s + h.totalDone, 0)

  // Аналітика: найкращий день тижня
  const bestWeekday = useMemo(() => {
    if (habitStats.length === 0) return null
    const weekdayCounts = Array(7).fill(0)
    const weekdayTotals = Array(7).fill(0)
    habitStats.forEach((h) => {
      h.allLogs.forEach((l) => {
        const dow = new Date(l.date).getDay()
        weekdayTotals[dow]++
        if (l.value > 0) weekdayCounts[dow]++
      })
    })
    const weekdayRates = weekdayCounts.map((c, i) => ({
      day: i,
      name: WEEKDAY_NAMES[i],
      rate: weekdayTotals[i] > 0 ? Math.round((c / weekdayTotals[i]) * 100) : 0,
      count: c,
    }))
    const best = weekdayRates.reduce((a, b) => b.rate > a.rate ? b : a, weekdayRates[0])
    const worst = weekdayRates.reduce((a, b) => b.rate < a.rate ? b : a, weekdayRates[0])
    return { best, worst, weekdayRates }
  }, [habitStats])

  // Аналітика: кореляції між звичками
  const correlations = useMemo(() => {
    if (habitStats.length < 2) return []
    const pairs: { a: string; b: string; aName: string; bName: string; aIcon: string; bIcon: string; corr: number }[] = []
    for (let i = 0; i < habitStats.length; i++) {
      for (let j = i + 1; j < habitStats.length; j++) {
        const ha = habitStats[i]
        const hb = habitStats[j]
        // Знаходимо спільні дати
        const datesA = new Set(ha.allLogs.filter((l) => l.value > 0).map((l) => l.date))
        const datesB = new Set(hb.allLogs.filter((l) => l.value > 0).map((l) => l.date))
        const allDates = Array.from(new Set([...ha.allLogs.map((l) => l.date), ...hb.allLogs.map((l) => l.date)]))
        if (allDates.length < 7) continue
        // Pearson correlation
        const va: number[] = allDates.map((d) => (datesA.has(d) ? 1 : 0))
        const vb: number[] = allDates.map((d) => (datesB.has(d) ? 1 : 0))
        const n = allDates.length
        const meanA = va.reduce((s: number, v: number) => s + v, 0) / n
        const meanB = vb.reduce((s: number, v: number) => s + v, 0) / n
        const num = va.reduce((s: number, v: number, idx: number) => s + (v - meanA) * (vb[idx] - meanB), 0)
        const denA = Math.sqrt(va.reduce((s: number, v: number) => s + (v - meanA) ** 2, 0))
        const denB = Math.sqrt(vb.reduce((s: number, v: number) => s + (v - meanB) ** 2, 0))
        const corr = denA && denB ? num / (denA * denB) : 0
        if (Math.abs(corr) >= 0.4) {
          pairs.push({ a: ha.id, b: hb.id, aName: ha.name, bName: hb.name, aIcon: ha.icon, bIcon: hb.icon, corr: Math.round(corr * 100) / 100 })
        }
      }
    }
    return pairs.sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr)).slice(0, 3)
  }, [habitStats])

  // Аналітика: прогноз стріку
  const streakForecast = useMemo(() => {
    return habitStats
      .filter((h) => h.streak > 0)
      .map((h) => {
        const milestones = [7, 14, 30, 50, 100]
        const next = milestones.find((m) => m > h.streak)
        if (!next) return null
        const daysLeft = next - h.streak
        const targetDate = format(addDays(new Date(), daysLeft), 'd MMMM', { locale: uk })
        return { id: h.id, name: h.name, icon: h.icon, color: h.color, streak: h.streak, next, daysLeft, targetDate }
      })
      .filter(Boolean)
      .slice(0, 3)
  }, [habitStats])

  // Аналітика: скільки днів/часу "повернуто" для streak_free звичок
  const timeSaved = useMemo(() => {
    return habitStats
      .filter((h) => {
        const totalDone = h.allLogs.filter((l) => l.value > 0).length
        return totalDone > 0 && h.allTimeStreak > 0
      })
      .map((h) => ({
        id: h.id,
        name: h.name,
        icon: h.icon,
        days: h.allLogs.filter((l) => l.value > 0).length,
      }))
      .sort((a, b) => b.days - a.days)
      .slice(0, 3)
  }, [habitStats])

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Статистика</h1>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
          {([7, 30] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                period === p
                  ? 'bg-white dark:bg-gray-600 text-violet-700 dark:text-violet-400 shadow'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {p === 7 ? '7 днів' : '30 днів'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
              <div className="w-8 h-8 bg-violet-50 dark:bg-violet-900/30 rounded-xl flex items-center justify-center mb-2">
                <TrendingUp className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{avgPct}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Середнє</p>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
              <div className="w-8 h-8 bg-orange-50 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-2">
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{bestCurrentStreak}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Кращий стрік</p>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
              <div className="w-8 h-8 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-2">
                <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {days.filter((d) => d.pct === 100).length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Ідеальних днів</p>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
              <div className="w-8 h-8 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center mb-2">
                <Star className="w-4 h-4 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{bestAllTimeStreak}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Рекорд streak</p>
            </div>
          </div>

          {bestHabit && bestCurrentStreak > 0 && (
            <div className="bg-gradient-to-r from-orange-50 dark:from-orange-900/20 to-amber-50 dark:to-amber-900/20 border border-orange-100 dark:border-orange-800/30 rounded-2xl p-4 flex items-center gap-3">
              <div className="text-2xl">{bestHabit.icon}</div>
              <div>
                <p className="text-sm text-orange-800 dark:text-orange-400 font-medium">Найкращий стрік</p>
                <p className="text-xs text-orange-600 dark:text-orange-500">{bestHabit.name} — {bestCurrentStreak} {bestCurrentStreak === 1 ? 'день' : bestCurrentStreak < 5 ? 'дні' : 'днів'} поспіль</p>
              </div>
              <Trophy className="w-6 h-6 text-amber-500 ml-auto" />
            </div>
          )}

          {/* ── INSIGHTS ── */}
          {habitStats.length >= 1 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Brain className="w-4 h-4 text-violet-500" />
                Інсайти
              </h2>

              {/* Найкращий день тижня */}
              {bestWeekday && (
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Твій найкращий день тижня</h3>
                  <div className="flex gap-2">
                    {bestWeekday.weekdayRates.map((wd) => (
                      <div key={wd.day} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden" style={{ height: 60 }}>
                          <div
                            className="w-full rounded-lg transition-all"
                            style={{
                              height: `${wd.rate}%`,
                              backgroundColor: wd.day === bestWeekday.best.day ? '#8b5cf6' : wd.day === bestWeekday.worst.day ? '#fca5a5' : '#c4b5fd',
                              marginTop: `${100 - wd.rate}%`,
                            }}
                          />
                        </div>
                        <span className={cn('text-xs font-medium', wd.day === bestWeekday.best.day ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400 dark:text-gray-500')}>
                          {wd.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{wd.rate}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-3">
                    <p className="text-xs text-violet-600 dark:text-violet-400">🔝 {bestWeekday.best.name} — {bestWeekday.best.rate}% виконань</p>
                    <p className="text-xs text-red-400">⬇️ {bestWeekday.worst.name} — {bestWeekday.worst.rate}%</p>
                  </div>
                </div>
              )}

              {/* Прогноз стріку */}
              {streakForecast.length > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    Прогноз стріку
                  </h3>
                  <div className="space-y-3">
                    {streakForecast.map((f) => f && (
                      <div key={f.id} className="flex items-center gap-3">
                        <span className="text-xl">{f.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{f.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Зараз {f.streak} дн. → ціль {f.next} дн. за {f.daysLeft} {f.daysLeft === 1 ? 'день' : 'днів'} ({f.targetDate})
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="w-16 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${Math.round((f.streak / f.next) * 100)}%`, backgroundColor: f.color }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 text-right mt-0.5">{Math.round((f.streak / f.next) * 100)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Кореляції між звичками */}
              {correlations.length > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Звички, що посилюють одна одну
                  </h3>
                  <div className="space-y-3">
                    {correlations.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-base">{c.aIcon}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">+</span>
                        <span className="text-base">{c.bIcon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                            {c.aName} ↔ {c.bName}
                          </p>
                        </div>
                        <span className={cn(
                          'text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0',
                          c.corr > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        )}>
                          {c.corr > 0 ? '+' : ''}{Math.round(c.corr * 100)}%
                        </span>
                      </div>
                    ))}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Ці звички частіше виконуються разом того ж дня
                    </p>
                  </div>
                </div>
              )}

              {/* Дні виконань (скільки повернуто) */}
              {timeSaved.length > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-500" />
                    Твій вклад у себе
                  </h3>
                  <div className="space-y-2">
                    {timeSaved.map((t) => (
                      <div key={t.id} className="flex items-center gap-3">
                        <span className="text-xl">{t.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{t.name}</p>
                        </div>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400 flex-shrink-0">
                          {t.days} {t.days === 1 ? 'день' : t.days < 5 ? 'дні' : 'днів'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Стільки разів ти вклав час у свій розвиток
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Area chart */}
          {days.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Виконання за день</h2>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={days} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradPct" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="pct" name="Виконано" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#gradPct)" dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Per-habit stats */}
          {habitStats.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">По звичках</h2>
              <div className="space-y-5">
                {habitStats.map((h) => (
                  <div key={h.id}>
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => setExpandedHabit(expandedHabit === h.id ? null : h.id)}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                      >
                        <span className="text-lg">{h.icon}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{h.name}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {expandedHabit === h.id ? '▲' : '▼'} карта
                        </span>
                      </button>
                      <div className="flex items-center gap-3">
                        {h.allTimeStreak > h.streak && (
                          <span className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-0.5">
                            <Star className="w-3 h-3" />
                            рекорд {h.allTimeStreak}д
                          </span>
                        )}
                        <StreakBadge value={h.streak} />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${h.completionRate}%`, backgroundColor: h.color }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">{h.completionRate}%</span>
                    </div>

                    {expandedHabit === h.id && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <YearHeatmap logs={h.allLogs} color={h.color} />
                      </div>
                    )}

                    {expandedHabit !== h.id && (
                      <div className="flex gap-1 flex-wrap">
                        {h.data.map((d, i) => (
                          <div
                            key={i}
                            className="w-5 h-5 rounded-sm transition-all"
                            style={{
                              backgroundColor: d.value > 0 ? h.color : undefined,
                              opacity: d.value > 0 ? 0.85 : undefined,
                            }}
                            title={d.value > 0 ? 'Виконано' : 'Не виконано'}
                            {...(d.value === 0 && { className: 'w-5 h-5 rounded-sm bg-gray-100 dark:bg-gray-700' })}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bar chart */}
          {days.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Кількість виконаних звичок</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">Всього: {totalCompletions}</span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={days} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f3ff' }} />
                  <Bar dataKey="completed" name="Виконано" radius={[6, 6, 0, 0]} maxBarSize={32}>
                    {days.map((d, i) => (
                      <Cell key={i} fill={d.pct === 100 ? '#10b981' : d.pct >= 50 ? '#8b5cf6' : '#e5e7eb'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-3">
                {[
                  { color: '#10b981', label: '100% виконано' },
                  { color: '#8b5cf6', label: '≥50%' },
                  { color: '#e5e7eb', label: '<50%' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {habitStats.length === 0 && (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <p className="text-sm">Ще немає даних. Відміть звички на Dashboard!</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
