import { Box, Shelf, Stack, Text, TextWithPlaceholder } from '@centrifuge/fabric'
import * as React from 'react'
import { useTheme } from 'styled-components'
import { config } from '../../config'
import { Dec } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useListedPools } from '../../utils/useListedPools'
import { DataPoint, PortfolioValue } from './PortfolioValue'

export function CardPortfolioValue() {
  const { colors } = useTheme()
  const [hovered, setHovered] = React.useState<DataPoint | undefined>(undefined)
  const [, listedTokens] = useListedPools()

  const chartHeight = 130
  const balanceProps = {
    as: 'strong',
    fontSize: [16, 18],
  }
  const headingProps = {
    as: 'p',
    variant: 'body3',
  }

  const totalValueLocked = React.useMemo(() => {
    return (
      listedTokens
        ?.map((tranche) => ({
          valueLocked: tranche.totalIssuance
            .toDecimal()
            .mul(tranche.tokenPrice?.toDecimal() ?? Dec(0))
            .toNumber(),
        }))
        .reduce((prev, curr) => prev.add(curr.valueLocked), Dec(0)) ?? Dec(0)
    )
  }, [listedTokens])

  return (
    <Box position="relative">
      <Box
        role="article"
        borderRadius="card"
        borderStyle="solid"
        borderWidth={1}
        borderColor="borderSecondary"
        p={3}
        pb={chartHeight * 0.6}
        style={{
          boxShadow: `0px 3px 2px -2px ${colors.borderPrimary}`,
        }}
        background={colors.backgroundPage}
      >
        <Stack>
          <Text variant="heading2">Overview</Text>

          <Shelf gap={4}>
            <Stack>
              <Text {...headingProps}>Current portfolio value</Text>
              <TextWithPlaceholder {...balanceProps} isLoading={!totalValueLocked}>
                {formatBalance(Dec(totalValueLocked || 0), config.baseCurrency)}
              </TextWithPlaceholder>
            </Stack>
            <Stack>
              <Text {...headingProps}>Profit</Text>
              <TextWithPlaceholder {...balanceProps} isLoading={!totalValueLocked}>
                {formatBalance(Dec(totalValueLocked || 0), config.baseCurrency)}
              </TextWithPlaceholder>
            </Stack>
          </Shelf>
        </Stack>

        <Box width="100%" height="300px">
          <PortfolioValue setHovered={setHovered} />
        </Box>
      </Box>
    </Box>
  )
}
