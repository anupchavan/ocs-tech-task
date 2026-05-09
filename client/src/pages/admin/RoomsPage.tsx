import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { Modal, ConfirmModal } from '../../components/ui/Modal'
import { Dropdown } from '../../components/ui/Dropdown'

interface Room {
  _id: string
  block: string
  roomName: string
  capacity: number
  isAvailable: boolean
  allowedPurposes: string[]
  notes: string
}

const PURPOSES = ['OA', 'Interview', 'PPT']
const BLOCKS = ['A', 'B', 'C', 'CSE', 'LHC', 'BT/BM', 'CY', 'EE', 'MA', 'MSME', 'PH', 'Other']

export default function RoomsPage() {
  const api = useApi()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [blockFilter, setBlockFilter] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Room | null>(null)
  const [form, setForm] = useState({
    block: 'A', roomName: '', capacity: 60,
    isAvailable: true, allowedPurposes: [] as string[], notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [toDelete, setToDelete] = useState<Room | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    try { setRooms(await api.get<Room[]>('/rooms')) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const blocks = [...new Set(rooms.map((r) => r.block))].sort()

  const openCreate = () => {
    setEditing(null)
    setForm({ block: 'A', roomName: '', capacity: 60, isAvailable: true, allowedPurposes: [], notes: '' })
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (r: Room) => {
    setEditing(r)
    setForm({ block: r.block, roomName: r.roomName, capacity: r.capacity, isAvailable: r.isAvailable, allowedPurposes: r.allowedPurposes, notes: r.notes })
    setFormError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.block || !form.roomName || !form.capacity) { setFormError('Block, room name, and capacity are required'); return }
    setSaving(true); setFormError('')
    try {
      if (editing) {
        const updated = await api.put<Room>(`/rooms/${editing._id}`, form)
        setRooms((prev) => prev.map((r) => r._id === updated._id ? updated : r))
      } else {
        const created = await api.post<Room>('/rooms', form)
        setRooms((prev) => [...prev, created])
      }
      setModalOpen(false)
    } catch (e: any) { setFormError(e.message) }
    finally { setSaving(false) }
  }

  const toggleAvailable = async (r: Room) => {
    try {
      const updated = await api.put<Room>(`/rooms/${r._id}`, { isAvailable: !r.isAvailable })
      setRooms((prev) => prev.map((x) => x._id === updated._id ? updated : x))
    } catch (e: any) { alert(e.message) }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.del(`/rooms/${toDelete._id}`)
      setRooms((prev) => prev.filter((r) => r._id !== toDelete._id))
      setToDelete(null)
    } catch (e: any) { alert(e.message) }
    finally { setDeleting(false) }
  }

  const togglePurpose = (p: string) => {
    setForm((f) => ({
      ...f,
      allowedPurposes: f.allowedPurposes.includes(p)
        ? f.allowedPurposes.filter((x) => x !== p)
        : [...f.allowedPurposes, p],
    }))
  }

  const filtered = rooms.filter((r) =>
    (blockFilter === '' || r.block === blockFilter) &&
    (r.roomName.toLowerCase().includes(search.toLowerCase()) ||
      r.block.toLowerCase().includes(search.toLowerCase()))
  )

  if (loading) return <div className="loading-center"><div className="spinner" /><span>Loading rooms…</span></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Manage Rooms</div>
          <div className="page-subtitle">{rooms.length} rooms across {blocks.length} blocks</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Room
        </button>
      </div>

      <div className="filter-bar">
        <div className="input-with-icon" style={{ flex: 1, maxWidth: 300 }}>
          <span className="input-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input className="input has-icon" placeholder="Search rooms…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Dropdown
          value={blockFilter}
          onChange={setBlockFilter}
          options={[{ value: '', label: 'All Blocks' }, ...blocks.map((b) => ({ value: b, label: `${b} Block` }))]}
          triggerWidth={160}
          panelMinWidth={180}
          searchPlaceholder="Search blocks…"
        />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Block</th>
              <th>Room Name</th>
              <th>Capacity</th>
              <th>Allowed Purposes</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r._id}>
                <td><span className="badge badge-neutral">{r.block}</span></td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.roomName}</td>
                <td style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{r.capacity}</td>
                <td>
                  {r.allowedPurposes.length === 0
                    ? <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>All purposes</span>
                    : r.allowedPurposes.map((p) => (
                        <span key={p} className={`badge badge-${p}`} style={{ marginRight: 4 }}>{p}</span>
                      ))
                  }
                </td>
                <td>
                  <span className={`badge ${r.isAvailable ? 'badge-green' : 'badge-rose'}`}>
                    {r.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </td>
                <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: 12 }}>
                  {r.notes || '—'}
                </td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>Edit</button>
                    <button className={`btn ${r.isAvailable ? 'btn-secondary' : 'btn-outline-primary'} btn-sm`} onClick={() => toggleAvailable(r)}>
                      {r.isAvailable ? 'Disable' : 'Enable'}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => setToDelete(r)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7}><div className="empty-state" style={{ padding: '2rem' }}>No rooms match your search</div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Room' : 'Add Room'}
        subtitle={editing ? `Editing ${editing.roomName}` : 'Add a new room to the system'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : (editing ? 'Save Changes' : 'Add Room')}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {formError && (
            <div className="auth-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {formError}
            </div>
          )}

          <div className="form-row cols-2">
            <div className="input-group">
              <label className="form-label">Block *</label>
              <Dropdown
                className="full-width"
                value={form.block}
                onChange={(v) => setForm((f) => ({ ...f, block: v }))}
                options={BLOCKS.map((b) => ({ value: b, label: b }))}
                panelMinWidth={180}
                searchPlaceholder="Search blocks…"
              />
            </div>
            <div className="input-group">
              <label className="form-label">Room Name / Number *</label>
              <input className="input" value={form.roomName} onChange={(e) => setForm((f) => ({ ...f, roomName: e.target.value }))} placeholder="e.g. LHC-05" />
            </div>
          </div>

          <div className="input-group" style={{ maxWidth: 200 }}>
            <label className="form-label">Seating Capacity *</label>
            <input type="number" className="input" min={1} value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))} />
          </div>

          <div className="input-group">
            <label className="form-label">Allowed Purposes</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 4 }}>
              {PURPOSES.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`btn btn-sm ${form.allowedPurposes.includes(p) ? 'btn-outline-primary' : 'btn-secondary'}`}
                  onClick={() => togglePurpose(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <span className="form-hint">Leave all unchecked to allow all purposes</span>
          </div>

          <div className="input-group">
            <label className="form-label">Notes / Special Constraints</label>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional notes about this room…" style={{ resize: 'vertical' }} />
          </div>

          <div className="toggle-row">
            <div>
              <div className="toggle-label">Available for Booking</div>
              <div className="toggle-sub">Toggle off to temporarily disable this room</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))} />
              <span className="toggle-track" />
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Room"
        message={`Delete ${toDelete?.roomName} from ${toDelete?.block} Block? Existing bookings will not be removed.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  )
}
