import { evmToSubstrateAddress } from '@centrifuge/centrifuge-js'
import { formatBalance } from '@centrifuge/centrifuge-react'
import { Box, Select, Text, TextWithPlaceholder } from '@centrifuge/fabric'
import * as React from 'react'
import { useTheme } from 'styled-components'
import { Dec } from '../../utils/Decimal'
import { isEvmAddress } from '../../utils/address'
import { useTransactionsByAddress } from '../../utils/usePools'
import { Spinner } from '../Spinner'
import { useHoldings } from './Holdings'
import { PortfolioValue } from './PortfolioValue'

const rangeFilters = [
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'ytd', label: 'Year to date' },
  { value: 'all', label: 'All' },
]

type RangeValue = (typeof rangeFilters)[number]['value']

export function CardPortfolioValue({ address, chainId }: { address?: string; chainId?: number }) {
  const tokens = useHoldings(address, chainId)
  const centAddress = address && chainId && isEvmAddress(address) ? evmToSubstrateAddress(address, chainId) : address
  const { data: transactions, isLoading } = useTransactionsByAddress(centAddress)

  const { colors } = useTheme()

  const [range, setRange] = React.useState<RangeValue>('ytd')

  const currentPortfolioValue = tokens.reduce((sum, token) => sum.add(token.position.mul(token.tokenPrice)), Dec(0))

  return (
    <Box position="relative">
      <Box role="article" borderRadius="card" borderStyle="solid" borderWidth={1} borderColor="borderPrimary" p={2}>
        <Box>
          <Text variant="heading4">Overview</Text>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box alignContent="center" mb={2} mt={3}>
              <Box display="flex" alignItems="center">
                <Box backgroundColor={colors.textGold} height={10} width={10} borderRadius="50%" marginRight={1} />
                <Text variant="body3" color="textSecondary" style={{ fontWeight: 500 }}>
                  Portfolio value
                </Text>
              </Box>
              <TextWithPlaceholder isLoading={!currentPortfolioValue} variant="heading1">
                {formatBalance(currentPortfolioValue || 0)}
              </TextWithPlaceholder>
            </Box>
            <Select options={rangeFilters} onChange={(e) => setRange(e.target.value as RangeValue)} hideBorder />
          </Box>
          <Box width="100%" height={300} minHeight={300} position="relative">
            {isLoading && centAddress ? (
              <Box width="100%" height={300} display="flex" alignItems="center" justifyContent="center">
                <Spinner />
              </Box>
            ) : transactions?.investorTransactions.length ? (
              <PortfolioValue rangeValue={range} address={centAddress} />
            ) : (
              <Box width="100%" height="100%" display="flex" alignItems="center" justifyContent="center">
                <Text>No data available</Text>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
