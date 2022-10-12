import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { Box, Stack } from '@centrifuge/fabric'
import React from 'react'
import { useTheme } from 'styled-components'
import { config } from '../config'
import { useAddress } from '../utils/useAddress'
import { useBalances } from '../utils/useBalances'
import { AccountsMenu } from './AccountsMenu'
import { Faucet } from './Faucet'
import { Footer } from './Footer'
import { LoadBoundary } from './LoadBoundary'
import { Menu } from './Menu'

type Props = {
  sidebar?: React.ReactNode
}

const MIN_DEVEL_BALANCE = 10
const MIN_AUSD_BALANCE = 100
export const PAGE_GUTTER = ['gutterMobile', 'gutterTablet', 'gutterDesktop']

export const PageWithSideBar: React.FC<Props> = ({ children, sidebar = true }) => {
  const theme = useTheme()
  const balances = useBalances(useAddress())
  const hasLowDevelBalance =
    balances && new CurrencyBalance(balances.native.balance, 18).toDecimal().lte(MIN_DEVEL_BALANCE)
  const aUSD = balances && balances.currencies.find((curr) => curr.currency === 'ausd')
  const hasLowAusdBalance =
    (aUSD && new CurrencyBalance(aUSD.balance, aUSD.currencyDecimals).toDecimal().lte(MIN_AUSD_BALANCE)) || !aUSD

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
          <Stack gap={1} position="sticky" top={0} p={[0, 0, 3]}>
            <Stack mb={9} px={8} gap={4}>
              <AccountsMenu />
            </Stack>
            {import.meta.env.REACT_APP_FAUCET_URL && hasLowDevelBalance && hasLowAusdBalance && <Faucet />}
            <LoadBoundary>{sidebar}</LoadBoundary>
          </Stack>
        </Box>
      )}
    </Box>
  )
}
