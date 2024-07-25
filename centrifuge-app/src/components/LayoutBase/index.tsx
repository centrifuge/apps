import { WalletMenu } from '@centrifuge/centrifuge-react'
import { Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useIsAboveBreakpoint } from '../../utils/useIsAboveBreakpoint'
import { Footer } from '../Footer'
import { LoadBoundary } from '../LoadBoundary'
import { LogoLink } from '../LogoLink'
import { Menu } from '../Menu'
import { BasePadding } from './BasePadding'
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
  gap?: number | number[]
}

export function LayoutBase({ children, gap }: LayoutBaseProps) {
  const isMedium = useIsAboveBreakpoint('M')

  return (
    <Root>
      <Inner>
        <HeaderBackground />

        <LogoContainer>
          <LogoLink />
        </LogoContainer>

        <WalletContainer px={[2, 2, 3, 3, 5]}>
          <WalletPositioner>
            <WalletInner minWidth={[200, 264]}>
              <WalletMenu />
            </WalletInner>
          </WalletPositioner>
        </WalletContainer>

        <ToolbarContainer as="aside">
          <Menu />
        </ToolbarContainer>

        <LoadBoundary>
          <MainContainer as="main" gap={gap}>
            {children}
          </MainContainer>
        </LoadBoundary>

        {isMedium && (
          <FooterContainer>
            <Footer />
          </FooterContainer>
        )}
      </Inner>
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
