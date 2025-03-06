import { evmToSubstrateAddress } from '@centrifuge/centrifuge-js'
import { useWallet } from '@centrifuge/centrifuge-react'
import { Box, Button, Grid, IconWallet, Select, Stack, Text } from '@centrifuge/fabric'
import { useMemo, useState } from 'react'
import styled, { useTheme } from 'styled-components'
import { AssetSummary } from '../../../src/components/AssetSummary'
import { evmChains } from '../../../src/config'
import { useTransactionsByAddress } from '../../../src/utils/usePools'
import { LayoutSection } from '../../components/LayoutBase/LayoutSection'
import { CardPortfolioValue } from '../../components/Portfolio/CardPortfolioValue'
import { Holdings, TokenWithIcon, useHoldings } from '../../components/Portfolio/Holdings'
import { RouterLinkButton } from '../../components/RouterLinkButton'
import { Dec } from '../../utils/Decimal'
import { isEvmAddress } from '../../utils/address'
import { formatBalance } from '../../utils/formatting'
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
  // For testing only - add useAddress() before merging to main
  const address = '0x30d3bbae8623d0e9c0db5c27b82dcda39de40997000000000000000145564d00'
  const { showNetworks, evm } = useWallet()
  const chainId = evm.chainId ?? undefined

  return (
    <Box mb={2}>
      <LayoutSection alignItems="flex-start">
        <Text variant="heading1">Your portfolio</Text>
      </LayoutSection>
      {!address ? (
        <StyledGrid>
          <IconWallet size="iconMedium" />
          <Text variant="body2" color="textSecondary">
            Connect your wallet in order to view your portfolio.
          </Text>
          <Button variant="primary" onClick={() => showNetworks()} small>
            Connect wallet
          </Button>
        </StyledGrid>
      ) : (
        <PortfolioDetails address={address} chainId={chainId} />
      )}
    </Box>
  )
}

function PortfolioDetails({ address, chainId }: { address: string; chainId: number | undefined }) {
  const theme = useTheme()
  const { data: transactions } = useTransactionsByAddress(address)
  const tokens = useHoldings(address, chainId)
  const centAddress = isEvmAddress(address) && chainId ? evmToSubstrateAddress(address, chainId) : address

  const convertedTokens = useMemo(() => {
    return tokens.map((token) => ({
      ...token,
      chainId: Number(token.chainId) === 0 ? undefined : token.chainId,
      connectedNetwork: Number(token.chainId) === 0 ? 'Centrifuge' : token.connectedNetwork,
    }))
  }, [tokens])

  const networks = useMemo(() => {
    const networkMap = new Map()
    convertedTokens.forEach((token) => {
      const chain = (evmChains as any)[Number(token.chainId)] || 'Centrifuge'
      networkMap.set(chain, {
        label: chain.name ? chain.name : chain,
        value: chain.name ? chain?.name : chain?.toLowerCase(),
        chainId: token.chainId,
      })
    })
    return Array.from(networkMap.values())
  }, [tokens])

  const [selectedNetwork, setSelectedNetwork] = useState<string>(networks[0]?.chainId || 'centrifuge')

  const changeNetwork = (value: string) => {
    const network = networks.find((n) => n.value === value)
    setSelectedNetwork(network?.chainId || 'centrifuge')
  }

  const selectedTokens = useMemo(() => {
    const isCentrifuge = selectedNetwork === 'centrifuge'
    return isCentrifuge
      ? convertedTokens.filter((token) => token.connectedNetwork === 'Centrifuge')
      : convertedTokens.filter((token) => Number(token.chainId) === Number(selectedNetwork))
  }, [convertedTokens, selectedNetwork])

  const currentPortfolioValue = useMemo(
    () => tokens.reduce((sum, token) => sum.add(token.position.mul(token.tokenPrice)), Dec(0)),
    [tokens]
  )
  const realizedPL = useMemo(
    () => tokens.reduce((sum, token) => sum.add(token.realizedProfit?.toDecimal() ?? Dec(0)), Dec(0)),
    [tokens]
  )
  const unrealizedPL = useMemo(
    () => tokens.reduce((sum, token) => sum.add(token.unrealizedProfit?.toDecimal() ?? Dec(0)), Dec(0)),
    [tokens]
  )

  const yieldSinceInception = useMemo(() => {
    return tokens.reduce((sum, token) => sum.add(token.yieldSinceInception?.toDecimal() ?? Dec(0)), Dec(0))
  }, [tokens])

  const pageSummaryData = useMemo(
    () => [
      {
        label: 'Portfolio value',
        value: formatBalance(currentPortfolioValue || 0),
        children: (
          <Box backgroundColor={theme.colors.statusOkBg} padding="4px" borderRadius={4}>
            <Text
              variant="body4"
              color={yieldSinceInception?.isPositive() ? 'statusOk' : 'statusCritical'}
              style={{ fontWeight: 500 }}
            >
              {yieldSinceInception?.isPositive() ? '+' : '-'}
              {yieldSinceInception?.toPrecision(2)}
            </Text>
            <Text variant="body4" color={yieldSinceInception?.isPositive() ? 'statusOk' : 'statusCritical'}>
              Since inception
            </Text>
          </Box>
        ),
        heading: false,
      },
      { label: 'Realized P&L', value: formatBalance(realizedPL || 0), heading: false },
      { label: 'Unrealized P&L', value: formatBalance(unrealizedPL || 0), heading: false },
    ],
    [currentPortfolioValue, realizedPL, unrealizedPL, yieldSinceInception]
  )

  if (!transactions?.investorTransactions?.length) {
    return (
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
    )
  }

  return (
    <>
      <Box borderBottom={`1px solid ${theme.colors.borderPrimary}`} pb={1} mx={2} mb={2} />
      <AssetSummary data={pageSummaryData} />
      <Stack gap={4} m={4}>
        <Grid gridTemplateColumns={['1fr', '1fr 400px']} gap={4}>
          <CardPortfolioValue address={address} chainId={chainId} title="Portfolio performance" />
          <Stack border={`1px solid ${theme.colors.borderPrimary}`} borderRadius={8} p={1} px={2}>
            <Grid gridTemplateColumns={['1fr 1fr']} gap={2} alignItems="center">
              <Text variant="heading4">Available to invest</Text>
              <Select
                options={networks}
                hideBorder
                value={selectedNetwork}
                onChange={(e) => changeNetwork(e.target.value)}
              />
            </Grid>
            {selectedTokens.map((token, index) => (
              <Box
                key={index}
                borderBottom={`1px solid ${theme.colors.borderPrimary}`}
                display="flex"
                alignItems="center"
                pt={1}
                pb={1}
              >
                <TokenWithIcon {...token} hideCurrencyName />
                <Box>
                  <Text variant="body4">{token.currency.displayName}</Text>
                  <Text variant="heading1">{formatBalance(token.position)}</Text>
                </Box>
              </Box>
            ))}
          </Stack>
        </Grid>
        <Box>
          <Text variant="heading4">Investment positions</Text>
          <Holdings address={address} chainId={chainId} />
        </Box>
        <TransactionHistory address={centAddress} />
      </Stack>
    </>
  )
}
