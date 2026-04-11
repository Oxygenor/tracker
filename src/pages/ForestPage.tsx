import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { fetchHabits, calculateStreak } from '@/lib/supabase'
import { format } from 'date-fns'
import type { Habit } from '@/types'

interface TreeData {
  habit: Habit
  streak: number
}

// Tree SVG stages: 0=seed, 1=sprout, 2=sapling, 3=tree, 4=big tree, 5=ancient
function getTreeStage(streak: number): number {
  if (streak === 0) return 0
  if (streak < 3) return 1
  if (streak < 7) return 2
  if (streak < 21) return 3
  if (streak < 60) return 4
  return 5
}

function getTreeLabel(stage: number): string {
  return ['Насіння', 'Паросток', 'Саджанець', 'Дерево', 'Велике дерево', 'Вікове дерево'][stage]
}

function TreeSVG({ stage, color, size = 80 }: { stage: number; color: string; size?: number }) {
  const s = size
  const c = color

  if (stage === 0) {
    // Seed — tiny dot
    return (
      <svg width={s} height={s} viewBox="0 0 80 80">
        <ellipse cx="40" cy="68" rx="12" ry="4" fill="#92400e" opacity={0.3} />
        <ellipse cx="40" cy="60" rx="6" ry="8" fill={c} opacity={0.7} />
      </svg>
    )
  }

  if (stage === 1) {
    // Sprout
    return (
      <svg width={s} height={s} viewBox="0 0 80 80">
        <ellipse cx="40" cy="72" rx="14" ry="4" fill="#92400e" opacity={0.3} />
        <rect x="38" y="50" width="4" height="22" rx="2" fill="#78350f" />
        <ellipse cx="40" cy="46" rx="10" ry="12" fill={c} />
      </svg>
    )
  }

  if (stage === 2) {
    // Sapling
    return (
      <svg width={s} height={s} viewBox="0 0 80 80">
        <ellipse cx="40" cy="74" rx="16" ry="4" fill="#92400e" opacity={0.3} />
        <rect x="37" y="45" width="6" height="30" rx="3" fill="#78350f" />
        <ellipse cx="40" cy="38" rx="16" ry="20" fill={c} />
      </svg>
    )
  }

  if (stage === 3) {
    // Tree
    return (
      <svg width={s} height={s} viewBox="0 0 80 80">
        <ellipse cx="40" cy="76" rx="18" ry="4" fill="#92400e" opacity={0.3} />
        <rect x="35" y="40" width="10" height="38" rx="4" fill="#78350f" />
        <ellipse cx="40" cy="30" rx="22" ry="26" fill={c} />
        <ellipse cx="26" cy="38" rx="10" ry="12" fill={c} opacity={0.8} />
        <ellipse cx="54" cy="38" rx="10" ry="12" fill={c} opacity={0.8} />
      </svg>
    )
  }

  if (stage === 4) {
    // Big tree
    return (
      <svg width={s} height={s} viewBox="0 0 80 80">
        <ellipse cx="40" cy="76" rx="20" ry="4" fill="#92400e" opacity={0.4} />
        <rect x="33" y="36" width="14" height="42" rx="5" fill="#92400e" />
        <ellipse cx="40" cy="22" rx="28" ry="28" fill={c} />
        <ellipse cx="20" cy="35" rx="14" ry="16" fill={c} opacity={0.85} />
        <ellipse cx="60" cy="35" rx="14" ry="16" fill={c} opacity={0.85} />
        <ellipse cx="40" cy="12" rx="16" ry="14" fill={c} opacity={0.9} />
      </svg>
    )
  }

  // stage 5 — Ancient tree
  return (
    <svg width={s} height={s} viewBox="0 0 80 80">
      <ellipse cx="40" cy="77" rx="22" ry="5" fill="#92400e" opacity={0.5} />
      <rect x="32" y="30" width="16" height="48" rx="6" fill="#7c2d12" />
      <rect x="22" y="44" width="12" height="6" rx="3" fill="#7c2d12" />
      <rect x="46" y="44" width="12" height="6" rx="3" fill="#7c2d12" />
      <ellipse cx="40" cy="16" rx="32" ry="26" fill={c} />
      <ellipse cx="16" cy="30" rx="16" ry="18" fill={c} opacity={0.9} />
      <ellipse cx="64" cy="30" rx="16" ry="18" fill={c} opacity={0.9} />
      <ellipse cx="40" cy="6" rx="18" ry="14" fill={c} opacity={0.95} />
      {/* Golden glow for ancient */}
      <ellipse cx="40" cy="16" rx="28" ry="22" fill="#fbbf24" opacity={0.12} />
    </svg>
  )
}

