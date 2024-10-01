import { WalletMenu } from '@centrifuge/centrifuge-react'
import { Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Outlet } from 'react-router'
import { useIsAboveBreakpoint } from '../../utils/useIsAboveBreakpoint'
import { Footer } from '../Footer'
import { LogoLink } from '../LogoLink-deprecated'
import { Menu } from '../Menu'
import { BasePadding } from './BasePadding'
import {
  ContentWrapper,
  FooterContainer,
  Inner,
  LogoContainer,
  MobileBar,
  Root,
  ToolbarContainer,
  WalletContainer,
  WalletInner,
  WalletPositioner,
} from './styles'

export function LayoutBase(): JSX.Element {
  const isMedium = useIsAboveBreakpoint('M')
  return (
    <Root>
      <WalletContainer>
        <WalletPositioner>
          <WalletInner>
            <WalletMenu />
          </WalletInner>
        </WalletPositioner>
      </WalletContainer>
      {isMedium ? (
        <Inner>
          <LogoContainer>
            <LogoLink />
          </LogoContainer>
          <ToolbarContainer as="aside">
            <Menu />
          </ToolbarContainer>
          <FooterContainer>
            <Footer />
          </FooterContainer>
        </Inner>
      ) : (
        <>
          <LogoContainer>
            <LogoLink />
          </LogoContainer>
          <MobileBar>
            <ToolbarContainer as="aside">
              <Menu />
            </ToolbarContainer>
          </MobileBar>
        </>
      )}
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
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
    <BasePadding py={5}>
      <Stack gap={4}>
        <Stack>
          <Text as="h1" variant="heading1">
            {title}
          </Text>
          {subtitle && (
            <Text as="p" variant="heading4">
              {subtitle}
            </Text>
          )}
        </Stack>

        {children}
      </Stack>
    </BasePadding>
  )
}
