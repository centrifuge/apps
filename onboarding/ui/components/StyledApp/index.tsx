import { createGlobalStyle } from 'styled-components'

export const StyledApp = createGlobalStyle`
  html, body {
    margin: 0;
    padding: 0;
  }
  
  input:disabled {
    opacity: 0.5;
  }
`
