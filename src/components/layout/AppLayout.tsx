import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, ListChecks, BarChart2, Settings, Flame, Trophy, Sword, ShoppingBag, Timer, Skull, Trees, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Сьогодні' },
  { to: '/habits', icon: ListChecks, label: 'Звички' },
  { to: '/stats', icon: BarChart2, label: 'Статистика' },
  { to: '/achievements', icon: Trophy, label: 'Досягнення' },
  { to: '/challenges', icon: Sword, label: 'Виклики' },
  { to: '/focus', icon: Timer, label: 'Фокус' },
  { to: '/forest', icon: Trees, label: 'Ліс' },
  { to: '/letters', icon: Mail, label: 'Листи' },
  { to: '/mori', icon: Skull, label: 'Memento Mori' },
  { to: '/shop', icon: ShoppingBag, label: 'Магазин' },
  { to: '/settings', icon: Settings, label: 'Налаштування' },
]

// Для мобільної навігації — лише найважливіші
const mobileNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Сьогодні' },
  { to: '/habits', icon: ListChecks, label: 'Звички' },
  { to: '/challenges', icon: Sword, label: 'Виклики' },
  { to: '/forest', icon: Trees, label: 'Ліс' },
  { to: '/stats', icon: BarChart2, label: 'Статистика' },
]

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Top header — mobile */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between md:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-gray-100">HabitFlow</span>
        </div>
        <div className="flex items-center gap-1">
          <NavLink to="/focus" className={({ isActive }) => cn('p-2 rounded-xl transition-colors', isActive ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300')}>
            <Timer className="w-4 h-4" />
          </NavLink>
          <NavLink to="/letters" className={({ isActive }) => cn('p-2 rounded-xl transition-colors', isActive ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300')}>
            <Mail className="w-4 h-4" />
          </NavLink>
          <NavLink to="/mori" className={({ isActive }) => cn('p-2 rounded-xl transition-colors', isActive ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300')}>
            <Skull className="w-4 h-4" />
          </NavLink>
          <NavLink to="/shop" className={({ isActive }) => cn('p-2 rounded-xl transition-colors', isActive ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300')}>
            <ShoppingBag className="w-4 h-4" />
          </NavLink>
          <NavLink to="/achievements" className={({ isActive }) => cn('p-2 rounded-xl transition-colors', isActive ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300')}>
            <Trophy className="w-4 h-4" />
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => cn('p-2 rounded-xl transition-colors', isActive ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300')}>
            <Settings className="w-4 h-4" />
          </NavLink>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar — desktop */}
        <aside className="hidden md:flex flex-col w-60 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-gray-100">HabitFlow</span>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  )
                }
              >
                <Icon className="w-5 h-5" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav — mobile (5 основних) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex">
        {mobileNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors',
                isActive ? 'text-violet-700 dark:text-violet-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              )
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
