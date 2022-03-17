import altairDark from '@centrifuge/fabric/dist/theme/altairDark'
import React from 'react'
import ReactDOM from 'react-dom'
import { DefaultTheme, ThemeProvider } from 'styled-components'
import { DebugFlags } from './components/DebugFlags'
import { Root } from './components/Root'

const darkTheme: DefaultTheme = {
  ...altairDark,
  sizes: {
    ...altairDark.sizes,
    container: '100%',
    navBarHeight: 72,
    navBarHeightMobile: 64,
    dialog: 564,
  },
  colors: {
    ...altairDark.colors,
    placeholderBackground: altairDark.colors.backgroundSecondary,
  },
  typography: {
    ...altairDark.typography,
    headingLarge: {
      fontSize: [24, 24, 36],
      lineHeight: 1.25,
      fontWeight: 600,
      color: 'textPrimary',
    },
  },
}

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <DebugFlags>
        <Root />
      </DebugFlags>
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
)
