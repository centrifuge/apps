import { evmToSubstrateAddress } from '@centrifuge/centrifuge-js'
import { useWallet } from '@centrifuge/centrifuge-react'
import { Box, Button, Grid, Stack, Text } from '@centrifuge/fabric'
import { useTheme } from 'styled-components'
import { PageSummary } from '../../../src/components/PageSummary'
import { LayoutSection } from '../../components/LayoutBase/LayoutSection'
import { AssetAllocation } from '../../components/Portfolio/AssetAllocation'
import { CardPortfolioValue } from '../../components/Portfolio/CardPortfolioValue'
import { Holdings, useHoldings } from '../../components/Portfolio/Holdings'
import { Transactions } from '../../components/Portfolio/Transactions'
import { RouterLinkButton } from '../../components/RouterLinkButton'
import { Dec } from '../../utils/Decimal'
import { isEvmAddress } from '../../utils/address'
import { formatBalance } from '../../utils/formatting'
import { useAddress } from '../../utils/useAddress'
import { useTransactionsByAddress } from '../../utils/usePools'

export default function PortfolioPage() {
  return <Portfolio />
}

function Portfolio() {
  const theme = useTheme()
  const address = useAddress()
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
    <Box>
      <LayoutSection alignItems="flex-start">
        <Text variant="heading1">Your portfolio</Text>
      </LayoutSection>
      <Box borderBottom={`1px solid ${theme.colors.borderPrimary}`} pb={1} mx={2} />
      <PageSummary data={pageSummaryData} />
      <Stack gap={4} mx={4}>
        <Grid gridTemplateColumns={['1fr', '1fr 1fr']} gap={4}>
          <CardPortfolioValue address={address} chainId={chainId} />
          <Box>New box</Box>
        </Grid>
        <Box>
          <Text variant="heading4">Investment positions</Text>
          <Holdings address={address} chainId={chainId} />
        </Box>
        <Box>
          <Text variant="heading4">Transaction history</Text>
          <Transactions onlyMostRecent address={centAddress} />
        </Box>
      </Stack>
    </Box>
  )
}

function PortfolioOld() {
  const address = useAddress()
  const { data: transactions } = useTransactionsByAddress(address)
  const { showNetworks, connectedNetwork, evm } = useWallet()
  const chainId = evm.chainId ?? undefined
  const centAddress = address && chainId && isEvmAddress(address) ? evmToSubstrateAddress(address, chainId) : address

  return (
    <>
      <LayoutSection backgroundColor="backgroundSecondary" pt={5} pb={3}>
        <Stack as="header" gap={1}>
          <Text as="h1" variant="heading1">
            Your portfolio
          </Text>
          <Text as="p" variant="label1">
            Track and manage your portfolio
          </Text>
        </Stack>
        <CardPortfolioValue address={address} chainId={chainId} />
      </LayoutSection>

      {transactions?.investorTransactions.length === 0 && connectedNetwork === 'centrifuge' ? (
        <LayoutSection>
          <Stack maxWidth="700px" gap={2}>
            <Text variant="body2">
              The portfolio page is empty as there are no investments available for display at the moment. Go explore
              some pools on Centrifuge, where you can earn yield from real-world assets.
            </Text>
            <RouterLinkButton style={{ display: 'inline-flex' }} variant="primary" to="/pools">
              View pools
            </RouterLinkButton>
          </Stack>
        </LayoutSection>
      ) : null}

      {!address && (
        <LayoutSection>
          <Stack maxWidth="700px" gap={2}>
            <Text variant="body2">To view your investments, you need to connect your wallet.</Text>
            <Button style={{ display: 'inline-flex' }} variant="primary" onClick={() => showNetworks()}>
              Connect wallet
            </Button>
          </Stack>
        </LayoutSection>
      )}

      <LayoutSection title="Holdings">
        <Holdings address={address} chainId={chainId} />
      </LayoutSection>

      <LayoutSection title="Transaction history">
        <Transactions onlyMostRecent address={centAddress} />
      </LayoutSection>

      <LayoutSection title="Allocation" pb={5}>
        <AssetAllocation address={address} chainId={chainId} />
      </LayoutSection>
    </>
  )
}
