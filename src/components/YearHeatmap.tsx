import { format, eachDayOfInterval, subDays, getDay, startOfWeek } from 'date-fns'
import { uk } from 'date-fns/locale'

interface Props {
  logs: { date: string; value: number }[]
  color: string
}

const MONTHS = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру']
const DAYS = ['Пн', '', 'Ср', '', 'Пт', '', '']

export default function YearHeatmap({ logs, color }: Props) {
  const today = new Date()
  const from = subDays(today, 364)

  // Pad to start of week (Monday)
  const startDay = startOfWeek(from, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: startDay, end: today })

  const logMap = new Map(logs.map((l) => [l.date, l.value]))

  // Group by weeks
  const weeks: { date: Date; value: number; inRange: boolean }[][] = []
  let week: { date: Date; value: number; inRange: boolean }[] = []

  days.forEach((day, i) => {
    const dayOfWeek = (getDay(day) + 6) % 7 // Mon=0
    if (i === 0) {
      // Fill empty days at start
      for (let j = 0; j < dayOfWeek; j++) {
        week.push({ date: day, value: -1, inRange: false })
      }
    }
    const dateStr = format(day, 'yyyy-MM-dd')
    const value = logMap.get(dateStr) ?? 0
    const inRange = day >= from
    week.push({ date: day, value, inRange })

    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  })
  if (week.length > 0) {
    while (week.length < 7) week.push({ date: today, value: -1, inRange: false })
    weeks.push(week)
  }

  // Month labels
  const monthLabels: { label: string; col: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, col) => {
    const firstValid = week.find((d) => d.inRange)
    if (firstValid) {
      const month = firstValid.date.getMonth()
      if (month !== lastMonth) {
        monthLabels.push({ label: MONTHS[month], col })
        lastMonth = month
      }
    }
  })

  const total = logs.filter((l) => l.value > 0).length

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">{total} виконань за рік</span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400 dark:text-gray-500">менше</span>
          {[0, 0.25, 0.5, 0.75, 1].map((opacity, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: opacity === 0 ? '#f3f4f6' : color, opacity: opacity === 0 ? 1 : 0.3 + opacity * 0.7 }}
            />
          ))}
          <span className="text-xs text-gray-400 dark:text-gray-500">більше</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-0.5 min-w-0">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 mr-1">
            <div className="h-4" /> {/* month label space */}
            {DAYS.map((d, i) => (
              <div key={i} className="h-3 flex items-center">
                <span className="text-[9px] text-gray-400 dark:text-gray-500 w-4 text-right">{d}</span>
              </div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, col) => {
            const monthLabel = monthLabels.find((m) => m.col === col)
            return (
              <div key={col} className="flex flex-col gap-0.5">
                <div className="h-4 flex items-center">
                  {monthLabel && (
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 whitespace-nowrap">{monthLabel.label}</span>
                  )}
                </div>
                {week.map((day, row) => {
                  if (!day.inRange || day.value === -1) {
                    return <div key={row} className="w-3 h-3 rounded-sm" />
                  }
                  const done = day.value > 0
                  return (
                    <div
                      key={row}
                      className="w-3 h-3 rounded-sm transition-all"
                      style={{
                        backgroundColor: done ? color : undefined,
                        opacity: done ? 0.85 : undefined,
                      }}
                      title={`${format(day.date, 'd MMM', { locale: uk })}: ${done ? 'Виконано' : 'Не виконано'}`}
                      {...(!done && { className: 'w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-700' })}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
