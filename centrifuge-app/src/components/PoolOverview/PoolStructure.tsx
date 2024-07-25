import { Rate } from '@centrifuge/centrifuge-js'
import { Box, Card, Grid, Stack, Text, Tooltip } from '@centrifuge/fabric'
import capitalize from 'lodash/capitalize'
import { formatPercentage } from '../../utils/formatting'

type Props = {
  numOfTranches: number
  poolId: string
  poolStatus?: string
  poolFees: {
    fee: Rate
    name: string
    id: number
  }[]
}

export const PoolStructure = ({ numOfTranches, poolStatus, poolFees }: Props) => {
  const metrics = [
    {
      metric: 'Pool type',
      value: capitalize(poolStatus),
    },
    {
      metric: 'Pool structure',
      value: 'Revolving pool',
    },
    {
      metric: 'Tranche structure',
      value: numOfTranches === 1 ? 'Unitranche' : `${numOfTranches} tranches`,
    },
    ...poolFees.map((fee) => {
      return {
        metric: fee.name,
        value: formatPercentage(fee.fee.toPercent(), true, {}, 3),
      }
    }),
  ]

  const getValue = (metric: string, value: string) => {
    if (metric === 'Pool structure')
      return (
        <Tooltip body="Investment and redemption orders can come in at any time, and assets can be financed and repaid continuously.">
          <Text variant="label2" color="textPrimary">
            {value}
          </Text>
        </Tooltip>
      )
    if (metric === 'Tranche structure')
      return (
        <Tooltip body="For each tranche, tokens are issued that investors receive, representing interests in the tranches of the pool.">
          <Text variant="label2" color="textPrimary">
            {value}
          </Text>
        </Tooltip>
      )

    if (metric === 'Pool type' && value === 'Open')
      return (
        <Tooltip body="An open pool that allows for a broader distribution to third-party investors as well as DeFi protocols. These pools have multiple unrelated token holders and can onboard third party investors.">
          <Text variant="label2" color="textPrimary">
            Open
          </Text>
        </Tooltip>
      )
    return (
      <Text variant="body3" textOverflow="ellipsis" whiteSpace="nowrap">
        {value}
      </Text>
    )
  }

  return (
    <Card p={3}>
      <Stack gap={2}>
        <Text fontSize="18px" fontWeight="500">
          Structure
        </Text>
        <Box borderStyle="solid" borderWidth="1px" borderColor="borderPrimary">
          {metrics.map(({ metric, value }, index) => (
            <Grid
              borderBottomStyle={index === metrics.length - 1 ? 'none' : 'solid'}
              borderBottomWidth={index === metrics.length - 1 ? '0' : '1px'}
              borderBottomColor={index === metrics.length - 1 ? 'none' : 'borderPrimary'}
              height={32}
              key={index}
              px={1}
              gridTemplateColumns="1fr 1fr"
              width="100%"
              alignItems="center"
              gap={2}
            >
              <Text variant="body3" textOverflow="ellipsis" whiteSpace="nowrap">
                {metric}
              </Text>
              {getValue(metric, value)}
            </Grid>
          ))}
        </Box>
      </Stack>
    </Card>
  )
}
