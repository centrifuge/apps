import { AxisTheme } from '@centrifuge/axis-theme'
import { User } from '@centrifuge/gateway-lib/models/user'
import { createMemoryHistory } from 'history'
import React from 'react'
import { Router } from 'react-router'
import { AuthContext } from '../auth/Auth'
import { NotificationProvider } from '../components/NotificationContext'
import { createHttpClient, HttpClient, HttpClientContext } from '../http-client'
import { defaultToken, defaultUser } from './default-data'

type Options = {
  user?: User
  setUser?: () => void
  token?: string
  setToken?: () => void
  httpClient?: any
  history?: any
}

// Wrap component with Application Context;
export const withApplicationContext = (
  Component,
  {
    user = defaultUser,
    setUser = () => {},
    token = defaultToken,
    setToken = () => {},
    httpClient = createHttpClient(),
    history = createMemoryHistory({ initialEntries: ['/'], keyLength: 0 }),
  }: Options = {}
) => {
  return (
    <Router history={history}>
      <AuthContext.Provider value={{ user, setUser, token, setToken }}>
        <HttpClientContext.Provider value={httpClient as HttpClient}>{Component}</HttpClientContext.Provider>
      </AuthContext.Provider>
    </Router>
  )
}

// Wrap component with Notification Context;
export const withNotificationContext = (Component) => {
  return <NotificationProvider>{Component}</NotificationProvider>
}

// Wrap in Axis Theme
export const withAxis = (Component) => {
  return <AxisTheme full={true}>{Component}</AxisTheme>
}

export const withAllProvidersAndContexts = (Component, options: Options = {}) => {
  return withAxis(withApplicationContext(withNotificationContext(Component), options))
}
