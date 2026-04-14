import { useStatsData } from '@/hooks/useStatsData'
import { useGamification } from '@/hooks/useGamification'
import { useHabits } from '@/hooks/useHabits'
import { useTasks } from '@/hooks/useTasks'
import { cn } from '@/lib/utils'
import { Zap } from 'lucide-react'

export default function AchievementsPage() {
  const { habitStats, loading } = useStatsData(30)
  const { habits } = useHabits()
  const { allTimeXP } = useTasks()
  const { xp, level, levelTitle, xpForNextLevel, xpForCurrentLevel, xpProgress, achievements, totalCompletions, comboBonus, season } = useGamification(habitStats, habits, allTimeXP)

  const earned = achievements.filter((a) => a.earned).length

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Досягнення</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* XP + Level card */}
          <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-violet-200 text-sm">Поточний рівень</p>
                <p className="text-3xl font-bold mt-0.5">Рівень {level + 1}</p>
                <p className="text-violet-200 text-sm font-medium">{levelTitle}</p>
                <p className="text-violet-300 text-xs mt-1">{season.emoji} Сезон: {season.name}</p>
              </div>
              <div className="text-right">
                <p className="text-violet-200 text-sm">Загальний XP</p>
                <p className="text-3xl font-bold">{xp.toLocaleString()}</p>
                <p className="text-violet-200 text-xs">{totalCompletions} виконань</p>
                {comboBonus > 0 && (
                  <div className="flex items-center gap-1 justify-end mt-1">
                    <Zap className="w-3 h-3 text-yellow-300" />
                    <p className="text-yellow-200 text-xs font-medium">+{comboBonus}% комбо!</p>
                  </div>
                )}
              </div>
            </div>

            {xpForNextLevel > xpForCurrentLevel && (
              <>
                <div className="flex justify-between text-xs text-violet-200 mb-1">
                  <span>{xp - xpForCurrentLevel} XP</span>
                  <span>до рівня {level + 2}: {xpForNextLevel - xp} XP</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </>
            )}
            {xpForNextLevel === xpForCurrentLevel && (
              <p className="text-center text-yellow-200 font-medium text-sm mt-2">🏆 Максимальний рівень!</p>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{earned}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Отримано</p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{achievements.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Всього</p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {Math.round((earned / achievements.length) * 100)}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Прогрес</p>
            </div>
          </div>

          {/* Сезонні досягнення */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              {season.emoji} Сезонні
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {achievements
                .filter((a) => a.seasonal)
                .sort((a, b) => (b.earned ? 1 : 0) - (a.earned ? 1 : 0))
                .map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
            </div>
          </div>

          {/* Основні досягнення */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Всі досягнення
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {achievements
                .filter((a) => !a.seasonal)
                .sort((a, b) => (b.earned ? 1 : 0) - (a.earned ? 1 : 0))
                .map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function AchievementCard({ achievement }: { achievement: ReturnType<typeof useGamification>['achievements'][0] }) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 border rounded-2xl p-4 shadow-sm transition-all',
        achievement.earned
          ? 'border-violet-200 dark:border-violet-700'
          : 'border-gray-100 dark:border-gray-700 opacity-60'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'text-3xl w-12 h-12 flex items-center justify-center rounded-xl flex-shrink-0',
          achievement.earned
            ? 'bg-violet-50 dark:bg-violet-900/30'
            : 'bg-gray-50 dark:bg-gray-700 grayscale'
        )}>
          {achievement.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{achievement.title}</p>
            {achievement.earned && (
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full">✓</span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{achievement.description}</p>

          {!achievement.earned && achievement.progress !== undefined && (
            <div className="mt-2">
              <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-400 rounded-full transition-all"
                  style={{ width: `${achievement.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{achievement.progress}%</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
