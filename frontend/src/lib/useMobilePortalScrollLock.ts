import { useEffect } from 'react'

const MOBILE_PORTAL_QUERY = '(max-width: 640px)'

export function useMobilePortalScrollLock() {
  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_PORTAL_QUERY)

    function syncScrollLock() {
      document.documentElement.classList.toggle('student-portal-mobile', mediaQuery.matches)
    }

    syncScrollLock()
    mediaQuery.addEventListener('change', syncScrollLock)

    return () => {
      mediaQuery.removeEventListener('change', syncScrollLock)
      document.documentElement.classList.remove('student-portal-mobile')
    }
  }, [])
}
