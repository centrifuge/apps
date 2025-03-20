import { evmToSubstrateAddress } from '@centrifuge/centrifuge-js'
import { useWallet } from '@centrifuge/centrifuge-react'
import { Box, Button, Grid, IconWallet, Select, Shelf, Stack, Text } from '@centrifuge/fabric'
import { useMemo, useState } from 'react'
import styled, { useTheme } from 'styled-components'
import { LayoutSection } from '../../components/LayoutBase/LayoutSection'
import { CardPortfolioValue } from '../../components/Portfolio/CardPortfolioValue'
import { Holdings, TokenWithIcon, useHoldings } from '../../components/Portfolio/Holdings'
import { RouterLinkButton } from '../../components/RouterLinkButton'
import { evmChains } from '../../config'
import { Dec } from '../../utils/Decimal'
import { isEvmAddress } from '../../utils/address'
import { formatBalance } from '../../utils/formatting'
import { useAddress } from '../../utils/useAddress'
import { useTransactionsByAddress } from '../../utils/usePools'
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
  const address = useAddress()
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
  const centAddress = isEvmAddress(address) && chainId ? evmToSubstrateAddress(address, chainId) : address
  const { data: transactions } = useTransactionsByAddress(centAddress)
  const tokens = useHoldings(address, chainId)

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
          <Box backgroundColor={theme.colors.statusOkBg} padding="4px" borderRadius={4} mr={2}>
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
      <PortfolioSummary data={pageSummaryData} />
      <Stack gap={4} m={2}>
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

type Props = {
  data?: {
    label: React.ReactNode
    value: React.ReactNode
    heading: boolean
    children?: React.ReactNode
  }[]
  children?: React.ReactNode
}

export function PortfolioSummary({ data, children }: Props) {
  const theme = useTheme()
  return (
    <Stack
      bg={theme.colors.backgroundSecondary}
      border={`1px solid ${theme.colors.borderSecondary}`}
      borderRadius={10}
      padding={2}
      mx={[2, 2, 2, 2, 5]}
    >
      <Shelf gap={4}>
        {data?.map(({ label, value, heading, children }, index) => (
          <Stack key={`${value}-${label}-${index}`}>
            <Text variant={heading ? 'body2' : 'body3'} color="textSecondary" style={{ margin: 0, padding: 0 }}>
              {label}
            </Text>
            <Box display="flex" alignItems="center">
              <Text variant={heading ? 'heading' : 'heading1'} style={{ marginRight: 8 }}>
                {value}
              </Text>
              {children && children}
            </Box>
          </Stack>
        ))}
        {children}
      </Shelf>
    </Stack>
  )
}
