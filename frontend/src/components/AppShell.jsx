import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BookOpen, LogOut, Menu, Plus, X } from 'lucide-react'
import { useAuth } from '../auth/authContext'
import { useToast } from './toastContext'

export default function AppShell() {
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenuOnNavigate = (event) => {
    if (event.target.closest('a')) setMenuOpen(false)
  }

  const handleLogout = () => {
    logout()
    showToast('You are logged out.')
    navigate('/')
  }

  return (
    <div className="rb-app">
      <header className="rb-header">
        <div className="rb-header__inner" onClick={closeMenuOnNavigate}>
          <Link to="/" className="rb-brand" aria-label="Recipe Book home">
            <span className="rb-brand__mark">
              <BookOpen size={19} aria-hidden="true" />
            </span>
            <span>Recipe Book</span>
          </Link>

          <button
            type="button"
            className="rb-icon-button rb-menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="rb-primary-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            <span className="rb-visually-hidden">Toggle navigation</span>
          </button>

          <nav
            id="rb-primary-nav"
            className={`rb-nav ${menuOpen ? 'rb-nav--open' : ''}`}
            aria-label="Main navigation"
          >
            <NavLink
              to="/recipes"
              className={({ isActive }) => `rb-nav__link${isActive ? ' is-active' : ''}`}
            >
              Recipes
            </NavLink>
            <NavLink
              to="/recipes/new"
              className={({ isActive }) => `rb-nav__link${isActive ? ' is-active' : ''}`}
            >
              <Plus size={15} aria-hidden="true" />
              Add recipe
            </NavLink>
            {user && (
              <NavLink
                to="/bulk"
                className={({ isActive }) => `rb-nav__link${isActive ? ' is-active' : ''}`}
              >
                Bulk import
              </NavLink>
            )}
          </nav>

          <div className="rb-header__actions">
            {user ? (
              <>
                <span className="rb-header__user">{user.name}</span>
                <button type="button" className="rb-button rb-button--quiet" onClick={handleLogout}>
                  <LogOut size={15} aria-hidden="true" />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rb-button rb-button--quiet">
                  Log in
                </Link>
                <Link to="/signup" className="rb-button rb-button--primary">
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="rb-main">
        <Outlet />
      </main>

      <footer className="rb-footer">
        <p>Kept like a kitchen notebook, not a dashboard.</p>
      </footer>
    </div>
  )
}
