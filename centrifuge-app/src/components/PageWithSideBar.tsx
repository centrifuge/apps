import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { useBalances, WalletMenu } from '@centrifuge/centrifuge-react'
import { Box, Grid, Shelf, Stack } from '@centrifuge/fabric'
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
const HEADER_HEIGHT = 56
const MENU_WIDTH = 80

export const PAGE_GUTTER = ['gutterMobile', 'gutterTablet', 'gutterDesktop']

export const PageWithSideBar: React.FC<Props> = ({ children, sidebar = true }) => {
  const isMedium = useIsAboveBreakpoint('M')

  const theme = useTheme()
  const balances = useBalances(useAddress('substrate'))
  const hasLowDevelBalance =
    balances && new CurrencyBalance(balances.native.balance, 18).toDecimal().lte(MIN_DEVEL_BALANCE)
  const aUSD = balances && balances.currencies.find((curr) => curr.currency.key === 'AUSD')
  const hasLowAusdBalance =
    (aUSD && new CurrencyBalance(aUSD.balance, aUSD.currency.decimals).toDecimal().lte(MIN_AUSD_BALANCE)) || !aUSD

  return (
    <Grid
      gridTemplateAreas={[
        `"menu" "main" "sidebar"`,
        `"menu" "main" "sidebar"`,
        `"menu main" "menu sidebar"`,
        `"menu main sidebar"`,
      ]}
      gridTemplateColumns={['1fr', '1fr', `${MENU_WIDTH}px 1fr`, `${MENU_WIDTH}px 1fr`, '235px 1fr 440px']}
      gridTemplateRows={[
        `${HEADER_HEIGHT}px 1fr ${TOOLBAR_HEIGHT}px`,
        `${HEADER_HEIGHT}px 1fr ${TOOLBAR_HEIGHT}px`,
        'auto',
      ]}
      minHeight="100vh"
    >
      <Box
        as="header"
        maxHeight="100vh"
        gridArea="menu"
        position="sticky"
        top={0}
        bottom={['auto', 'auto', 0]}
        height={[HEADER_HEIGHT, HEADER_HEIGHT, '100%']}
        px={[2, 2, 0]}
        py={[1, 1, 0]}
        zIndex={theme.zIndices.sticky + 1}
        background={theme.colors.backgroundPrimary}
        borderWidth={0}
        borderColor={theme.colors.borderSecondary}
        borderStyle="solid"
        borderBottomWidth={[1, 1, 0]}
        borderRightWidth={[0, 0, 1]}
      >
        {!isMedium ? (
          <Shelf justifyContent="space-between">
            <LogoLink />
            <Stack gap={4}>
              <WalletMenu />
            </Stack>
          </Shelf>
        ) : (
          <Grid height="100%" gridTemplateColumns="1fr" gridTemplateRows="1fr auto">
            <Stack
              alignItems={['center', 'center', 'center', 'center', 'start']}
              gap={8}
              position="sticky"
              top={0}
              pt={[0, 0, 2]}
              px={[0, 0, 0, 0, 2]}
            >
              <LogoLink />
              <Menu />
            </Stack>
            {config.network === 'centrifuge' && <Footer />}
          </Grid>
        )}
      </Box>

      <Box
        gridArea="main"
        as="main"
        borderRightColor={theme.colors.borderSecondary}
        borderRightStyle="solid"
        borderRightWidth={[0, 0, 1]}
      >
        <LoadBoundary>{children}</LoadBoundary>

        {!isMedium && (
          <>
            <LoadBoundary>{sidebar}</LoadBoundary>
            {config.network === 'centrifuge' && <Footer />}
          </>
        )}
      </Box>

      {sidebar && (
        <Box
          gridArea="sidebar"
          as="aside"
          zIndex="sticky"
          position={['sticky', 'sticky', 'relative']}
          bottom={[0, 0, 'auto']}
          height={[TOOLBAR_HEIGHT, TOOLBAR_HEIGHT, 'auto']}
          backgroundColor={theme.colors.backgroundPrimary}
          borderTopColor={theme.colors.borderSecondary}
          borderTopStyle="solid"
          borderTopWidth={[1, 1, 0]}
        >
          {!isMedium ? (
            <Menu />
          ) : (
            <Stack gap={1} position="sticky" top={0} p={[0, 0, 3]}>
              <Stack mb={9} px={8} gap={4}>
                <WalletMenu />
              </Stack>

              {import.meta.env.REACT_APP_FAUCET_URL && hasLowDevelBalance && hasLowAusdBalance && <Faucet />}

              <LoadBoundary>{sidebar}</LoadBoundary>
            </Stack>
          )}
        </Box>
      )}
    </Grid>
  )
}
