import { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
  html {
    box-sizing: border-box;
    --fabric-color-focus: ${(props) => props.theme.colors.accentPrimary};
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
