import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
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
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [allTimeXP, setAllTimeXP] = useState(0)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([
      fetchTasks(user.id, today),
      fetchCompletedTasksXP(user.id),
    ]).then(([todayTasks, xp]) => {
      setTasks(todayTasks)
      setAllTimeXP(xp)
    }).finally(() => setLoading(false))
  }, [user, today])

  const addTask = useCallback(async (title: string, difficulty: TaskDifficulty) => {
    if (!user) return
    const xp_reward = TASK_XP[difficulty]
    const task = await createTask({ user_id: user.id, title, difficulty, date: today, xp_reward, completed: false })
    setTasks((prev) => [...prev, task])
  }, [user, today])

  const completeTask = useCallback(async (taskId: string, completed: boolean) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    await toggleTask(taskId, completed)
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, completed } : t))
    setAllTimeXP((prev) => completed ? prev + task.xp_reward : prev - task.xp_reward)
  }, [tasks])

  const removeTask = useCallback(async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    await deleteTask(taskId)
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    if (task.completed) setAllTimeXP((prev) => prev - task.xp_reward)
  }, [tasks])

  return { tasks, loading, addTask, completeTask, removeTask, allTimeXP }
}
