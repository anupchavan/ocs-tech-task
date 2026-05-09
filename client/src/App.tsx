import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './stores/AuthContext'

import AppLayout from './components/Layout/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'

import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import BookRoomPage from './pages/BookRoomPage'
import MyBookingsPage from './pages/MyBookingsPage'
import AllBookingsPage from './pages/admin/AllBookingsPage'
import RoomsPage from './pages/admin/RoomsPage'
import UsersPage from './pages/admin/UsersPage'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/book" element={
          <ProtectedRoute>
            {user?.role === 'viewer'
              ? <Navigate to="/" replace />
              : <BookRoomPage />}
          </ProtectedRoute>
        } />
        <Route path="/my-bookings" element={<MyBookingsPage />} />

        {/* Admin routes */}
        <Route path="/admin/bookings" element={
          <ProtectedRoute adminOnly><AllBookingsPage /></ProtectedRoute>
        } />
        <Route path="/admin/rooms" element={
          <ProtectedRoute adminOnly><RoomsPage /></ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute adminOnly><UsersPage /></ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
