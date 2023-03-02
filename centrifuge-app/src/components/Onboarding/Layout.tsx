import { Grid } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'

type LayoutProps = {
  children: React.ReactNode
}

const Root = styled(Grid)`
  height: 100vh;

  @supports (height: 100dvh) {
    height: 100dvh;
  }
`

export function Layout({ children }: LayoutProps) {
  return (
    <Root gridTemplateColumns="1fr" gridTemplateRows="auto minmax(0, 1fr)" backgroundColor="backgroundSecondary">
      {children}
    </Root>
  )
}
