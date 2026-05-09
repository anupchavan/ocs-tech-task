import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../stores/AuthContext'
import { useApi } from '../hooks/useApi'
import { PurposeBadge, StatusBadge } from '../components/ui/Badge'

interface Booking {
  _id: string
  date: string
  startTime: string
  endTime: string
  purpose: string
  participants: number
  status: string
  room: { block: string; roomName: string; capacity: number }
  bookedBy: { name: string; email: string }
}

interface Stats {
  total: number
  upcoming: number
  todayCount: number
  cancelled: number
  purposeStats: { _id: string; count: number }[]
}

export default function DashboardPage() {
  const { user } = useAuth()
  const api = useApi()
  const [upcoming, setUpcoming] = useState<Booking[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookData, statsData] = await Promise.all([
          api.get<Booking[]>(`/bookings?upcoming=true`),
          isAdmin ? api.get<Stats>('/bookings/stats') : Promise.resolve(null),
        ])
        setUpcoming(bookData.slice(0, 8))
        if (statsData) setStats(statsData)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [isAdmin])

  const today = new Date().toISOString().split('T')[0]
  const todayBookings = upcoming.filter((b) => b.date === today)

  if (loading) return <div className="loading-center"><div className="spinner" /><span>Loading…</span></div>

  return (
    <div>
      {/* Greeting */}
      <div className="page-header">
        <div>
          <div className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</div>
          <div className="page-subtitle">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <Link to="/book" className="btn btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Book a Room
        </Link>
      </div>

      {/* Admin stats */}
      {isAdmin && stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon stat-icon-cyan">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Bookings</div>
            <div className="stat-sub">All time confirmed</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-green">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </div>
            <div className="stat-value">{stats.upcoming}</div>
            <div className="stat-label">Upcoming</div>
            <div className="stat-sub">Confirmed ahead</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-amber">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <div className="stat-value">{stats.todayCount}</div>
            <div className="stat-label">Today</div>
            <div className="stat-sub">Bookings today</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-rose">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <div className="stat-value">{stats.cancelled}</div>
            <div className="stat-label">Cancelled</div>
            <div className="stat-sub">All time</div>
          </div>
        </div>
      )}

      {/* Today's bookings */}
      {todayBookings.length > 0 && (
        <div className="card mb-3">
          <div className="card-header">
            <div>
              <div className="card-title">Today's Bookings</div>
              <div className="card-subtitle">{todayBookings.length} room{todayBookings.length !== 1 ? 's' : ''} booked today</div>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Time</th>
                  <th>Purpose</th>
                  <th>Participants</th>
                  {isAdmin && <th>Booked By</th>}
                </tr>
              </thead>
              <tbody>
                {todayBookings.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.room.roomName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.room.block} Block</div>
                    </td>
                    <td>
                      <span className="time-chip">{b.startTime} – {b.endTime}</span>
                    </td>
                    <td><PurposeBadge purpose={b.purpose} /></td>
                    <td>{b.participants} / {b.room.capacity}</td>
                    {isAdmin && <td style={{ color: 'var(--text-muted)' }}>{b.bookedBy?.name}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upcoming bookings */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Upcoming Bookings</div>
            <div className="card-subtitle">{isAdmin ? 'All confirmed bookings' : 'Your confirmed bookings'}</div>
          </div>
          <Link to="/my-bookings" className="btn btn-secondary btn-sm">View All</Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div className="empty-state-title">No upcoming bookings</div>
            <div className="empty-state-sub">Book a room to get started</div>
            <Link to="/book" className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }}>Book Now</Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Room</th>
                  <th>Time</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  {isAdmin && <th>Booked By</th>}
                </tr>
              </thead>
              <tbody>
                {upcoming.map((b) => (
                  <tr key={b._id}>
                    <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                      {new Date(b.date + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.room.roomName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.room.block} Block · Cap {b.room.capacity}</div>
                    </td>
                    <td><span className="time-chip">{b.startTime} – {b.endTime}</span></td>
                    <td><PurposeBadge purpose={b.purpose} /></td>
                    <td><StatusBadge status={b.status} /></td>
                    {isAdmin && <td style={{ color: 'var(--text-muted)' }}>{b.bookedBy?.name}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
