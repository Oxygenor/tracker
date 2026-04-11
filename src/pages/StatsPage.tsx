import { useState } from 'react'
import { Flame, Trophy, TrendingUp, Calendar } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { useStatsData } from '@/hooks/useStatsData'
import { cn } from '@/lib/utils'

// ── Custom Tooltip ────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number; name: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-gray-600">
          {p.name}: <span className="font-semibold text-gray-900">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

// ── Streak badge ──────────────────────────────────────────────
function StreakBadge({ value }: { value: number }) {
  if (value === 0) return <span className="text-xs text-gray-400">немає стріку</span>
  return (
    <span className="inline-flex items-center gap-1 text-orange-500 font-semibold text-sm">
      <Flame className="w-4 h-4" />
      {value} {value === 1 ? 'день' : value < 5 ? 'дні' : 'днів'}
    </span>
  )
}

// ── Mini heatmap row ──────────────────────────────────────────
function HeatmapRow({ data, color }: {
  data: { value: number }[]
  color: string
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {data.map((d, i) => (
        <div
          key={i}
          className="w-5 h-5 rounded-sm transition-all"
          style={{
            backgroundColor: d.value > 0 ? color : '#f3f4f6',
            opacity: d.value > 0 ? 0.85 : 1,
          }}
          title={d.value > 0 ? 'Виконано' : 'Не виконано'}
        />
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function StatsPage() {
  const [period, setPeriod] = useState<7 | 30>(7)
  const { days, habitStats, loading } = useStatsData(period)

  const avgPct = days.length
    ? Math.round(days.reduce((s, d) => s + d.pct, 0) / days.length)
    : 0

  const bestStreak = habitStats.reduce((m, h) => Math.max(m, h.streak), 0)
  const bestHabit = habitStats.find((h) => h.streak === bestStreak)

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Статистика</h1>
        <div className="flex bg-gray-100 rounded-xl p-1">
          {([7, 30] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                period === p ? 'bg-white text-violet-700 shadow' : 'text-gray-500 hover:text-gray-700'
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
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="w-8 h-8 bg-violet-50 rounded-xl flex items-center justify-center mb-2">
                <TrendingUp className="w-4 h-4 text-violet-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{avgPct}%</p>
              <p className="text-xs text-gray-500 mt-0.5">Середнє виконання</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center mb-2">
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{bestStreak}</p>
              <p className="text-xs text-gray-500 mt-0.5">Кращий стрік</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center mb-2">
                <Calendar className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {days.filter((d) => d.pct === 100).length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Ідеальних днів</p>
            </div>
          </div>

          {bestHabit && bestStreak > 0 && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-3">
              <div className="text-2xl">{bestHabit.icon}</div>
              <div>
                <p className="text-sm text-orange-800 font-medium">Найкращий стрік</p>
                <p className="text-xs text-orange-600">{bestHabit.name} — {bestStreak} {bestStreak === 1 ? 'день' : bestStreak < 5 ? 'дні' : 'днів'} поспіль</p>
              </div>
              <Trophy className="w-6 h-6 text-amber-500 ml-auto" />
            </div>
          )}

          {/* Area chart — overall % */}
          {days.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Виконання за день</h2>
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
                  <Area
                    type="monotone"
                    dataKey="pct"
                    name="Виконано"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    fill="url(#gradPct)"
                    dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Per-habit stats */}
          {habitStats.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">По звичках</h2>
              <div className="space-y-5">
                {habitStats.map((h) => (
                  <div key={h.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{h.icon}</span>
                        <span className="text-sm font-medium text-gray-900">{h.name}</span>
                      </div>
                      <StreakBadge value={h.streak} />
                    </div>

                    {/* Completion bar */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${h.completionRate}%`, backgroundColor: h.color }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-10 text-right">{h.completionRate}%</span>
                    </div>

                    {/* Heatmap */}
                    <HeatmapRow data={h.data} color={h.color} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bar chart — completed count per day */}
          {days.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Кількість виконаних звичок</h2>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={days} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f3ff' }} />
                  <Bar dataKey="completed" name="Виконано" radius={[6, 6, 0, 0]} maxBarSize={32}>
                    {days.map((d, i) => (
                      <Cell
                        key={i}
                        fill={d.pct === 100 ? '#10b981' : d.pct >= 50 ? '#8b5cf6' : '#e5e7eb'}
                      />
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
                    <span className="text-xs text-gray-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {habitStats.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <BarChart className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Ще немає даних. Відміть звички на Dashboard!</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
