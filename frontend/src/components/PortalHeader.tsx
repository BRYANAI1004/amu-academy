import { Link, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { getAuthUser, logout } from '../lib/auth'

const DEMO_USER = {
  id: 'demo-user',
  name: 'AMU Learner',
  email: 'demo@amu.edu',
  role: 'learner',
}

interface PortalHeaderProps {
  subtitle?: string
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function PortalHeader({ subtitle }: PortalHeaderProps) {
  const navigate = useNavigate()
  const user = getAuthUser() ?? DEMO_USER

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="learn-header portal-header">
      <div className="learn-header-left">
        <Link to="/courses" className="portal-header-logo-link" aria-label="AMU Academy home">
          <img src="/AMULogo.png" alt="" className="portal-header-logo" />
          <span className="portal-header-brand">AMU Academy</span>
        </Link>
        {subtitle && (
          <>
            <div className="learn-header-divider" aria-hidden="true" />
            <p className="learn-course-title">{subtitle}</p>
          </>
        )}
      </div>

      <div className="learn-header-right">
        <div className="learn-user">
          <div className="learn-avatar" aria-hidden="true">
            {getInitials(user.name)}
          </div>
          <span className="learn-user-name">{user.name}</span>
        </div>
        <button type="button" className="btn btn-ghost btn-icon learn-logout" onClick={handleLogout}>
          <LogOut size={18} aria-hidden="true" />
          <span className="btn-text-mobile-hide">Log out</span>
        </button>
      </div>
    </header>
  )
}
