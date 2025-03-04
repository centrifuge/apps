import { evmToSubstrateAddress } from '@centrifuge/centrifuge-js'
import { useWallet } from '@centrifuge/centrifuge-react'
import { Box, Button, Grid, IconWallet, Stack, Text } from '@centrifuge/fabric'
import styled, { useTheme } from 'styled-components'
import { PageSummary } from '../../../src/components/PageSummary'
import { useTransactionsByAddress } from '../../../src/utils/usePools'
import { LayoutSection } from '../../components/LayoutBase/LayoutSection'
import { CardPortfolioValue } from '../../components/Portfolio/CardPortfolioValue'
import { Holdings, useHoldings } from '../../components/Portfolio/Holdings'
import { RouterLinkButton } from '../../components/RouterLinkButton'
import { Dec } from '../../utils/Decimal'
import { isEvmAddress } from '../../utils/address'
import { formatBalance } from '../../utils/formatting'
import { useAddress } from '../../utils/useAddress'
import { TransactionHistory } from './TransactionHistory'

const StyledGrid = styled(Grid)`
  height: 80vh;
  background-color: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: 8px;
  padding: 4px;
  margin: 4px;
  border: 1px solid ${({ theme }) => theme.colors.borderPrimary};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-left: 32px;
  margin-right: 32px;
`

export default function PortfolioPage() {
  return <Portfolio />
}

function Portfolio() {
  const theme = useTheme()
  const test = useAddress()
  const address = '0xa23adc45d99e11ba3dbe9c029a4d378565eeb663e393569cee93fd9f89610faf'
  const { data: transactions } = useTransactionsByAddress(address)
  const { showNetworks, connectedNetwork, evm } = useWallet()
  const chainId = evm.chainId ?? undefined
  const tokens = useHoldings(address, chainId)
  const centAddress = address && chainId && isEvmAddress(address) ? evmToSubstrateAddress(address, chainId) : address

  const currentPortfolioValue = tokens.reduce((sum, token) => sum.add(token.position.mul(token.tokenPrice)), Dec(0))
  const realizedPL = tokens.reduce((sum, token) => sum.add(token.realizedProfit?.toDecimal() ?? Dec(0)), Dec(0))
  const unrealizedPL = tokens.reduce((sum, token) => sum.add(token.unrealizedProfit?.toDecimal() ?? Dec(0)), Dec(0))

  const pageSummaryData: { label: React.ReactNode; value: React.ReactNode; heading?: boolean }[] = [
    {
      label: `Portfolio value`,
      value: formatBalance(currentPortfolioValue || 0),
    },
    {
      label: `Realized P&L`,
      value: formatBalance(realizedPL || 0),
    },
    {
      label: `Unrealized P&L`,
      value: formatBalance(unrealizedPL || 0),
    },
  ]

  return (
    <Box mb={2}>
      <LayoutSection alignItems="flex-start">
        <Text variant="heading1">Your portfolio</Text>
      </LayoutSection>

      {!address ? (
        <StyledGrid>
          <IconWallet size="iconMedium" />
          <Text variant="body2" color="textSecondary">
            Connect you wallet in order to view your portoflio.
          </Text>
          <Button variant="primary" onClick={() => showNetworks()} small>
            Connect wallet
          </Button>
        </StyledGrid>
      ) : !transactions?.investorTransactions.length ? (
        <StyledGrid>
          <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center">
            <Text variant="body2" color="textSecondary">
              This portfolio page is currently empty, as there are no available investments to display.
            </Text>
            <Text variant="body2" color="textSecondary">
              Explore Centrifuge pools to earn yield from real-world assets.
            </Text>
          </Box>
          <RouterLinkButton style={{ display: 'inline-flex' }} variant="primary" to="/pools" small>
            View pools
          </RouterLinkButton>
        </StyledGrid>
      ) : (
        <>
          <Box borderBottom={`1px solid ${theme.colors.borderPrimary}`} pb={1} mx={2} />
          <PageSummary data={pageSummaryData} />
          <Stack gap={4} m={4}>
            <Grid gridTemplateColumns={['1fr', '1fr 400px']} gap={4}>
              <CardPortfolioValue address={address} chainId={chainId} title="Portfolio performance" />
              <Box>New box</Box>
            </Grid>
            <Box>
              <Text variant="heading4">Investment positions</Text>
              <Holdings address={address} chainId={chainId} />
            </Box>

            <TransactionHistory address={centAddress} />
          </Stack>
        </>
      )}
    </Box>
  )
}
