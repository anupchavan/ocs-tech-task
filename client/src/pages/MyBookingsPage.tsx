import { useEffect, useState } from 'react'
import { useApi } from '../hooks/useApi'
import { PurposeBadge, StatusBadge } from '../components/ui/Badge'
import { ConfirmModal } from '../components/ui/Modal'
import { Dropdown } from '../components/ui/Dropdown'
import { useAuth } from '../stores/AuthContext'

const STATUS_OPTIONS = [
  { value: 'all',       label: 'All Status' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
]

interface Booking {
  _id: string
  date: string
  startTime: string
  endTime: string
  purpose: string
  participants: number
  status: string
  notes: string
  room: { _id: string; block: string; roomName: string; capacity: number }
  bookedBy: { name: string; email: string }
}

export default function MyBookingsPage() {
  const { user } = useAuth()
  const api = useApi()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [toCancel, setToCancel] = useState<Booking | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const isAdmin = user?.role === 'admin'

  const load = async () => {
    try {
      const data = await api.get<Booking[]>('/bookings')
      setBookings(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCancel = async () => {
    if (!toCancel) return
    setCancelling(true)
    try {
      await api.del(`/bookings/${toCancel._id}`)
      setBookings((prev) => prev.map((b) => b._id === toCancel._id ? { ...b, status: 'cancelled' } : b))
      setToCancel(null)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setCancelling(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  const filtered = bookings.filter((b) => statusFilter === 'all' || b.status === statusFilter)

  const canCancel = (b: Booking) =>
    b.status === 'confirmed' && (isAdmin || (b.date >= today))

  if (loading) return <div className="loading-center"><div className="spinner" /><span>Loading bookings…</span></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">{isAdmin ? 'All Bookings' : 'My Bookings'}</div>
          <div className="page-subtitle">{filtered.length} booking{filtered.length !== 1 ? 's' : ''} shown</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <Dropdown
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS}
          triggerWidth={160}
          panelMinWidth={180}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg>
            </div>
          <div className="empty-state-title">No bookings found</div>
          <div className="empty-state-sub">
            {statusFilter === 'all' ? "You haven't made any bookings yet" : `No ${statusFilter} bookings`}
          </div>
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
                <th>Participants</th>
                <th>Status</th>
                {isAdmin && <th>Booked By</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b._id}>
                  <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {new Date(b.date + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {b.date === today && <span className="badge badge-cyan" style={{ marginLeft: 6 }}>Today</span>}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.room.roomName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.room.block} Block</div>
                  </td>
                  <td><span className="time-chip">{b.startTime} – {b.endTime}</span></td>
                  <td><PurposeBadge purpose={b.purpose} /></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{b.participants} / {b.room.capacity}</td>
                  <td><StatusBadge status={b.status} /></td>
                  {isAdmin && (
                    <td>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{b.bookedBy?.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{b.bookedBy?.email}</div>
                    </td>
                  )}
                  <td>
                    <div className="table-actions">
                      {canCancel(b) && (
                        <button className="btn btn-danger btn-sm" onClick={() => setToCancel(b)}>
                          Cancel
                        </button>
                      )}
                      {!canCancel(b) && b.status === 'confirmed' && (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Past</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={!!toCancel}
        onClose={() => setToCancel(null)}
        onConfirm={handleCancel}
        title="Cancel Booking"
        message={toCancel ? `Cancel booking for ${toCancel.room.roomName} on ${toCancel.date} (${toCancel.startTime}–${toCancel.endTime})?` : ''}
        confirmLabel="Yes, Cancel"
        danger
        loading={cancelling}
      />
    </div>
  )
}
