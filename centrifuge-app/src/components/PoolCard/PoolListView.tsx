import { Box, Grid, Text } from '@centrifuge/fabric'
import { useTheme } from 'styled-components'
import { PoolCardProps } from '.'
import { formatBalance, formatPercentage } from '../../../src/utils/formatting'
import { PoolStatus } from './PoolStatus'

export const PoolListView = ({
  poolId,
  assetClass,
  valueLocked,
  iconUri,
  tranches,
  name,
  currencySymbol,
  status,
  createdAt,
  ...pool
}: PoolCardProps) => {
  const theme = useTheme()
  const calculateApy = () => {
    const APR = tranches?.find((tranche) => tranche.interestRatePerSec)?.interestRatePerSec
    if (APR) return formatPercentage(APR.toAprPercent(), true, {}, 1)
    else return '-'
  }
  return (
    <Grid
      gridTemplateColumns={['24px 1fr 1fr 1fr 70px 70px']}
      alignItems="center"
      border={`1px solid ${theme.colors.borderPrimary}`}
      borderRadius={8}
      padding={2}
      boxShadow={`0 -1px 0 ${theme.colors.borderPrimary}`}
      gap={1}
    >
      <Box as="img" width="iconMedium" height="iconMedium" src={iconUri} borderRadius={4} />
      <Text variant="body2">{name}</Text>
      <Text variant="body2">{assetClass}</Text>
      <Text variant="body2">{formatBalance(valueLocked || 0, currencySymbol)}</Text>
      <Text>{calculateApy()}</Text>
      <PoolStatus status={status} />
    </Grid>
  )
}
