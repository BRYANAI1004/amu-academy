import { useNavigate } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import { login } from '../lib/auth'

export default function LoginPage() {
  const navigate = useNavigate()

  return (
    <div className="login-page">
      <div className="login-gradient-art" aria-hidden="true">
        <span className="login-blob login-blob--yellow" />
        <span className="login-blob login-blob--orange" />
        <span className="login-blob login-blob--peach" />
        <span className="login-blob login-blob--pink" />
        <span className="login-blob login-blob--lavender" />
        <span className="login-blob login-blob--red" />
      </div>

      <div className="login-shell">
        <header className="login-brand">
          <img src="/AMULogo.png" alt="Alhambra Medical University" className="login-logo-img" />
          <h1 className="login-page-title">Online Academy</h1>
        </header>

        <div className="login-card-shell">
          <div className="login-card">
            <form
              className="login-form"
              onSubmit={(e) => {
                e.preventDefault()
                login()
                navigate('/courses')
              }}
            >
              <label className="field">
                <span className="field-label">Email</span>
                <span className="field-input-wrap">
                  <Mail size={16} className="field-icon" aria-hidden="true" />
                  <input type="email" className="field-input" autoComplete="email" />
                </span>
              </label>

              <label className="field">
                <span className="field-label">Password</span>
                <span className="field-input-wrap">
                  <Lock size={16} className="field-icon" aria-hidden="true" />
                  <input type="password" className="field-input" autoComplete="current-password" />
                </span>
              </label>

              <button type="submit" className="btn btn-login btn-full">
                Sign in
              </button>
            </form>
          </div>
        </div>
      </div>

      <footer className="login-footer">
        <p className="login-footer__powered">Powered by WanPanel AI</p>
        <div className="login-footer__school">
          <p>© 2026 Alhambra Medical University. All rights reserved.</p>
          <p>2215 W Mission Rd Suite 280, Alhambra, CA 91803</p>
          <p>+1 (626) 438-8980</p>
        </div>
      </footer>
    </div>
  )
}
