import { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
  html {
    box-sizing: border-box;
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
`
