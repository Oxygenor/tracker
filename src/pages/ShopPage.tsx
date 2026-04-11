import { useState, useEffect } from 'react'
import { ShoppingBag, Check, Lock, Sparkles, Tag } from 'lucide-react'
import { useStatsData } from '@/hooks/useStatsData'
import { useGamification } from '@/hooks/useGamification'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

interface ShopItem {
  id: string
  name: string
  description: string
  emoji: string
  type: 'badge' | 'decoration' | 'boost' | 'icon_pack'
  priceXp: number
  preview?: string
}

const SHOP_ITEMS: ShopItem[] = [
  // Значки профілю
  { id: 'badge_warrior', name: 'Воїн звичок', description: 'Показується у профілі', emoji: '⚔️', type: 'badge', priceXp: 150 },
  { id: 'badge_monk', name: 'Монах', description: 'Для тих хто практикує дисципліну', emoji: '🧘', type: 'badge', priceXp: 150 },
  { id: 'badge_scientist', name: 'Вчений', description: 'Для аналітиків даних своїх звичок', emoji: '🔬', type: 'badge', priceXp: 150 },
  { id: 'badge_dragon', name: 'Дракон', description: 'Для тих хто набрав 1000+ XP', emoji: '🐉', type: 'badge', priceXp: 300 },
  { id: 'badge_phoenix', name: 'Фенікс', description: 'Для тих хто відродився після тривалої перерви', emoji: '🦅', type: 'badge', priceXp: 250 },
  { id: 'badge_champion', name: 'Чемпіон', description: 'Еліта серед виконавців звичок', emoji: '🏆', type: 'badge', priceXp: 400 },

  // Декорації
  { id: 'deco_fire', name: 'Вогняний стрік', description: 'Анімований вогонь на індикаторі стріку', emoji: '🔥', type: 'decoration', priceXp: 100 },
  { id: 'deco_rainbow', name: 'Веселковий прогрес', description: 'Кольоровий прогрес-бар на дашборді', emoji: '🌈', type: 'decoration', priceXp: 100 },
  { id: 'deco_stars', name: 'Зоряна ніч', description: 'Зірки навколо виконаних звичок', emoji: '⭐', type: 'decoration', priceXp: 120 },
  { id: 'deco_confetti', name: 'Конфеті', description: 'Конфеті при 100% виконанні', emoji: '🎉', type: 'decoration', priceXp: 80 },

  // Бустери
  { id: 'boost_xp_2x', name: '2x XP на день', description: 'Подвоєний XP за всі виконання сьогодні', emoji: '⚡', type: 'boost', priceXp: 200 },
  { id: 'boost_streak_save', name: 'Захист стріку', description: 'Додатковий заморозок стріку', emoji: '🧊', type: 'boost', priceXp: 150 },

  // Паки іконок
  { id: 'icons_nature', name: 'Природа', description: '10 нових іконок природи', emoji: '🌿', type: 'icon_pack', priceXp: 180 },
  { id: 'icons_sport', name: 'Спорт', description: '10 нових спортивних іконок', emoji: '🏅', type: 'icon_pack', priceXp: 180 },
  { id: 'icons_food', name: 'Їжа', description: '10 нових іконок їжі', emoji: '🍱', type: 'icon_pack', priceXp: 180 },
]

const TYPE_LABELS = {
  badge: 'Значок',
  decoration: 'Декорація',
  boost: 'Бустер',
  icon_pack: 'Пак іконок',
}

const TYPE_COLORS = {
  badge: 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
  decoration: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  boost: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  icon_pack: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
}

type FilterType = 'all' | ShopItem['type']

export default function ShopPage() {
  const { user } = useAuth()
  const { habitStats } = useStatsData(30)
  const { xp } = useGamification(habitStats)
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<FilterType>('all')
  const [justBought, setJustBought] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const key = `shop_${user.id}`
    const saved = localStorage.getItem(key)
    if (saved) setPurchasedIds(new Set(JSON.parse(saved)))
  }, [user])

  const spentXp = Array.from(purchasedIds).reduce((s, id) => {
    const item = SHOP_ITEMS.find((i) => i.id === id)
    return s + (item?.priceXp ?? 0)
  }, 0)
  const availableXp = xp - spentXp

  function buyItem(item: ShopItem) {
    if (!user || availableXp < item.priceXp) return
    const key = `shop_${user.id}`
    const newSet = new Set([...purchasedIds, item.id])
    setPurchasedIds(newSet)
    localStorage.setItem(key, JSON.stringify(Array.from(newSet)))
    setJustBought(item.id)
    setTimeout(() => setJustBought(null), 2000)
  }

  const filteredItems = filter === 'all' ? SHOP_ITEMS : SHOP_ITEMS.filter((i) => i.type === filter)

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'Всі' },
    { value: 'badge', label: 'Значки' },
    { value: 'decoration', label: 'Декорації' },
    { value: 'boost', label: 'Бустери' },
    { value: 'icon_pack', label: 'Іконки' },
  ]

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Магазин</h1>

      {/* XP баланс */}
      <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-violet-200 text-sm">Доступний XP</p>
            <p className="text-4xl font-bold mt-0.5">{availableXp.toLocaleString()}</p>
            <p className="text-violet-300 text-xs mt-1">Всього зароблено: {xp.toLocaleString()} XP · Витрачено: {spentXp}</p>
          </div>
          <div className="text-5xl">💎</div>
        </div>
        <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all"
            style={{ width: `${xp > 0 ? Math.min(100, (availableXp / xp) * 100) : 0}%` }}
          />
        </div>
        {purchasedIds.size > 0 && (
          <p className="text-xs text-violet-200 mt-2">{purchasedIds.size} предмет{purchasedIds.size === 1 ? '' : 'ів'} у колекції</p>
        )}
      </div>

      {/* Фільтри */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
              filter === f.value
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Предмети */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredItems.map((item) => {
          const owned = purchasedIds.has(item.id)
          const canAfford = availableXp >= item.priceXp
          const isJustBought = justBought === item.id

          return (
            <div
              key={item.id}
              className={cn(
                'bg-white dark:bg-gray-800 border rounded-2xl p-4 shadow-sm transition-all',
                owned
                  ? 'border-violet-200 dark:border-violet-700'
                  : 'border-gray-100 dark:border-gray-700',
                isJustBought && 'scale-[1.02] border-green-300 dark:border-green-600'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'text-2xl w-12 h-12 flex items-center justify-center rounded-xl flex-shrink-0',
                  owned ? 'bg-violet-50 dark:bg-violet-900/30' : 'bg-gray-50 dark:bg-gray-700'
                )}>
                  {item.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{item.name}</p>
                    {owned && <Check className="w-3.5 h-3.5 text-green-500" />}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                  <span className={cn('inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium', TYPE_COLORS[item.type])}>
                    {TYPE_LABELS[item.type]}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1 text-violet-600 dark:text-violet-400 font-bold text-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  {item.priceXp} XP
                </div>
                {owned ? (
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    В колекції
                  </span>
                ) : canAfford ? (
                  <button
                    onClick={() => buyItem(item)}
                    className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs px-3 py-2 rounded-xl font-medium transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Придбати
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 text-xs">
                    <Lock className="w-3.5 h-3.5" />
                    Не вистачає {item.priceXp - availableXp} XP
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-2">
          <Tag className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Про магазин</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Витрачай зароблений XP на косметичні предмети. Значки та декорації — суто для вигляду і мотивації.
              Бустери дають тимчасові переваги. Паки іконок розширюють вибір при створенні звичок.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
