import React from 'react'
import { ThemeProvider } from 'styled-components'
import { getTheme, theme } from '../src/theme'

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  backgrounds: {
    default: 'light',
    values: [
      {
        name: 'light',
        value: theme.colors.modes.light.backgroundPage,
      },
      {
        name: 'dark',
        value: theme.colors.modes.dark.backgroundPage,
      },
    ],
  },
}

export const decorators = [
  (Story, context) => (
    <ThemeProvider
      theme={getTheme(context.globals.backgrounds?.value === theme.colors.modes.dark.backgroundPage ? 'dark' : 'light')}
    >
      <Story />
    </ThemeProvider>
  ),
]
