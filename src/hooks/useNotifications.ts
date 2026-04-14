import { useState, useEffect, useCallback, useRef } from 'react'
import type { Habit } from '@/types'

type Permission = 'default' | 'granted' | 'denied'

// Register service worker once
async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    return reg
  } catch {
    return null
  }
}

// Show notification — uses SW on mobile (required), fallback to Notification API on desktop
async function showNotification(title: string, body: string, tag: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const options: NotificationOptions = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag,
    data: { url: '/' },
  }

  if ('serviceWorker' in navigator) {
    try {
      const reg = await Promise.race<ServiceWorkerRegistration>([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('sw-timeout')), 3000)),
      ])
      await reg.showNotification(title, options)
      return
    } catch {
      // SW not available — fall through to Notification API
    }
  }

  new Notification(title, options)
}

export function useNotifications(habits: Habit[]) {
  const [permission, setPermission] = useState<Permission>(
    () => ('Notification' in window ? Notification.permission : 'denied')
  )
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Register SW on mount
  useEffect(() => { registerSW() }, [])

  async function requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false
    const result = await Notification.requestPermission()
    setPermission(result)
    return result === 'granted'
  }

  // Schedule reminders for habits that have reminder_time set
  const scheduleReminders = useCallback(() => {
    // Clear previous timers
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    if (permission !== 'granted') return

    const now = new Date()

    habits.forEach((habit) => {
      if (!habit.reminder_time) return
      const [hh, mm] = habit.reminder_time.split(':').map(Number)

      // Build target time for today
      const target = new Date(now)
      target.setHours(hh, mm, 0, 0)

      // If already passed today, skip
      if (target <= now) return

      const delay = target.getTime() - now.getTime()

      const timer = setTimeout(() => {
        showNotification(
          `${habit.icon} ${habit.name}`,
          habit.type === 'streak_free'
            ? `Ти тримаєшся! Продовжуй — не зривайся сьогодні.`
            : `Час виконати звичку "${habit.name}"! 💪`,
          `habit-${habit.id}`
        )
      }, delay)

      timersRef.current.push(timer)
    })
  }, [habits, permission])

  // Re-schedule when habits or permission changes
  useEffect(() => {
    scheduleReminders()
    return () => { timersRef.current.forEach(clearTimeout) }
  }, [scheduleReminders])

  // Test notification
  async function sendTestNotification() {
    await showNotification(
      '🔔 HabitFlow — тест',
      'Нагадування працюють! Так виглядатимуть твої сповіщення.',
      'test'
    )
  }

  return { permission, requestPermission, sendTestNotification }
}
