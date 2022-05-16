import { Box, Shelf } from '@centrifuge/fabric'
import React from 'react'
import { useTheme } from 'styled-components'
import { AccountsMenu } from './AccountsMenu'
import { LoadBoundary } from './LoadBoundary'
import { Menu } from './Menu'

type Props = {
  sidebar?: React.ReactNode
}

export const PAGE_GUTTER = ['gutterMobile', 'gutterTablet', 'gutterDesktop']

export const PageWithSideBar: React.FC<Props> = ({ children, sidebar }) => {
  const theme = useTheme()
  return (
    <Box
      display="grid"
      gridTemplateAreas={`"menu main sidebar"`}
      gridTemplateColumns={['80px 7fr 3fr', '80px 7fr 3fr', 'minmax(0, 2fr) 7fr 3fr']}
      gridAutoRows="auto"
      minHeight="100vh"
    >
      <Box
        gridArea="menu"
        position="sticky"
        bottom={0}
        zIndex={5}
        background="backgroundPrimary"
        style={{
          boxShadow: `0 -1px 0 ${theme.colors.borderSecondary}, 1px 0 0 ${theme.colors.borderSecondary}`,
        }}
      >
        <Menu />
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
        <Box gridArea="sidebar" as="aside" zIndex={5}>
          <Box position="sticky" top={0} p={3}>
            <Shelf justifyContent="center" pb={3}>
              <AccountsMenu />
            </Shelf>
            <LoadBoundary>{sidebar}</LoadBoundary>
          </Box>
        </Box>
      )}
    </Box>
  )
}
