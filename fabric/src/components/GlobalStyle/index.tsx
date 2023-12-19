import * as React from 'react'
import { createGlobalStyle, useTheme } from 'styled-components'

export const StyledGlobalStyle = createGlobalStyle`
  html {
    box-sizing: border-box;
    accent-color: ${(props) => props.theme.colors.accentPrimary};
    color-scheme: ${(props) => props.theme.scheme};
  }

  *,
  *::before,
  *::after {
    box-sizing: inherit;
  }

  html, body {
    margin: 0;
    padding: 0;
    background-color: ${(props) => props.theme.colors.backgroundPage};
  }

  a {
    text-decoration: none;
  }

  *:focus {
    outline: none;
  }
`

export function GlobalStyle() {
  const theme = useTheme()
  React.useLayoutEffect(() => {
    Object.entries(theme.colors).forEach(([key, color]) => {
      if (typeof color === 'string') document.documentElement.style.setProperty(`--fabric-${key}`, color)
    })
  }, [])
  return <StyledGlobalStyle />
}
