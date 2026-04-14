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

// Show notification via Notification API (with SW fallback for PWA)
async function showNotification(title: string, body: string, tag: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  // Try SW with a short timeout — don't block on it
  try {
    const reg = await Promise.race([
      navigator.serviceWorker?.getRegistration(),
      new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 500)),
    ])
    if (reg?.active) {
      reg.active.postMessage({ type: 'SHOW_NOTIFICATION', title, body, tag })
      return
    }
  } catch {
    // fall through
  }

  new Notification(title, { body, tag })
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
    console.log('[HabitFlow] sendTestNotification called')
    console.log('[HabitFlow] Notification in window:', 'Notification' in window)
    console.log('[HabitFlow] permission:', Notification.permission)

    if (!('Notification' in window)) {
      alert('Цей браузер не підтримує сповіщення')
      return
    }
    if (Notification.permission !== 'granted') {
      alert(`Дозвіл: ${Notification.permission}. Спочатку увімкни сповіщення.`)
      return
    }

    try {
      new Notification('🔔 HabitFlow — тест', {
        body: 'Нагадування працюють! Так виглядатимуть твої сповіщення.',
        tag: 'test',
      })
      console.log('[HabitFlow] Notification created')
    } catch (e) {
      console.error('[HabitFlow] Notification error:', e)
      alert(`Помилка: ${e}`)
    }
  }

  return { permission, requestPermission, sendTestNotification }
}
