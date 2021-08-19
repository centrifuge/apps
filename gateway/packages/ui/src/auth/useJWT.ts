import { useState } from 'react'

const LOCAL_STORAGE_JWT_KEY = 'jwt'

export function useJWT(): [string | null, (token: string | null) => void] {
  const item = sessionStorage.getItem(LOCAL_STORAGE_JWT_KEY)

  const [token, setToken] = useState<null | string>(item)

  return [
    token,
    (token) => {
      if (token === null) {
        sessionStorage.removeItem(LOCAL_STORAGE_JWT_KEY)
      } else {
        sessionStorage.setItem(LOCAL_STORAGE_JWT_KEY, token)
      }
      setToken(token)
    },
  ]
}
