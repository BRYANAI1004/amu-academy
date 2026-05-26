const AUTH_KEY = 'amu-academy-auth'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
}

const DEMO_USER: AuthUser = {
  id: 'demo-user',
  name: 'AMU Learner',
  email: 'demo@amu.edu',
  role: 'learner',
}

export function getAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return getAuthUser() !== null
}

export function login(): AuthUser {
  localStorage.setItem(AUTH_KEY, JSON.stringify(DEMO_USER))
  return DEMO_USER
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY)
}
