import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { PurposeBadge, StatusBadge } from '../../components/ui/Badge'
import { ConfirmModal } from '../../components/ui/Modal'
import { Dropdown } from '../../components/ui/Dropdown'

const STATUS_OPTIONS = [
  { value: 'all',       label: 'All Status' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const PURPOSE_OPTIONS = [
  { value: 'All',       label: 'All Purposes' },
  { value: 'OA',        label: 'Online Assessment (OA)' },
  { value: 'Interview', label: 'Interview' },
  { value: 'PPT',       label: 'Pre-Placement Talk (PPT)' },
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

const PURPOSES = ['All', 'OA', 'Interview', 'PPT']

export default function AllBookingsPage() {
  const api = useApi()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [purposeFilter, setPurposeFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('')
  const [search, setSearch] = useState('')
  const [toCancel, setToCancel] = useState<Booking | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const load = async () => {
    try { setBookings(await api.get<Booking[]>('/bookings')) }
    catch (e) { console.error(e) }
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
    } catch (e: any) { alert(e.message) }
    finally { setCancelling(false) }
  }

  const filtered = bookings.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false
    if (purposeFilter !== 'All' && b.purpose !== purposeFilter) return false
    if (dateFilter && b.date !== dateFilter) return false
    if (search) {
      const s = search.toLowerCase()
      return (
        b.room.roomName.toLowerCase().includes(s) ||
        b.room.block.toLowerCase().includes(s) ||
        b.bookedBy?.name.toLowerCase().includes(s) ||
        b.bookedBy?.email.toLowerCase().includes(s)
      )
    }
    return true
  })

  const today = new Date().toISOString().split('T')[0]

  if (loading) return <div className="loading-center"><div className="spinner" /><span>Loading bookings…</span></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">All Bookings</div>
          <div className="page-subtitle">{filtered.length} of {bookings.length} bookings shown</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <div className="input-with-icon" style={{ maxWidth: 260 }}>
          <span className="input-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input className="input has-icon" placeholder="Search room or user…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <input type="date" className="input" style={{ width: 170 }} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        <Dropdown
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS}
          triggerWidth={148}
          panelMinWidth={180}
        />
        <Dropdown
          value={purposeFilter}
          onChange={setPurposeFilter}
          options={PURPOSE_OPTIONS}
          triggerWidth={168}
          panelMinWidth={220}
        />
        {(search || dateFilter || statusFilter !== 'all' || purposeFilter !== 'All') && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setDateFilter(''); setStatusFilter('all'); setPurposeFilter('All') }}>
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg>
          </div>
          <div className="empty-state-title">No bookings match your filters</div>
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
                <th>Booked By</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b._id}>
                  <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {new Date(b.date + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {b.date === today && <span className="badge badge-cyan" style={{ marginLeft: 6 }}>Today</span>}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{b.room.roomName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.room.block} · Cap {b.room.capacity}</div>
                  </td>
                  <td><span className="time-chip">{b.startTime}–{b.endTime}</span></td>
                  <td><PurposeBadge purpose={b.purpose} /></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{b.participants}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{b.bookedBy?.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{b.bookedBy?.email}</div>
                  </td>
                  <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: 12 }}>
                    {b.notes || '—'}
                  </td>
                  <td>
                    {b.status === 'confirmed' && (
                      <button className="btn btn-danger btn-sm" onClick={() => setToCancel(b)}>Cancel</button>
                    )}
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
        message={toCancel ? `Admin cancel: ${toCancel.room.roomName} on ${toCancel.date} (${toCancel.startTime}–${toCancel.endTime}) booked by ${toCancel.bookedBy?.name}?` : ''}
        confirmLabel="Cancel Booking"
        danger
        loading={cancelling}
      />
    </div>
  )
}
