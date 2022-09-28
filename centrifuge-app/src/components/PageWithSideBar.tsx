import { Box, Stack } from '@centrifuge/fabric'
import React from 'react'
import { useTheme } from 'styled-components'
import { config } from '../config'
import { AccountsMenu } from './AccountsMenu'
import { Footer } from './Footer'
import { LoadBoundary } from './LoadBoundary'
import { Menu } from './Menu'

type Props = {
  sidebar?: React.ReactNode
}

export const PAGE_GUTTER = ['gutterMobile', 'gutterTablet', 'gutterDesktop']

export const PageWithSideBar: React.FC<Props> = ({ children, sidebar = true }) => {
  const theme = useTheme()
  return (
    <Box
      display="grid"
      gridTemplateAreas={[`"main" "sidebar" "menu"`, `"main" "sidebar" "menu"`, `"menu main sidebar"`]}
      gridTemplateColumns={['1fr', '1fr', 'minmax(0, 2fr) 7fr 3fr']}
      gridAutoRows={['1fr auto auto', '1fr auto auto', 'auto']}
      minHeight="100vh"
    >
      <Box
        maxHeight="100vh"
        gridArea="menu"
        position="sticky"
        bottom={0}
        top={0}
        height="100%"
        zIndex={theme.zIndices.sticky + 1}
        background={theme.colors.backgroundPrimary}
        style={{
          boxShadow: `0 -1px 0 ${theme.colors.borderSecondary}, 1px 0 0 ${theme.colors.borderSecondary}`,
        }}
      >
        <Stack height="100%" position="sticky" top={0} justifyContent="space-between">
          <Menu />
          {config.network === 'centrifuge' && <Footer />}
        </Stack>
      </Box>
      <Box
        gridArea={sidebar ? 'main' : '1 / 2 / 1 / 4'}
        as="main"
        style={{
          boxShadow: `1px 0 0 ${theme.colors.borderSecondary}`,
        }}
      >
        <LoadBoundary>{children}</LoadBoundary>
      </Box>
      {sidebar && (
        <Box gridArea="sidebar" as="aside" zIndex="sticky">
          <Box position="sticky" top={0} p={[0, 0, 3]}>
            <Stack mb={9} px={8}>
              <AccountsMenu />
            </Stack>
            <LoadBoundary>{sidebar}</LoadBoundary>
          </Box>
        </Box>
      )}
    </Box>
  )
}
