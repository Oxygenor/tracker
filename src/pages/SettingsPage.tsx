import { Bell, BellOff, BellRing, LogOut, User, ChevronRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useNotificationsContext } from '@/context/NotificationsContext'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { permission, requestPermission, sendTestNotification } = useNotificationsContext()

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? 'Користувач'
  const avatarLetter = displayName.charAt(0).toUpperCase()

  return (
    <div className="p-4 sm:p-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Налаштування</h1>

      {/* Profile */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Профіль</h2>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                className="w-12 h-12 rounded-full object-cover"
                alt="avatar"
              />
            ) : (
              <span className="text-violet-700 font-bold text-lg">{avatarLetter}</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{displayName}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          <User className="w-4 h-4 text-gray-300 ml-auto" />
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Сповіщення</h2>

        <div className="space-y-3">
          {/* Status */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
            <div className="flex items-center gap-3">
              {permission === 'granted' ? (
                <Bell className="w-5 h-5 text-green-500" />
              ) : permission === 'denied' ? (
                <BellOff className="w-5 h-5 text-red-400" />
              ) : (
                <Bell className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">Статус сповіщень</p>
                <p className={cn('text-xs mt-0.5', {
                  'text-green-600': permission === 'granted',
                  'text-red-500': permission === 'denied',
                  'text-gray-400': permission === 'default',
                })}>
                  {permission === 'granted' ? 'Увімкнено' : permission === 'denied' ? 'Заблоковано в браузері' : 'Не налаштовано'}
                </p>
              </div>
            </div>
            {permission === 'denied' && (
              <span className="text-xs text-gray-400 text-right max-w-[120px]">
                Дозволь у налаштуваннях браузера
              </span>
            )}
          </div>

          {/* Enable button */}
          {permission !== 'granted' && permission !== 'denied' && (
            <button
              onClick={requestPermission}
              className="w-full flex items-center justify-between px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5" />
                <span className="text-sm font-medium">Увімкнути нагадування</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>
          )}

          {/* Test button */}
          {permission === 'granted' && (
            <button
              onClick={sendTestNotification}
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <BellRing className="w-5 h-5 text-violet-500" />
                <span className="text-sm font-medium text-gray-700">Тестове сповіщення</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          )}
        </div>

        {permission === 'granted' && (
          <p className="text-xs text-gray-400 mt-3">
            Нагадування надсилаються у час, вказаний для кожної звички. Налаштуй час у розділі "Звички".
          </p>
        )}
      </div>

      {/* Sign out */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Вийти з акаунту</span>
        </button>
      </div>
    </div>
  )
}
