import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { NotificationsProvider } from '@/context/NotificationsContext'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import AuthCallbackPage from '@/pages/AuthCallbackPage'
import DashboardPage from '@/pages/DashboardPage'
import HabitsPage from '@/pages/HabitsPage'
import StatsPage from '@/pages/StatsPage'
import SettingsPage from '@/pages/SettingsPage'
import AchievementsPage from '@/pages/AchievementsPage'
import ChallengePage from '@/pages/ChallengePage'
import ShopPage from '@/pages/ShopPage'
import FocusPage from '@/pages/FocusPage'

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          <Route
            element={
              <ProtectedRoute>
                <NotificationsProvider>
                  <AppLayout />
                </NotificationsProvider>
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/habits" element={<HabitsPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/challenges" element={<ChallengePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/focus" element={<FocusPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  )
}
