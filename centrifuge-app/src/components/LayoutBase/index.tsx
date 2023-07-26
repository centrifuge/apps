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

const PADDING_MAIN = [2, 2, 3, 5, 10]

export function LayoutBase({ children, sidePanel }: LayoutBaseProps) {
  return (
    <Root>
      <HeaderBackground />

      <LogoContainer>
        <LogoLink />
      </LogoContainer>

      <WalletContainer pr={PADDING_MAIN}>
        <WalletMenu menuItems={[<OnboardingStatus />]} />
      </WalletContainer>

      <ToolbarContainer as="aside">
        <Menu />
      </ToolbarContainer>

      <MainContainer as="main" px={PADDING_MAIN} pt={[2, 3, 7, 10]} pb={4}>
        {children}
      </MainContainer>

      <FooterContainer>
        <Footer />
      </FooterContainer>

      {sidePanel}
    </Root>
  )
}
