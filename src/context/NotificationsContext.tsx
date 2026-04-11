import { createContext, useContext } from 'react'
import { useHabits } from '@/hooks/useHabits'
import { useNotifications } from '@/hooks/useNotifications'

interface NotificationsContextType {
  permission: 'default' | 'granted' | 'denied'
  requestPermission: () => Promise<boolean>
  sendTestNotification: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType>({
  permission: 'default',
  requestPermission: async () => false,
  sendTestNotification: async () => {},
})

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { habits } = useHabits()
  const value = useNotifications(habits)

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotificationsContext() {
  return useContext(NotificationsContext)
}