export default function ForestPage() {
  const { user } = useAuth()
  const [trees, setTrees] = useState<TreeData[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<TreeData | null>(null)
  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    if (!user) return
    async function load() {
      setLoading(true)
      try {
        const habits = await fetchHabits(user!.id)
        const results = await Promise.all(
          habits.map(async (h) => ({
            habit: h,
            streak: await calculateStreak(h.id, user!.id, today),
          }))
        )
        // Sort by streak descending so biggest trees are first
        results.sort((a, b) => b.streak - a.streak)
        setTrees(results)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, today])

  const totalStreak = trees.reduce((s, t) => s + t.streak, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-950">
        <p className="text-green-300 text-lg animate-pulse">Ліс росте...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-900 via-green-950 to-green-900 flex flex-col">
      {/* Header */}
      <div className="p-6 md:p-8">
        <h1 className="text-2xl font-bold text-white mb-1">Ліс звичок</h1>
        <p className="text-green-300 text-sm">Кожна звичка — дерево. Підтримуй стрік, щоб ліс ріс.</p>

        {/* Stats bar */}
        <div className="flex gap-6 mt-4">
          <div>
            <span className="text-xl font-bold text-amber-400">{trees.length}</span>
            <span className="text-green-400 text-sm ml-1.5">дерев</span>
          </div>
          <div>
            <span className="text-xl font-bold text-amber-400">{totalStreak}</span>
            <span className="text-green-400 text-sm ml-1.5">днів загально</span>
          </div>
          <div>
            <span className="text-xl font-bold text-amber-400">{trees.filter(t => t.streak >= 7).length}</span>
            <span className="text-green-400 text-sm ml-1.5">зрілих дерев</span>
          </div>
        </div>
      </div>

      {/* Forest scene */}
      <div className="flex-1 relative px-4 pb-8">
        {trees.length === 0 ? (
          <div className="text-center mt-20">
            <p className="text-green-400 text-lg">Тут ще немає дерев</p>
            <p className="text-green-600 text-sm mt-2">Додай звички та почни вирощувати свій ліс</p>
          </div>
        ) : (
          <>
            {/* Trees grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 mb-8">
              {trees.map(({ habit, streak }) => {
                const stage = getTreeStage(streak)
                const stageLabel = getTreeLabel(stage)
                const treeColor = habit.color || '#22c55e'
                const isSelected = selected?.habit.id === habit.id

                return (
                  <button
                    key={habit.id}
                    onClick={() => setSelected(isSelected ? null : { habit, streak })}
                    className={`flex flex-col items-center p-3 rounded-2xl transition-all ${
                      isSelected
                        ? 'bg-white/20 ring-2 ring-amber-400 scale-105'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="relative">
                      <TreeSVG stage={stage} color={treeColor} size={72} />
                      {stage === 5 && (
                        <div className="absolute -top-1 -right-1 text-sm">✨</div>
                      )}
                    </div>
                    <span className="text-xs text-green-200 mt-1 font-medium truncate w-full text-center">{habit.name}</span>
                    <span className="text-xs text-amber-400 font-bold">{streak > 0 ? `${streak} днів` : 'Немає стріку'}</span>
                    <span className="text-xs text-green-500">{stageLabel}</span>
                  </button>
                )
              })}
            </div>

            {/* Ground */}
            <div className="h-8 rounded-full" style={{ background: 'linear-gradient(to bottom, #14532d, #052e16)', opacity: 0.6 }} />
          </>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-80 bg-gray-900 border border-gray-700 rounded-2xl p-5 shadow-2xl z-40">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selected.habit.icon}</span>
              <div>
                <h3 className="font-semibold text-white">{selected.habit.name}</h3>
                <p className="text-xs text-gray-400">{getTreeLabel(getTreeStage(selected.streak))}</p>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-300 text-lg leading-none">×</button>
          </div>

          <div className="bg-gray-800 rounded-xl p-3 mb-3 flex items-center justify-center">
            <TreeSVG stage={getTreeStage(selected.streak)} color={selected.habit.color || '#22c55e'} size={100} />
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-800 rounded-lg p-2 text-center">
              <div className="text-amber-400 font-bold text-lg">{selected.streak}</div>
              <div className="text-gray-500 text-xs">днів стріку</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-2 text-center">
              <div className="text-green-400 font-bold text-lg">{getTreeStage(selected.streak)}/5</div>
              <div className="text-gray-500 text-xs">рівень дерева</div>
            </div>
          </div>

          {/* Next stage info */}
          {getTreeStage(selected.streak) < 5 && (
            <div className="mt-3 text-xs text-gray-400 text-center">
              {(() => {
                const thresholds = [0, 1, 3, 7, 21, 60]
                const nextThreshold = thresholds[getTreeStage(selected.streak) + 1]
                const daysLeft = nextThreshold - selected.streak
                return `До наступного рівня: ${daysLeft} ${daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дні' : 'днів'}`
              })()}
            </div>
          )}
          {getTreeStage(selected.streak) === 5 && (
            <div className="mt-3 text-xs text-amber-400 text-center font-medium">✨ Вікове дерево — максимальний рівень!</div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="px-6 pb-24 md:pb-8">
        <div className="bg-black/30 rounded-xl p-4">
          <p className="text-green-400 text-xs font-semibold mb-2">Стадії дерева:</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {[
              { stage: 0, label: 'Насіння', req: '0 днів' },
              { stage: 1, label: 'Паросток', req: '1-2 дні' },
              { stage: 2, label: 'Саджанець', req: '3-6 днів' },
              { stage: 3, label: 'Дерево', req: '7-20 днів' },
              { stage: 4, label: 'Велике', req: '21-59 днів' },
              { stage: 5, label: 'Вікове ✨', req: '60+ днів' },
            ].map(({ stage, label, req }) => (
              <div key={stage} className="text-center">
                <TreeSVG stage={stage} color="#4ade80" size={40} />
                <p className="text-green-300 text-xs font-medium">{label}</p>
                <p className="text-green-600 text-xs">{req}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
