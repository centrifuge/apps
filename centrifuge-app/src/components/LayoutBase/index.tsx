import { WalletMenu } from '@centrifuge/centrifuge-react'
import * as React from 'react'
import { Footer } from '../Footer'
import { LogoLink } from '../LogoLink'
import { Menu } from '../Menu'
import { OnboardingStatus } from '../OnboardingStatus'
import { SideDrawerProps } from '../SideDrawer'
import {
  FooterContainer,
  HeaderBackground,
  Inner,
  LogoContainer,
  MainContainer,
  Root,
  ToolbarContainer,
  WalletContainer,
} from './styles'

type LayoutBaseProps = {
  children?: React.ReactNode
  sideDrawer?: React.ReactElement<SideDrawerProps>
}

const PADDING_MAIN = [2, 2, 3, 3, 5]

export function LayoutBase({ children, sideDrawer }: LayoutBaseProps) {
  return (
    <Root>
      <Inner>
        <HeaderBackground />

        <LogoContainer>
          <LogoLink />
        </LogoContainer>

        <WalletContainer mr={PADDING_MAIN}>
          <WalletMenu menuItems={[<OnboardingStatus />]} />
        </WalletContainer>

        <ToolbarContainer as="aside">
          <Menu />
        </ToolbarContainer>

        <MainContainer as="main" px={PADDING_MAIN} pt={3} pb={4}>
          {children}
        </MainContainer>

        <FooterContainer>
          <Footer />
        </FooterContainer>
      </Inner>
      {sideDrawer}
    </Root>
  )
}
