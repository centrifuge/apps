import { Box, Shelf, Stack, Text } from '@centrifuge/fabric'
import { InvestButton, Token } from '../pages/Pool/Overview'
import { daysBetween } from '../utils/date'
import { formatBalance, formatPercentage } from '../utils/formatting'
import { Tooltips, tooltipText } from './Tooltips'

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
}) => (
  <Shelf gap={3}>
    {trancheTokens?.map((trancheToken) => (
      <TrancheTokenCard
        trancheToken={trancheToken}
        key={trancheToken.id}
        poolId={poolId}
        createdAt={createdAt}
        numOfTrancheTokens={trancheTokens?.length}
        poolCurrencySymbol={poolCurrencySymbol}
      />
    ))}
  </Shelf>
)

const TrancheTokenCard = ({
  trancheToken,
  poolId,
  createdAt,
  numOfTrancheTokens,
  poolCurrencySymbol,
}: {
  trancheToken: Token
  poolId: string
  createdAt: string | null
  numOfTrancheTokens: number
  poolCurrencySymbol: string
}) => {
  const isTinlakePool = poolId.startsWith('0x')
  const daysSinceCreation = createdAt ? daysBetween(new Date(createdAt), new Date()) : 0
  const trancheSeniority = trancheToken.seniority === 0 ? 'juniorTrancheYields' : 'seniorTokenAPR'
  const aprTooltipBody = `${
    trancheToken.seniority === 0 ? tooltipText.juniorTrancheYields.body : tooltipText.seniorTokenAPR.body
  }${daysSinceCreation < 30 && !isTinlakePool ? ' APR displayed after 30 days following token launch.' : ''}`

  const calculateApr = () => {
    if (isTinlakePool) {
      return trancheToken.seniority === 0 ? 'N/A' : formatPercentage(trancheToken.apr)
    }

    if (daysSinceCreation < 30) {
      return 'N/A'
    }

    return formatPercentage(trancheToken.apr)
  }

  return (
    <Box p={2} backgroundColor="backgroundButtonSecondary" borderRadius="card" width={'100%'}>
      <Stack height="100%" justifyContent="space-between" gap={2}>
        <Text fontSize="12px" variant="body3">
          {trancheToken.name} ({trancheToken.symbol})
        </Text>
        <Shelf justifyContent="space-between" alignItems="flex-end" gap={1}>
          <Shelf gap={numOfTrancheTokens === 1 ? 5 : 2} alignItems="flex-end">
            <Stack gap={1} paddingRight={numOfTrancheTokens === 1 ? 3 : 0}>
              <Tooltips type={trancheSeniority} body={aprTooltipBody} />
              <Text fontSize="30px" variant="body3">
                {calculateApr()}
              </Text>
            </Stack>
            <Stack gap={1}>
              <Tooltips variant="secondary" type="subordination" />
              <Text variant="body2">{formatPercentage(trancheToken.protection)}</Text>
            </Stack>
            <Stack gap={1}>
              <Tooltips variant="secondary" type="tokenPrice" />
              <Text variant="body2">{formatBalance(trancheToken.tokenPrice || 0, trancheToken.symbol, 2, 2)}</Text>
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
