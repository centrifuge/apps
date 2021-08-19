import { User } from '@centrifuge/gateway-lib/models/user'
import React, { createContext, FC, useEffect, useState } from 'react'
import { createHttpClient } from '../http-client'
import { useJWT } from './useJWT'

interface AuthContextData {
  user: User | null
  setUser: (user: User | null) => void
  token: string | null
  setToken: (token: string | null) => void
}

export const AuthContext = createContext<AuthContextData>({
  user: null,
  setUser: () => undefined,
  token: null,
  setToken: () => undefined,
})

const httpClient = createHttpClient()

export const Auth: FC = ({ children }) => {
  const [userLoaded, setUserLoaded] = useState(false)
  const [user, setUser] = useState<null | User>(null)
  const [token, setToken] = useJWT()

  useEffect(() => {
    ;(async () => {
      // if auto login should happen
      if (!user && !token && process.env.REACT_APP_ADMIN_USER) {
        const res = await httpClient.user.login({
          email: process.env.REACT_APP_ADMIN_USER,
          password: process.env.REACT_APP_ADMIN_PASSWORD || '',
        })
        setUser(res.data.user)
        setToken(res.data.token)
        setUserLoaded(true)
        return
      }

      // if already loaded or if no token exists
      if (user || !token) {
        setUserLoaded(true)
        return
      }

      try {
        const res = await httpClient.user.profile(token)
        setUser(res.data)
      } catch (e) {
        setToken(null)
      }
      setUserLoaded(true)
    })()
  }, [token, user, setUserLoaded, setUser, setToken])

  if (!userLoaded) return null


  return <AuthContext.Provider value={{ user, setUser, token, setToken }}>{children}</AuthContext.Provider>
}
