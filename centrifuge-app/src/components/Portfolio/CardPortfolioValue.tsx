import { Box, Shelf, Stack, Text, TextWithPlaceholder } from '@centrifuge/fabric'
import * as React from 'react'
import styled, { useTheme } from 'styled-components'
import { config } from '../../config'
import { Dec } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useTransactionsByAddress } from '../../utils/usePools'
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
  // { value: 'all', label: 'All' },
] as const

export function CardPortfolioValue({ address }: { address?: string }) {
  const tokens = useHoldings(address)
  const transactions = useTransactionsByAddress(address)

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
      <Box
        role="article"
        borderRadius="card"
        borderStyle="solid"
        borderWidth={1}
        borderColor="borderSecondary"
        p={2}
        style={{
          boxShadow: `0px 3px 2px -2px ${colors.borderPrimary}`,
        }}
        background={colors.backgroundPage}
      >
        <Stack gap={2}>
          <Text variant="heading2">Overview</Text>

          <Shelf gap={1} alignContent="center" height="48px">
            <Box width="3px" backgroundColor="#1253FF" height="48px" />
            <Shelf gap={4}>
              <Stack gap="4px">
                <Text {...headingProps}>Current portfolio value</Text>
                <TextWithPlaceholder {...balanceProps} isLoading={!currentPortfolioValue}>
                  {formatBalance(currentPortfolioValue || 0, config.baseCurrency)}
                </TextWithPlaceholder>
              </Stack>
              {/* <Stack gap="4px">
                <Text {...headingProps}>Profit</Text>
                <TextWithPlaceholder {...balanceProps} isLoading={!portfolioValue} color="#519B10">
                  + {formatBalance(Dec(portfolioValue || 0), config.baseCurrency)}
                </TextWithPlaceholder>
              </Stack> */}
            </Shelf>
          </Shelf>
        </Stack>
        {address && transactions?.investorTransactions.length ? (
          <>
            <Stack gap={1}>
              <Shelf justifyContent="flex-end" pr="20px">
                {rangeFilters.map((rangeFilter, index) => (
                  <React.Fragment key={rangeFilter.label}>
                    <RangeFilterButton gap={1} onClick={() => setRange(rangeFilter)}>
                      <Text variant="body3">
                        <Text variant={rangeFilter.value === range.value && 'emphasized'}>{rangeFilter.label}</Text>
                      </Text>
                      <Box
                        width="100%"
                        backgroundColor={rangeFilter.value === range.value ? '#000000' : '#E0E0E0'}
                        height="3px"
                      />
                    </RangeFilterButton>
                    {index !== rangeFilters.length - 1 && (
                      <Box width="24px" backgroundColor="#E0E0E0" height="3px" alignSelf="flex-end" />
                    )}
                  </React.Fragment>
                ))}
              </Shelf>
            </Stack>

            <Box width="100%" height="300px">
              <PortfolioValue rangeValue={range.value} address={address} />
            </Box>
          </>
        ) : null}
      </Box>
    </Box>
  )
}
