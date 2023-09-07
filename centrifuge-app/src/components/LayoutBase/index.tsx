import { WalletMenu } from '@centrifuge/centrifuge-react'
import * as React from 'react'
import { Footer } from '../Footer'
import { LoadBoundary } from '../LoadBoundary'
import { LogoLink } from '../LogoLink'
import { Menu } from '../Menu'
import { OnboardingStatus } from '../OnboardingStatus'
import { SideDrawerProps } from '../SideDrawer'
import { config } from './config'
import {
  FooterContainer,
  HeaderBackground,
  Inner,
  LogoContainer,
  MainContainer,
  Root,
  ToolbarContainer,
  WalletContainer,
  WalletInner,
  WalletPositioner,
} from './styles'

type LayoutBaseProps = {
  children?: React.ReactNode
  sideDrawer?: React.ReactElement<SideDrawerProps>
}

export function LayoutBase({ children, sideDrawer }: LayoutBaseProps) {
  return (
    <Root>
      <Inner>
        <HeaderBackground />

        <LogoContainer>
          <LogoLink />
        </LogoContainer>

        <WalletContainer px={config.PADDING_MAIN}>
          <WalletPositioner>
            <WalletInner minWidth={config.WALLET_WIDTH}>
              <WalletMenu menuItems={[<OnboardingStatus />]} />
            </WalletInner>
          </WalletPositioner>
        </WalletContainer>

        <ToolbarContainer as="aside">
          <Menu />
        </ToolbarContainer>

        <LoadBoundary>
          <MainContainer as="main">{children}</MainContainer>
        </LoadBoundary>

        <FooterContainer>
          <Footer />
        </FooterContainer>
      </Inner>
      <LoadBoundary>{sideDrawer}</LoadBoundary>
    </Root>
  )
}
