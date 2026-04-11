import { useMemo, useEffect, useState } from 'react'
import { getWeek, getYear, startOfWeek, endOfWeek, format, differenceInDays } from 'date-fns'
import { uk } from 'date-fns/locale'
import { Sword, Shield, CheckCircle2, Clock, Trophy, Snowflake, Sun, Leaf, Flower2 } from 'lucide-react'
import { useStatsData } from '@/hooks/useStatsData'
import { getCurrentSeason } from '@/hooks/useGamification'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

interface Challenge {
  id: string
  title: string
  description: string
  emoji: string
  xpReward: number
  type: 'completions' | 'streak' | 'perfect_days' | 'total'
  target: number
  current: number
  completed: boolean
  difficulty: 'easy' | 'medium' | 'hard'
}

const CHALLENGE_POOL: Omit<Challenge, 'current' | 'completed'>[] = [
  { id: 'w_7_completions', title: '7 кроків', description: 'Виконай будь-яку звичку 7 разів цього тижня', emoji: '👣', xpReward: 50, type: 'completions', target: 7, difficulty: 'easy' },
  { id: 'w_15_completions', title: 'Розгін', description: 'Виконай звички 15 разів цього тижня', emoji: '🚀', xpReward: 80, type: 'completions', target: 15, difficulty: 'medium' },
  { id: 'w_30_completions', title: 'Машина звичок', description: 'Виконай звички 30 разів цього тижня', emoji: '⚙️', xpReward: 150, type: 'completions', target: 30, difficulty: 'hard' },
  { id: 'w_streak_3', title: 'Трійка', description: 'Тримай стрік 3 дні поспіль', emoji: '🔥', xpReward: 60, type: 'streak', target: 3, difficulty: 'easy' },
  { id: 'w_streak_5', title: 'П\'ятірка', description: 'Тримай стрік 5 днів поспіль', emoji: '⚡', xpReward: 100, type: 'streak', target: 5, difficulty: 'medium' },
  { id: 'w_streak_7', title: 'Тижневий воїн', description: 'Тримай стрік весь тиждень', emoji: '🛡️', xpReward: 200, type: 'streak', target: 7, difficulty: 'hard' },
  { id: 'w_perfect_2', title: 'Ідеаліст', description: '2 ідеальних дні (всі звички)', emoji: '✨', xpReward: 80, type: 'perfect_days', target: 2, difficulty: 'medium' },
  { id: 'w_perfect_5', title: 'Перфекціоніст', description: '5 ідеальних днів за тиждень', emoji: '💎', xpReward: 200, type: 'perfect_days', target: 5, difficulty: 'hard' },
  { id: 'w_total_50', title: 'Ціла сотня', description: '50+ загальних виконань всього часу', emoji: '💯', xpReward: 100, type: 'total', target: 50, difficulty: 'medium' },
]

function getWeeklyChallenges(weekNum: number): typeof CHALLENGE_POOL {
  // Детермінована вибірка 3 челенджів на основі номера тижня
  const seed = weekNum % (CHALLENGE_POOL.length - 2)
  const easy = CHALLENGE_POOL.filter((c) => c.difficulty === 'easy')
  const medium = CHALLENGE_POOL.filter((c) => c.difficulty === 'medium')
  const hard = CHALLENGE_POOL.filter((c) => c.difficulty === 'hard')
  return [
    easy[seed % easy.length],
    medium[seed % medium.length],
    hard[seed % hard.length],
  ]
}

const SEASON_ICONS = { '❄️': Snowflake, '🌸': Flower2, '☀️': Sun, '🍂': Leaf }

const SEASON_ACHIEVEMENTS: Record<string, { title: string; description: string; xp: number }[]> = {
  '❄️': [
    { title: 'Зимовий старт', description: '10 виконань цього місяця', xp: 75 },
    { title: 'Мороз не зупинить', description: '5-денний стрік взимку', xp: 100 },
    { title: 'Снігова фортеця', description: '30 виконань за зиму', xp: 150 },
  ],
  '🌸': [
    { title: 'Квітневий розквіт', description: '10 виконань цього місяця', xp: 75 },
    { title: 'Весняне відродження', description: '5-денний стрік навесні', xp: 100 },
    { title: 'Сад звичок', description: '30 виконань за весну', xp: 150 },
  ],
  '☀️': [
    { title: 'Літній заряд', description: '10 виконань цього місяця', xp: 75 },
    { title: 'Спека мотивації', description: '5-денний стрік влітку', xp: 100 },
    { title: 'Сонячний марафон', description: '30 виконань за літо', xp: 150 },
  ],
  '🍂': [
    { title: 'Осінній темп', description: '10 виконань цього місяця', xp: 75 },
    { title: 'Листопадна стійкість', description: '5-денний стрік восени', xp: 100 },
    { title: 'Жнива звичок', description: '30 виконань за осінь', xp: 150 },
  ],
}

