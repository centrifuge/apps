import { WalletMenu } from '@centrifuge/centrifuge-react'
import { Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Footer } from '../Footer'
import { LoadBoundary } from '../LoadBoundary'
import { LogoLink } from '../LogoLink'
import { Menu } from '../Menu'
import { OnboardingStatus } from '../OnboardingStatus'
import { SideDrawerProps } from '../SideDrawer'
import { BaseSection } from './BaseSection'
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

export function LayoutMain({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <BaseSection pt={3} pb={4}>
      <Stack gap={4}>
        <Stack>
          <Text as="h1" variant="heading1">
            {title}
          </Text>
          {subtitle && (
            <Text as="p" variant="heading6">
              {subtitle}
            </Text>
          )}
        </Stack>

        {children}
      </Stack>
    </BaseSection>
  )
}
