import { useState, useEffect, useCallback } from 'react'
import { format, addDays } from 'date-fns'
import { useAuth } from '@/context/AuthContext'
import { fetchTasks, createTask, toggleTask, deleteTask, fetchCompletedTasksXP } from '@/lib/supabase'
import type { Task, TaskDifficulty } from '@/types'

export const TASK_XP: Record<TaskDifficulty, number> = {
  easy: 10,
  medium: 25,
  hard: 50,
}

export const TASK_LABELS: Record<TaskDifficulty, string> = {
  easy: 'Легке',
  medium: 'Середнє',
  hard: 'Важке',
}

export function useTasks() {
  const { user } = useAuth()
  const today = format(new Date(), 'yyyy-MM-dd')
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  const [tasks, setTasks] = useState<Task[]>([])
  const [tomorrowTasks, setTomorrowTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [allTimeXP, setAllTimeXP] = useState(0)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([
      fetchTasks(user.id, today),
      fetchTasks(user.id, tomorrow),
      fetchCompletedTasksXP(user.id),
    ]).then(([todayTasks, tomorrowList, xp]) => {
      setTasks(todayTasks)
      setTomorrowTasks(tomorrowList)
      setAllTimeXP(xp)
    }).finally(() => setLoading(false))
  }, [user, today, tomorrow])

  const addTask = useCallback(async (title: string, difficulty: TaskDifficulty, date: 'today' | 'tomorrow' = 'today') => {
    if (!user) return
    const xp_reward = TASK_XP[difficulty]
    const taskDate = date === 'tomorrow' ? tomorrow : today
    const task = await createTask({ user_id: user.id, title, difficulty, date: taskDate, xp_reward, completed: false })
    if (date === 'tomorrow') {
      setTomorrowTasks((prev) => [...prev, task])
    } else {
      setTasks((prev) => [...prev, task])
    }
  }, [user, today, tomorrow])

  const completeTask = useCallback(async (taskId: string, completed: boolean) => {
    const task = [...tasks, ...tomorrowTasks].find((t) => t.id === taskId)
    if (!task) return
    await toggleTask(taskId, completed)
    const update = (prev: Task[]) => prev.map((t) => t.id === taskId ? { ...t, completed } : t)
    setTasks(update)
    setTomorrowTasks(update)
    setAllTimeXP((prev) => completed ? prev + task.xp_reward : prev - task.xp_reward)
  }, [tasks, tomorrowTasks])

  const removeTask = useCallback(async (taskId: string) => {
    const task = [...tasks, ...tomorrowTasks].find((t) => t.id === taskId)
    if (!task) return
    await deleteTask(taskId)
    const filter = (prev: Task[]) => prev.filter((t) => t.id !== taskId)
    setTasks(filter)
    setTomorrowTasks(filter)
    if (task.completed) setAllTimeXP((prev) => prev - task.xp_reward)
  }, [tasks, tomorrowTasks])

  return { tasks, tomorrowTasks, loading, addTask, completeTask, removeTask, allTimeXP }
}