const DIFFICULTY_COLORS = {
  easy: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30',
  medium: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30',
  hard: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30',
}
const DIFFICULTY_LABELS = { easy: 'Легко', medium: 'Середньо', hard: 'Важко' }

export default function ChallengePage() {
  const { user } = useAuth()
  const { habitStats, loading } = useStatsData(30)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

  const season = getCurrentSeason()
  const SeasonIcon = SEASON_ICONS[season.emoji as keyof typeof SEASON_ICONS] ?? Leaf
  const seasonAchievements = SEASON_ACHIEVEMENTS[season.emoji] ?? []

  const now = new Date()
  const weekNum = getWeek(now, { weekStartsOn: 1 })
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const daysLeft = differenceInDays(weekEnd, now) + 1
  const weekKey = `${getYear(now)}-W${weekNum}`

  // Завантажуємо виконані челенджі з localStorage
  useEffect(() => {
    if (!user) return
    const key = `challenges_${user.id}_${weekKey}`
    const saved = localStorage.getItem(key)
    if (saved) setCompletedIds(new Set(JSON.parse(saved)))
  }, [user, weekKey])

  function completeChallenge(id: string) {
    if (!user) return
    const key = `challenges_${user.id}_${weekKey}`
    const newSet = new Set([...completedIds, id])
    setCompletedIds(newSet)
    localStorage.setItem(key, JSON.stringify(Array.from(newSet)))
  }

  const totalCompletionsAllTime = habitStats.reduce((s, h) => s + h.allLogs.filter((l) => l.value > 0).length, 0)
  const bestStreak = habitStats.reduce((m, h) => Math.max(m, h.streak), 0)

  // Підраховуємо виконання за цей тиждень
  const weekStartStr = format(weekStart, 'yyyy-MM-dd')
  const weekCompletions = habitStats.reduce((s, h) => {
    return s + h.allLogs.filter((l) => l.value > 0 && l.date >= weekStartStr).length
  }, 0)
  const perfectDaysThisWeek = (() => {
    const days = new Set<string>()
    habitStats.forEach((h) => {
      h.allLogs.filter((l) => l.value > 0 && l.date >= weekStartStr).forEach((l) => days.add(l.date))
    })
    let count = 0
    days.forEach((date) => {
      const allDone = habitStats.every((h) => h.allLogs.some((l) => l.date === date && l.value > 0))
      if (allDone && habitStats.length > 0) count++
    })
    return count
  })()

  const weekChallenges = useMemo((): Challenge[] => {
    const pool = getWeeklyChallenges(weekNum)
    return pool.map((c) => {
      let current = 0
      if (c.type === 'completions') current = weekCompletions
      else if (c.type === 'streak') current = bestStreak
      else if (c.type === 'perfect_days') current = perfectDaysThisWeek
      else if (c.type === 'total') current = totalCompletionsAllTime
      const completed = completedIds.has(c.id) || current >= c.target
      return { ...c, current, completed }
    })
  }, [weekNum, weekCompletions, bestStreak, perfectDaysThisWeek, totalCompletionsAllTime, completedIds])

  // Сезонні досягнення прогрес
  const seasonStart = (() => {
    const y = now.getFullYear()
    const m = ['❄️', '🌸', '☀️', '🍂'].indexOf(season.emoji)
    const startMonths = [11, 2, 5, 8]
    return `${y}-${String(startMonths[m] + 1).padStart(2, '0')}-01`
  })()
  const seasonCompletions = habitStats.reduce((s, h) => {
    return s + h.allLogs.filter((l) => l.value > 0 && l.date >= seasonStart).length
  }, 0)
  const seasonStreak = bestStreak

  const seasonProgress = [
    { ...seasonAchievements[0], current: seasonCompletions, target: 10, done: seasonCompletions >= 10 },
    { ...seasonAchievements[1], current: seasonStreak, target: 5, done: seasonStreak >= 5 },
    { ...seasonAchievements[2], current: seasonCompletions, target: 30, done: seasonCompletions >= 30 },
  ]

  const totalXP = weekChallenges.filter((c) => c.completed).reduce((s, c) => s + c.xpReward, 0)

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Виклики</h1>

      {/* Сезонний баннер */}
      <div
        className="rounded-2xl p-5 text-white shadow-lg"
        style={{ background: `linear-gradient(135deg, ${season.color}cc, ${season.color}88)` }}
      >
        <div className="flex items-center gap-3 mb-2">
          <SeasonIcon className="w-6 h-6" />
          <span className="font-bold text-lg">{season.emoji} Сезон: {season.name}</span>
        </div>
        <p className="text-sm text-white/80">Отримай сезонні досягнення поки сезон активний!</p>
        <div className="mt-3 flex gap-2">
          {seasonProgress.map((a, i) => (
            <div key={i} className={cn('flex-1 p-2 rounded-xl text-center', a.done ? 'bg-white/30' : 'bg-white/10')}>
              {a.done ? (
                <CheckCircle2 className="w-4 h-4 mx-auto text-white mb-1" />
              ) : (
                <div className="w-4 h-4 mx-auto border-2 border-white/50 rounded-full mb-1" />
              )}
              <p className="text-xs text-white/90 leading-tight">{a.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Тижневі виклики */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Sword className="w-4 h-4 text-violet-500" />
            Тижневі боси
          </h2>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            {daysLeft} {daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дні' : 'днів'} до кінця тижня
          </div>
        </div>

        <div className="text-xs text-gray-400 dark:text-gray-500 mb-3">
          {format(weekStart, 'd MMM', { locale: uk })} – {format(weekEnd, 'd MMM yyyy', { locale: uk })} · +{totalXP} XP зароблено
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {weekChallenges.map((challenge) => {
              const pct = Math.min(100, Math.round((challenge.current / challenge.target) * 100))
              const canClaim = challenge.current >= challenge.target && !completedIds.has(challenge.id)

              return (
                <div
                  key={challenge.id}
                  className={cn(
                    'bg-white dark:bg-gray-800 border rounded-2xl p-4 shadow-sm transition-all',
                    challenge.completed
                      ? 'border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10'
                      : 'border-gray-100 dark:border-gray-700'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'text-2xl w-12 h-12 flex items-center justify-center rounded-xl flex-shrink-0',
                      challenge.completed ? 'bg-green-50 dark:bg-green-900/30' : 'bg-gray-50 dark:bg-gray-700'
                    )}>
                      {challenge.completed ? '✅' : challenge.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{challenge.title}</p>
                        <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', DIFFICULTY_COLORS[challenge.difficulty])}>
                          {DIFFICULTY_LABELS[challenge.difficulty]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{challenge.description}</p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400 dark:text-gray-500">{challenge.current}/{challenge.target}</span>
                          <span className="text-xs font-medium text-violet-600 dark:text-violet-400">+{challenge.xpReward} XP</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', challenge.completed ? 'bg-green-500' : 'bg-violet-500')}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    {canClaim && (
                      <button
                        onClick={() => completeChallenge(challenge.id)}
                        className="flex-shrink-0 flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white text-xs px-3 py-2 rounded-xl font-medium transition-colors"
                      >
                        <Trophy className="w-3.5 h-3.5" />
                        Забрати
                      </button>
                    )}
                    {challenge.completed && !canClaim && (
                      <Shield className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Сезонні деталі */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
          <SeasonIcon className="w-4 h-4" style={{ color: season.color }} />
          Сезонні завдання — {season.name}
        </h2>
        <div className="space-y-3">
          {seasonProgress.map((a, i) => (
            <div
              key={i}
              className={cn(
                'bg-white dark:bg-gray-800 border rounded-2xl p-4 shadow-sm transition-all',
                a.done
                  ? 'border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10'
                  : 'border-gray-100 dark:border-gray-700'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0',
                  a.done ? 'bg-green-50 dark:bg-green-900/30' : 'bg-gray-50 dark:bg-gray-700'
                )}>
                  {a.done ? '✅' : season.emoji}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{a.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{a.description}</p>
                  <div className="mt-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.round((a.current / a.target) * 100))}%`, backgroundColor: season.color }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{a.current}/{a.target}</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-violet-600 dark:text-violet-400 flex-shrink-0">+{a.xp} XP</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
