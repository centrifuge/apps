import { User } from '@centrifuge/gateway-lib/models/user';
import React from 'react';
import { AppContext } from '../App';
import { NotificationProvider } from '../components/NotificationContext';
import { AxisTheme } from '@centrifuge/axis-theme';
import { defaultUser } from './default-data';




// Wrap component with Application Context;
export const withApplicationContext = (Component, user: User = defaultUser, setUser = () => {
}) => {
  return (<AppContext.Provider value={{ user, setUser }}>
    {Component}
  </AppContext.Provider>);
};

// Wrap component with Notification Context;
export const withNotificationContext = (Component) => {
  return (<NotificationProvider>
    {Component}
  </NotificationProvider>);
};

// Wrap in Axis Theme
export const withAxis = (Component) => {
  return <AxisTheme full={true}>
    {Component}
  </AxisTheme>;
};

export const withAllProvidersAndContexts = (Component, user: User = defaultUser, setUser = () => {
}) => {
  return withAxis(
    withApplicationContext(
      withNotificationContext(
        Component,
      ),
      user,
      setUser,
    ),
  );
};

