import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { useBalances, WalletMenu } from '@centrifuge/centrifuge-react'
import { Box, Grid, Stack } from '@centrifuge/fabric'
import * as React from 'react'
import { useTheme } from 'styled-components'
import { config } from '../config'
import { useAddress } from '../utils/useAddress'
import { useIsAboveBreakpoint } from '../utils/useIsAboveBreakpoint'
import { Faucet } from './Faucet'
import { Footer } from './Footer'
import { LoadBoundary } from './LoadBoundary'
import { LogoLink } from './LogoLink'
import { Menu } from './Menu'

type Props = {
  sidebar?: React.ReactNode
  children?: React.ReactNode
}

const MIN_DEVEL_BALANCE = 10
const MIN_AUSD_BALANCE = 100

const TOOLBAR_HEIGHT = 75
const MENU_WIDTH = 80

export const PAGE_GUTTER = ['gutterMobile', 'gutterTablet', 'gutterDesktop']

export const PageWithSideBar: React.FC<Props> = ({ children, sidebar = true }) => {
  const isMedium = useIsAboveBreakpoint('M')

  const theme = useTheme()
  const balances = useBalances(useAddress())
  const hasLowDevelBalance =
    balances && new CurrencyBalance(balances.native.balance, 18).toDecimal().lte(MIN_DEVEL_BALANCE)
  const aUSD = balances && balances.currencies.find((curr) => curr.currency.key === 'AUSD')
  const hasLowAusdBalance =
    (aUSD && new CurrencyBalance(aUSD.balance, aUSD.currency.decimals).toDecimal().lte(MIN_AUSD_BALANCE)) || !aUSD

  return (
    <>
      <Grid
        as="header"
        gridTemplateColumns={[
          '1fr 1fr',
          '1fr 1fr',
          `${MENU_WIDTH}px 1fr 350px`,
          `${MENU_WIDTH}px 1fr 350px`,
          '235px 1fr 440px',
        ]}
        gridTemplateAreas={[`"logo content"`, `"logo content"`, `"logo . content"`]}
        alignItems="center"
        height={theme.sizes.headerHeight}
        zIndex={theme.zIndices.sticky + 1}
        position={['static', 'static', 'sticky']}
        top={0}
        width="100%"
        background={theme.colors.backgroundPrimary}
        borderWidth={0}
        borderStyle="solid"
        borderColor={theme.colors.borderPrimary}
        borderBottomWidth={1}
      >
        <Box gridArea="logo" pl={3} py={1}>
          <LogoLink />
        </Box>
        <Box gridArea="content" px={3} py={1}>
          <WalletMenu />
        </Box>
      </Grid>

      <Grid
        gridTemplateAreas={[
          `"main" "sidebar" "menu"`,
          `"main" "sidebar" "menu"`,
          `"menu main" "menu sidebar"`,
          `"menu main sidebar"`,
        ]}
        gridTemplateColumns={['1fr', '1fr', `${MENU_WIDTH}px 1fr`, `${MENU_WIDTH}px 1fr 350px`, '235px 1fr 440px']}
        gridTemplateRows={[`auto auto ${TOOLBAR_HEIGHT}px`, `auto auto ${TOOLBAR_HEIGHT}px`, 'auto']}
        minHeight={`calc(100vh - ${theme.sizes.headerHeight}px)`}
      >
        <Stack
          justifyContent="space-between"
          gridArea="menu"
          zIndex="sticky"
          position="sticky"
          top={['auto', 'auto', theme.sizes.headerHeight]}
          bottom={[0, 0, 'auto']}
          height={[TOOLBAR_HEIGHT, TOOLBAR_HEIGHT, 'auto']}
          maxHeight={['none', 'none', `calc(100vh - ${theme.sizes.headerHeight}px)`]}
          pt={[0, 0, 0, 0, 3]}
          px={[0, 0, 0, 0, 2]}
          borderWidth={0}
          borderStyle="solid"
          borderColor={theme.colors.borderSecondary}
          borderTopWidth={[1, 1, 0]}
          backgroundColor={theme.colors.backgroundPrimary}
        >
          <Menu />

          {config.network === 'centrifuge' && isMedium && (
            <Box px={[0, 0, 2, 2, 0]}>
              <Footer />
            </Box>
          )}
        </Stack>

        <Box
          as="main"
          gridArea="main"
          borderWidth={0}
          borderStyle="solid"
          borderColor={theme.colors.borderSecondary}
          borderRightWidth={[0, 0, 0, 1]}
          borderLeftWidth={[0, 0, 1]}
        >
          <LoadBoundary>{children}</LoadBoundary>
        </Box>

        {sidebar && (
          <Box
            as="aside"
            gridArea="sidebar"
            alignSelf={['auto', 'auto', 'auto', 'start']}
            position={['static', 'static', 'static', 'sticky']}
            top={theme.sizes.headerHeight}
            p={[0, 0, 3]}
          >
            <Stack gap={1}>
              {import.meta.env.REACT_APP_FAUCET_URL && hasLowDevelBalance && hasLowAusdBalance && <Faucet />}
              <LoadBoundary>{sidebar}</LoadBoundary>
              {config.network === 'centrifuge' && !isMedium && <Footer />}
            </Stack>
          </Box>
        )}

        {!sidebar && !isMedium && config.network === 'centrifuge' && (
          <Box gridArea="sidebar">
            <Footer />
          </Box>
        )}
      </Grid>
    </>
  )
}
