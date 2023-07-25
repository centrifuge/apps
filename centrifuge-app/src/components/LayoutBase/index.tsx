import { WalletMenu } from '@centrifuge/centrifuge-react'
import * as React from 'react'
import { Footer } from '../Footer'
import { LogoLink } from '../LogoLink'
import { Menu } from '../Menu'
import { OnboardingStatus } from '../OnboardingStatus'
import { SidePanel } from '../SidePanel'
import {
  FooterContainer,
  HeaderBackground,
  LogoContainer,
  MainContainer,
  Root,
  ToolbarContainer,
  WalletContainer,
} from './styles'

type LayoutBaseProps = {
  children?: React.ReactNode
  sidePanel?: typeof SidePanel
}

export function LayoutBase({ children, sidePanel }: LayoutBaseProps) {
  return (
    <Root>
      <HeaderBackground />

      <LogoContainer>
        <LogoLink />
      </LogoContainer>

      <WalletContainer>
        <WalletMenu menuItems={[<OnboardingStatus />]} />
      </WalletContainer>

      <ToolbarContainer as="aside">
        <Menu />
      </ToolbarContainer>

      <MainContainer as="main" px={3} py={5}>
        {children}
      </MainContainer>

      <FooterContainer>
        <Footer />
      </FooterContainer>

      {sidePanel}
    </Root>
  )
}
