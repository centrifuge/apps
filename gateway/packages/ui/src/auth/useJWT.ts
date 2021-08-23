import throttle from 'lodash/throttle'
import * as React from 'react'
import { history } from '../history'

const LOCAL_STORAGE_JWT_KEY = 'jwt'

export function useJWT(): [string | null, (token: string | null) => void] {
  const item = sessionStorage.getItem(LOCAL_STORAGE_JWT_KEY)
  const [token, setToken] = React.useState<null | string>(item)
  function update(token) {
    if (token === null) {
      sessionStorage.removeItem(LOCAL_STORAGE_JWT_KEY)
    } else {
      sessionStorage.setItem(LOCAL_STORAGE_JWT_KEY, token)
    }
    setToken(token)
  }

  useIdleTimeout(token, () => update(null))

  return [token, update]
}

const idleMinutesBeforeLogout = 10
let hasMounted = false

function useIdleTimeout(token: any, clearToken: () => void) {
  const [, forceRender] = React.useReducer((s) => s + 1, 0)
  const key = `${LOCAL_STORAGE_JWT_KEY}-lastActive`
  const lastActiveTimestamp = sessionStorage.getItem(key)

  const lastActive = lastActiveTimestamp ? new Date(lastActiveTimestamp) : new Date()
  const now = new Date()
  const diff = now.getTime() - lastActive.getTime()
  const msToLogout = idleMinutesBeforeLogout * 60 * 1000 - diff

  function logout() {
    clearToken()
    history.push('/', { initialError: 'logout' })
  }

  // Doing this in render and not in an effect on purpose to avoid <Redirect /> components
  // from redirecting the user to /users or /documents, when there was a token still in storage
  // This way, the user won't see a flash of those pages before being redirected back to login
  if (!hasMounted && token && msToLogout <= 0) {
    logout()
    hasMounted = true
  }

  const reset = React.useCallback(
    throttle(() => {
      sessionStorage.setItem(key, new Date().toISOString())
      forceRender()
    }, 2000),
    []
  )

  React.useEffect(() => {
    if (token) {
      const timeoutId = setTimeout(logout, Math.max(msToLogout, 0))
      return () => {
        clearTimeout(timeoutId)
      }
    }
  })

  React.useEffect(() => {
    hasMounted = true
  }, [])

  React.useEffect(() => {
    document.addEventListener('click', reset)
    document.addEventListener('keydown', reset)

    return () => {
      document.removeEventListener('click', reset)
      document.removeEventListener('keydown', reset)
    }
  }, [reset])
}
