import { evmToSubstrateAddress } from '@centrifuge/centrifuge-js'
import { Box, Select, Stack, Text, TextWithPlaceholder } from '@centrifuge/fabric'
import * as React from 'react'
import styled, { useTheme } from 'styled-components'
import { Dec } from '../../utils/Decimal'
import { isEvmAddress } from '../../utils/address'
import { formatBalance } from '../../utils/formatting'
import { useTransactionsByAddress } from '../../utils/usePools'
import { LoadBoundary } from '../LoadBoundary'
import { useHoldings } from './Holdings'
import { PortfolioValue } from './PortfolioValue'

const RangeFilterButton = styled(Stack)`
  &:hover {
    cursor: pointer;
  }
`

const rangeFilters = [
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'ytd', label: 'Year to date' },
  { value: 'all', label: 'All' },
]

export function CardPortfolioValue({
  address,
  chainId,
  showGraph = true,
}: {
  address?: string
  chainId?: number
  showGraph?: boolean
}) {
  const tokens = useHoldings(address, chainId)
  const centAddress = address && chainId && isEvmAddress(address) ? evmToSubstrateAddress(address, chainId) : address
  const transactions = useTransactionsByAddress(showGraph ? centAddress : undefined)

  const { colors } = useTheme()

  const [range, setRange] = React.useState<(typeof rangeFilters)[number]>({ value: 'ytd', label: 'Year to date' })

  const currentPortfolioValue = tokens.reduce((sum, token) => sum.add(token.position.mul(token.tokenPrice)), Dec(0))

  const balanceProps = {
    as: 'strong',
    fontSize: [16, 18],
  }
  const headingProps = {
    as: 'p',
    variant: 'body3',
  }

  return (
    <Box position="relative">
      <Box role="article" borderRadius="card" borderStyle="solid" borderWidth={1} borderColor="borderPrimary" p={2}>
        <Box>
          <Text variant="heading3">Overview</Text>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box alignContent="center" mb={2} mt={3}>
              <Box display="flex" alignItems="center">
                <Box backgroundColor={colors.textGold} height={10} width={10} borderRadius="50%" marginRight={1} />
                <Text variant="body3" color="textSecondary" style={{ fontWeight: 500 }}>
                  Portfolio value
                </Text>
              </Box>
              <TextWithPlaceholder {...balanceProps} isLoading={!currentPortfolioValue} variant="heading">
                <Text variant="heading1">{formatBalance(currentPortfolioValue || 0)}</Text>
              </TextWithPlaceholder>
            </Box>
            <Select options={rangeFilters} onChange={setRange} hideBorder />
          </Box>
          {showGraph && centAddress && transactions?.investorTransactions.length ? (
            <>
              <Box width="100%" height="300px">
                <LoadBoundary>
                  {transactions?.investorTransactions.length ? (
                    <PortfolioValue rangeValue={range.value} address={centAddress} />
                  ) : (
                    <Box width="100%" height="100%" display="flex" alignItems="center" justifyContent="center">
                      <Text>No data available</Text>
                    </Box>
                  )}
                </LoadBoundary>
              </Box>
            </>
          ) : null}
        </Box>
      </Box>
    </Box>
  )
}
