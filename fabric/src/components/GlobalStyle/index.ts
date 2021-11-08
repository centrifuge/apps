import { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
  html {
    box-sizing: border-box;
  }

  * {
    margin: 0;
    padding: 0;
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
    --fabric-color-focus: ${(props) => props.theme.colors.brand};
  }

  a {
    text-decoration: none;
  }

  *:focus {
    outline: none;
  }

  button {
    border: none;
    appearance: none;
    background: transparent;
    outline: 0;
  }
`
