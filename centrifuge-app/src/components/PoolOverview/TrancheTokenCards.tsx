import { Perquintill } from '@centrifuge/centrifuge-js'
import { Box, Shelf, Stack, Text } from '@centrifuge/fabric'
import { InvestButton, Token } from '../../pages/Pool/Overview'
import { daysBetween } from '../../utils/date'
import { formatBalance, formatPercentage } from '../../utils/formatting'
import { useIsAboveBreakpoint } from '../../utils/useIsAboveBreakpoint'
import { Tooltips } from '../Tooltips'

export const TrancheTokenCards = ({
  trancheTokens,
  poolId,
  createdAt,
  poolCurrencySymbol,
}: {
  trancheTokens: Token[]
  poolId: string
  createdAt: string | null
  poolCurrencySymbol: string
}) => {
  const seniorTranche = Math.max(...trancheTokens.map((trancheToken) => trancheToken.seniority))
  const getTrancheText = (trancheToken: Token) => {
    if (seniorTranche === trancheToken.seniority) return 'senior'
    if (trancheToken.seniority === 0) return 'junior'
    return 'mezzanine'
  }

  return (
    <Shelf gap={3}>
      {trancheTokens?.map((trancheToken) => (
        <TrancheTokenCard
          trancheToken={trancheToken}
          key={trancheToken.id}
          poolId={poolId}
          createdAt={createdAt}
          numOfTrancheTokens={trancheTokens?.length}
          poolCurrencySymbol={poolCurrencySymbol}
          trancheText={getTrancheText(trancheToken)}
        />
      ))}
    </Shelf>
  )
}

const TrancheTokenCard = ({
  trancheToken,
  poolId,
  createdAt,
  numOfTrancheTokens,
  poolCurrencySymbol,
  trancheText,
}: {
  trancheToken: Token
  poolId: string
  createdAt: string | null
  numOfTrancheTokens: number
  poolCurrencySymbol: string
  trancheText: 'senior' | 'junior' | 'mezzanine'
}) => {
  const isMedium = useIsAboveBreakpoint('M')

  const isTinlakePool = poolId.startsWith('0x')
  const daysSinceCreation = createdAt ? daysBetween(new Date(createdAt), new Date()) : 0
  const apyTooltipBody =
    poolId === '4139607887'
      ? 'Based on 3-month to 6-month T-Bills returns.'
      : poolId === '1655476167'
      ? 'Based on the return of the underlying funds'
      : `The 30d ${trancheText} yield is the effective annualized return of the pool's ${trancheText} token over the last 30 days.${
          daysSinceCreation < 30 && !isTinlakePool ? ' APY displayed after 30 days following token launch.' : ''
        }`

  const calculateApy = () => {
    if (poolId === '4139607887') return formatPercentage(5)
    if (poolId === '1655476167') return formatPercentage(15)
    if (isTinlakePool && trancheText === 'senior') return formatPercentage(trancheToken.apy)
    if (daysSinceCreation < 30 || !trancheToken.yield30DaysAnnualized) return 'N/A'
    return formatPercentage(new Perquintill(trancheToken.yield30DaysAnnualized))
  }

  return (
    <Box p={2} backgroundColor="backgroundButtonSecondary" borderRadius="card" width="100%" overflow="auto">
      <Stack height="100%" justifyContent="space-between" gap={2}>
        <Text fontSize="12px" variant="body3">
          {trancheToken.name} ({trancheToken.symbol})
        </Text>
        <Shelf
          justifyContent="space-between"
          alignItems="flex-start"
          gap={[2, 2, 1]}
          flexDirection={['column', 'column', 'row']}
        >
          <Shelf gap={numOfTrancheTokens === 1 ? 5 : 2} alignItems="flex-end">
            <Stack gap={1} paddingRight={numOfTrancheTokens === 1 ? 3 : 0}>
              <Tooltips
                label={`${['1655476167', '4139607887'].includes(poolId) ? 'Target ' : ''}APY`}
                body={apyTooltipBody}
              />
              <Text fontSize={[14, 20, 30]} variant="body3" style={{ whiteSpace: 'nowrap' }}>
                {calculateApy()}
              </Text>
            </Stack>
            {isMedium && (
              <Stack gap={1}>
                <Tooltips variant="secondary" type="subordination" />
                <Text variant="body2">{formatPercentage(trancheToken.protection)}</Text>
              </Stack>
            )}
            <Stack gap={1}>
              <Box pb="3px">
                <Text textAlign="left" variant="label2" color="textSecondary">
                  Token price
                </Text>
              </Box>
              <Text variant="body2">{formatBalance(trancheToken.tokenPrice || 0, poolCurrencySymbol, 5, 5)}</Text>
            </Stack>
            <Stack gap={1}>
              <Tooltips variant="secondary" type="valueLocked" />
              <Text variant="body2">{formatBalance(trancheToken.valueLocked, poolCurrencySymbol)}</Text>
            </Stack>
          </Shelf>
          <InvestButton poolId={poolId} trancheId={trancheToken.id} />
        </Shelf>
      </Stack>
    </Box>
  )
}
