import { Link, NavLink, Outlet } from 'react-router-dom'
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, Tags } from 'lucide-react'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
]

export default function AdminLayout() {
  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <img src="/AMULogo.png" alt="" className="admin-sidebar__logo" />
          <div>
            <p className="admin-sidebar__title">AMU Academy</p>
            <p className="admin-sidebar__subtitle">Admin</p>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `admin-nav__link ${isActive ? 'admin-nav__link--active' : ''}`}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <Link to="/courses" className="admin-nav__link">
            <GraduationCap size={18} aria-hidden="true" />
            Student portal
          </Link>
          <Link to="/login" className="admin-nav__link">
            <LogOut size={18} aria-hidden="true" />
            Exit admin
          </Link>
        </div>
      </aside>

      <div className="admin-main-wrap">
        <header className="admin-topbar">
          <p className="admin-topbar__label">Administration</p>
        </header>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
