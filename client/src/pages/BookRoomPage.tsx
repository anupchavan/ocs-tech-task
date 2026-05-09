import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { PurposeBadge } from '../components/ui/Badge'
import { Dropdown } from '../components/ui/Dropdown'

const PURPOSES = [
  { value: 'OA',        label: 'Online Assessment (OA)' },
  { value: 'Interview', label: 'Interview' },
  { value: 'PPT',       label: 'Pre-Placement Talk (PPT)' },
]

interface Room {
  _id: string
  block: string
  roomName: string
  capacity: number
  isAvailable: boolean
  allowedPurposes: string[]
  notes: string
}

const today = () => new Date().toISOString().split('T')[0]

export default function BookRoomPage() {
  const api = useApi()
  const navigate = useNavigate()

  // Step 1: criteria
  const [date, setDate] = useState(today())
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [purpose, setPurpose] = useState('OA')
  const [participants, setParticipants] = useState(30)
  const [block, setBlock] = useState('')

  // Step 2: room selection
  const [rooms, setRooms] = useState<Room[]>([])
  const [blocks, setBlocks] = useState<string[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [searchDone, setSearchDone] = useState(false)
  const [searching, setSearching] = useState(false)

  // Step 3: confirm
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Load blocks
  useEffect(() => {
    api.get<string[]>('/rooms/blocks').then(setBlocks).catch(console.error)
  }, [])

  const searchRooms = useCallback(async () => {
    if (!date || !startTime || !endTime || !purpose || !participants) return
    if (endTime <= startTime) { alert('End time must be after start time'); return }
    setSearching(true)
    setSelectedRoom(null)
    try {
      const params = new URLSearchParams({
        date, startTime, endTime, purpose,
        minCapacity: String(participants),
        ...(block ? { block } : {}),
      })
      const data = await api.get<Room[]>(`/rooms?${params}`)
      setRooms(data.filter((r) => r.isAvailable))
      setSearchDone(true)
      setStep(2)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSearching(false)
    }
  }, [date, startTime, endTime, purpose, participants, block])

  const handleSubmit = async () => {
    if (!selectedRoom) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await api.post('/bookings', {
        roomId: selectedRoom._id,
        date, startTime, endTime, purpose, participants, notes,
      })
      navigate('/my-bookings')
    } catch (e: any) {
      setSubmitError(e.message)
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      {/* Wizard steps */}
      <div className="wizard-steps">
        <div className={`wizard-step ${step >= 1 ? (step > 1 ? 'done' : 'active') : ''}`}>
          <div className="wizard-step-num">{step > 1 ? '✓' : '1'}</div>
          <span className="wizard-step-label">Requirements</span>
        </div>
        <div className={`wizard-line ${step > 1 ? 'done' : ''}`} />
        <div className={`wizard-step ${step >= 2 ? (step > 2 ? 'done' : 'active') : ''}`}>
          <div className="wizard-step-num">{step > 2 ? '✓' : '2'}</div>
          <span className="wizard-step-label">Select Room</span>
        </div>
        <div className={`wizard-line ${step > 2 ? 'done' : ''}`} />
        <div className={`wizard-step ${step >= 3 ? 'active' : ''}`}>
          <div className="wizard-step-num">3</div>
          <span className="wizard-step-label">Confirm</span>
        </div>
      </div>

      {/* ── Step 1: Requirements ── */}
      {step === 1 && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Booking Requirements</div>
              <div className="card-subtitle">Fill in the details to find available rooms</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div className="form-row cols-2">
              <div className="input-group">
                <label className="form-label">Purpose *</label>
                <Dropdown
                  className="full-width"
                  value={purpose}
                  onChange={setPurpose}
                  options={PURPOSES}
                  panelMinWidth={240}
                />
              </div>
              <div className="input-group">
                <label className="form-label">Expected Participants *</label>
                <input type="number" className="input" min={1} max={2000} value={participants}
                  onChange={(e) => setParticipants(Number(e.target.value))} />
                <span className="form-hint">Room capacity ≥ this number</span>
              </div>
            </div>

            <div className="form-row cols-3">
              <div className="input-group">
                <label className="form-label">Date *</label>
                <input type="date" className="input" value={date} min={today()}
                  onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="form-label">Start Time *</label>
                <input type="time" className="input" value={startTime}
                  onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="form-label">End Time *</label>
                <input type="time" className="input" value={endTime}
                  onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>

            <div className="input-group" style={{ maxWidth: 280 }}>
              <label className="form-label">Preferred Block (optional)</label>
              <Dropdown
                className="full-width"
                value={block}
                onChange={setBlock}
                options={[{ value: '', label: 'Any Block' }, ...blocks.map((b) => ({ value: b, label: `${b} Block` }))]}
                placeholder="Any Block"
                searchPlaceholder="Search blocks…"
                panelMinWidth={200}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-primary" onClick={searchRooms} disabled={searching}>
                {searching ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Searching…</> : 'Search Available Rooms →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Room Selection ── */}
      {step === 2 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {rooms.length} room{rooms.length !== 1 ? 's' : ''} available
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                {date} · {startTime}–{endTime} · {participants} participants · <PurposeBadge purpose={purpose} />
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => { setStep(1); setSearchDone(false) }}>← Edit</button>
          </div>

          {rooms.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              </div>
              <div className="empty-state-title">No rooms available</div>
              <div className="empty-state-sub">Try a different time slot, block, or reduce participant count</div>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }} onClick={() => setStep(1)}>← Modify Search</button>
            </div>
          ) : (
            <div className="rooms-grid">
              {rooms.map((room) => (
                <div
                  key={room._id}
                  className={`room-card${selectedRoom?._id === room._id ? ' selected' : ''}`}
                  onClick={() => setSelectedRoom(room)}
                >
                  <div className="room-card-header">
                    <div>
                      <div className="room-card-name">{room.roomName}</div>
                      <div className="room-card-block">{room.block} Block</div>
                    </div>
                    {selectedRoom?._id === room._id && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--primary)" stroke="none">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-4-4 1.41-1.41L10 13.67l6.59-6.59L18 8.5l-8 8z"/>
                      </svg>
                    )}
                  </div>
                  <div className="room-card-cap">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span>Capacity: </span><span className="room-card-cap-num">{room.capacity}</span>
                  </div>
                  {room.notes && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.4 }}>
                      {room.notes}
                    </div>
                  )}
                  {room.allowedPurposes.length > 0 && (
                    <div className="room-card-footer">
                      {room.allowedPurposes.map((p) => <PurposeBadge key={p} purpose={p} />)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {selectedRoom && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button className="btn btn-primary" onClick={() => setStep(3)}>
                Continue with {selectedRoom.roomName} →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Confirm ── */}
      {step === 3 && selectedRoom && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Confirm Booking</div>
              <div className="card-subtitle">Review the details and confirm</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setStep(2)}>← Back</button>
          </div>

          {/* Summary table */}
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              {[
                ['Room', selectedRoom.roomName],
                ['Block', `${selectedRoom.block} Block`],
                ['Date', new Date(date + 'T00:00').toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })],
                ['Time', `${startTime} – ${endTime}`],
                ['Purpose', purpose],
                ['Participants', `${participants} of ${selectedRoom.capacity}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{k}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Notes (optional)</label>
            <textarea
              className="input" rows={3}
              placeholder="Any additional information for this booking…"
              value={notes} onChange={(e) => setNotes(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {submitError && (
            <div className="auth-error" style={{ marginBottom: '1rem' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {submitError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/my-bookings')} disabled={submitting}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Booking…</> : '✓ Confirm Booking'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
