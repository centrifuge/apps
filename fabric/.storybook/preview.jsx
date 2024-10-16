import * as React from 'react'
import { ThemeProvider } from 'styled-components'
import { Box, GlobalStyle } from '../src'
import centrifugeTheme from '../src/theme/centrifugeTheme'

const themes = {
  centrifugeTheme,
}

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  layout: 'fullscreen',
  backgrounds: { disable: true, grid: { disable: true } },
}

export const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    defaultValue: 'centrifugeLight',
    toolbar: {
      icon: 'mirror',
      items: Object.keys(themes),
      showName: true,
    },
  },
}

export const decorators = [
  (Story, context) => (
    <ThemeProvider theme={themes[context.globals.theme] || themes.centrifugeTheme}>
      <>
        <GlobalStyle />
        <Box p={3} bg="backgroundPage" minHeight="100vh">
          <Story />
        </Box>
      </>
    </ThemeProvider>
  ),
]
