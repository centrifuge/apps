import { Box, Stack, Text, TextWithPlaceholder, Tooltip } from '@centrifuge/fabric'
import * as React from 'react'
import { useTheme } from 'styled-components'
import { config } from '../config'
import { formatDate } from '../utils/date'
import { Dec } from '../utils/Decimal'
import { formatBalance } from '../utils/formatting'
import { useListedPools } from '../utils/useListedPools'
import { DataPoint, TotalValueLocked } from './Charts/TotalValueLocked'
import { tooltipText } from './Tooltips'

export function CardTotalValueLocked() {
  const { colors } = useTheme()
  const [hovered, setHovered] = React.useState<DataPoint | undefined>(undefined)
  const [, listedTokens] = useListedPools()

  const chartHeight = 100
  const balanceProps = {
    as: 'strong',
    fontSize: [28, 32],
  }
  const headingProps = {
    as: 'h2',
    variant: 'heading3',
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
    <Box
      role="article"
      borderRadius="card"
      borderStyle="solid"
      borderWidth={1}
      borderColor="borderSecondary"
      p={3}
      pb={chartHeight * 0.6}
      position="relative"
      style={{
        boxShadow: `0px 3px 2px -2px ${colors.borderPrimary}`,
      }}
    >
      <Stack style={{ pointerEvents: 'none' }}>
        {hovered ? (
          <>
            <Text {...headingProps}>
              TVL on{' '}
              <time dateTime={new Date(hovered.dateInMilliseconds).toISOString()}>
                {formatDate(hovered.dateInMilliseconds)}
              </time>
            </Text>
            <Text {...balanceProps}>{formatBalance(Dec(hovered?.tvl || 0), config.baseCurrency)}</Text>
          </>
        ) : (
          <>
            <Tooltip body={tooltipText.tvl.body} style={{ pointerEvents: 'auto' }}>
              <Text {...headingProps}>{tooltipText.tvl.label}</Text>
            </Tooltip>
            <TextWithPlaceholder {...balanceProps} isLoading={!totalValueLocked}>
              {formatBalance(Dec(totalValueLocked || 0), config.baseCurrency)}
            </TextWithPlaceholder>
          </>
        )}
      </Stack>

      <Box
        as="figure"
        position="absolute"
        right={0}
        bottom={0}
        width="100%"
        height={chartHeight}
        overflow="hidden"
        borderBottomRightRadius="card"
        borderBottomLeftRadius="card"
      >
        <TotalValueLocked setHovered={setHovered} chainTVL={totalValueLocked} />
      </Box>
    </Box>
  )
}
