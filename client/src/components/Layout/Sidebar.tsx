import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../stores/AuthContext'

interface NavItem {
  to: string
  label: string
  icon: JSX.Element
  end?: boolean
  adminOnly?: boolean
}

const CalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const BookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v6l4 2"/>
  </svg>
)
const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)
const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const DoorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18"/><rect x="7" y="3" width="10" height="18" rx="1"/>
    <circle cx="13.5" cy="12" r="0.5" fill="currentColor"/>
  </svg>
)
const AllBookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    <line x1="8" y1="14" x2="16" y2="14"/>
  </svg>
)
const LogoutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const navItems: NavItem[] = [
  { to: '/',           label: 'Dashboard',   icon: <HomeIcon />,    end: true },
  { to: '/book',       label: 'Book a Room', icon: <CalIcon /> },
  { to: '/my-bookings',label: 'My Bookings', icon: <ListIcon /> },
]

const adminItems: NavItem[] = [
  { to: '/admin/bookings', label: 'All Bookings', icon: <AllBookIcon />, adminOnly: true },
  { to: '/admin/rooms',    label: 'Manage Rooms', icon: <DoorIcon />,    adminOnly: true },
  { to: '/admin/users',    label: 'Manage Users', icon: <UsersIcon />,   adminOnly: true },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'
  const roleLabel = user?.role === 'admin' ? 'Administrator' : user?.role === 'core_member' ? 'Core Member' : 'Viewer'

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">OCS Rooms</span>
          <span className="sidebar-brand-sub">IIT Hyderabad</span>
        </div>
      </div>

      {/* Main nav */}
      <div className="sidebar-section-label">Navigation</div>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
        >
          <span className="sidebar-item-icon">{item.icon}</span>
          <span className="sidebar-item-label">{item.label}</span>
        </NavLink>
      ))}

      {/* Admin nav */}
      {user?.role === 'admin' && (
        <>
          <div className="sidebar-section-label" style={{ marginTop: '0.75rem' }}>Admin</div>
          {adminItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-label">{item.label}</span>
            </NavLink>
          ))}
        </>
      )}

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{roleLabel}</div>
          </div>
        </div>
        <button className="sidebar-item" onClick={handleLogout} style={{ color: 'var(--accent-rose)', marginTop: '0.25rem' }}>
          <span className="sidebar-item-icon"><LogoutIcon /></span>
          <span className="sidebar-item-label">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
