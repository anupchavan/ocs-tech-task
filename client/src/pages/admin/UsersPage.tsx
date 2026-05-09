import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { Modal, ConfirmModal } from '../../components/ui/Modal'
import { Dropdown } from '../../components/ui/Dropdown'
import { useAuth } from '../../stores/AuthContext'

interface User {
  _id: string
  name: string
  email: string
  role: 'admin' | 'core_member' | 'viewer'
  isActive: boolean
  createdAt: string
}

const ROLES = [
  { value: 'admin',       label: 'Admin' },
  { value: 'core_member', label: 'Core Member' },
  { value: 'viewer',      label: 'Viewer (read-only)' },
]

const ROLE_BADGE: Record<string, string> = {
  admin:       'badge-rose',
  core_member: 'badge-cyan',
  viewer:      'badge-neutral',
}

const ROLE_LABEL: Record<string, string> = {
  admin:       'Admin',
  core_member: 'Core Member',
  viewer:      'Viewer',
}

export default function UsersPage() {
  const { user: me } = useAuth()
  const api = useApi()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Create / edit modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'core_member' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Toggle / delete
  const [toDelete, setToDelete] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    try { setUsers(await api.get<User[]>('/users')) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', email: '', password: '', role: 'core_member' })
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (u: User) => {
    setEditing(u)
    setForm({ name: u.name, email: u.email, password: '', role: u.role })
    setFormError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.email) { setFormError('Name and email are required'); return }
    if (!editing && !form.password) { setFormError('Password is required for new users'); return }
    setSaving(true)
    setFormError('')
    try {
      if (editing) {
        const body: Record<string, string> = { name: form.name, email: form.email, role: form.role }
        if (form.password) body.password = form.password
        const updated = await api.put<User>(`/users/${editing._id}`, body)
        setUsers((prev) => prev.map((u) => u._id === updated._id ? updated : u))
      } else {
        const created = await api.post<User>('/users', form)
        setUsers((prev) => [created, ...prev])
      }
      setModalOpen(false)
    } catch (e: any) {
      setFormError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (u: User) => {
    try {
      const updated = await api.put<User>(`/users/${u._id}`, { isActive: !u.isActive })
      setUsers((prev) => prev.map((x) => x._id === updated._id ? updated : x))
    } catch (e: any) { alert(e.message) }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.del(`/users/${toDelete._id}`)
      setUsers((prev) => prev.filter((u) => u._id !== toDelete._id))
      setToDelete(null)
    } catch (e: any) { alert(e.message) }
    finally { setDeleting(false) }
  }

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="loading-center"><div className="spinner" /><span>Loading users…</span></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Manage Users</div>
          <div className="page-subtitle">{users.length} user{users.length !== 1 ? 's' : ''} · Only admin can create accounts</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New User
        </button>
      </div>

      <div className="filter-bar">
        <div className="input-with-icon" style={{ flex: 1, maxWidth: 340 }}>
          <span className="input-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input className="input has-icon" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-muted)', border: '1px solid var(--primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</span>
                    {u._id === me?._id && <span className="badge badge-neutral" style={{ fontSize: 10 }}>You</span>}
                  </div>
                </td>
                <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                <td><span className={`badge ${ROLE_BADGE[u.role]}`}>{ROLE_LABEL[u.role]}</span></td>
                <td>
                  <span className={`badge ${u.isActive ? 'badge-green' : 'badge-neutral'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>
                  {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>Edit</button>
                    {u._id !== me?._id && (
                      <>
                        <button className={`btn ${u.isActive ? 'btn-secondary' : 'btn-outline-primary'} btn-sm`} onClick={() => handleToggleActive(u)}>
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setToDelete(u)}>Delete</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6}><div className="empty-state" style={{ padding: '2rem' }}>No users found</div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit User' : 'Create User'}
        subtitle={editing ? `Editing ${editing.name}` : 'Account will be created by admin'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : (editing ? 'Save Changes' : 'Create User')}
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
          <div className="input-group">
            <label className="form-label">Full Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name Surname" />
          </div>
          <div className="input-group">
            <label className="form-label">Email Address *</label>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="user@ocs.iith.ac.in" />
          </div>
          <div className="input-group">
            <label className="form-label">{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label>
            <input type="password" className="input" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
          </div>
          <div className="input-group">
            <label className="form-label">Role *</label>
            <Dropdown
              className="full-width"
              value={form.role}
              onChange={(v) => setForm((f) => ({ ...f, role: v }))}
              options={ROLES}
              panelMinWidth={260}
            />
            <span className="form-hint">Core members can book rooms. Viewers can only view.</span>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to permanently delete ${toDelete?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  )
}
