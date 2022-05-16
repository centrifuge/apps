import { OverlayProvider } from '@react-aria/overlays'
import * as React from 'react'
import { DefaultTheme, ThemeProvider } from 'styled-components'

type Props = {
  theme: DefaultTheme
}

export const FabricProvider: React.FC<Props> = ({ theme, children }) => {
  return (
    <ThemeProvider theme={theme}>
      <OverlayProvider>{children}</OverlayProvider>
    </ThemeProvider>
  )
}
