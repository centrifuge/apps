import { Box, Shelf, Stack, Text } from '@centrifuge/fabric'
import { InvestButton, Token } from '../pages/Pool/Overview'
import { daysBetween } from '../utils/date'
import { formatPercentage } from '../utils/formatting'
import { Tooltips, tooltipText } from './Tooltips'

export const TrancheTokenCards = ({
  trancheTokens,
  poolId,
  createdAt,
}: {
  trancheTokens: Token[]
  poolId: string
  createdAt: string | null
}) => (
  <Shelf gap={3}>
    {trancheTokens?.map((trancheToken) => (
      <TrancheTokenCard trancheToken={trancheToken} key={trancheToken.id} poolId={poolId} createdAt={createdAt} />
    ))}
  </Shelf>
)

const TrancheTokenCard = ({
  trancheToken,
  poolId,
  createdAt,
}: {
  trancheToken: Token
  poolId: string
  createdAt: string | null
}) => {
  const daysSinceCreation = createdAt ? daysBetween(new Date(createdAt), new Date()) : 0
  const trancheSeniority = trancheToken.seniority === 0 ? 'juniorTrancheYields' : 'seniorTokenAPR'
  const aprTooltipBody = `${
    trancheToken.seniority === 0 ? tooltipText.juniorTrancheYields.body : tooltipText.seniorTokenAPR.body
  }${daysSinceCreation < 30 ? ' APR displayed after 30 days following token launch.' : ''}`

  return (
    <Box p={2} backgroundColor="backgroundButtonSecondary" borderRadius="card" width="540px">
      <Stack height="100%" justifyContent="space-between" gap={2}>
        <Text fontSize="12px" variant="body3">
          {trancheToken.name} ({trancheToken.symbol})
        </Text>
        <Shelf justifyContent="space-between" alignItems="flex-end">
          <Shelf gap={2} alignItems="flex-end">
            <Stack gap={1}>
              <Tooltips type={trancheSeniority} body={aprTooltipBody} />
              <Text fontSize="30px" variant="body3">
                {daysSinceCreation >= 30 ? formatPercentage(trancheToken.apr) : 'N/A'}
              </Text>
            </Stack>
            <Stack gap={1}>
              <Tooltips variant="secondary" type="subordination" />
              <Text variant="body2">
                {trancheToken.subordination ? formatPercentage(trancheToken.subordination) : 'N/A'}
              </Text>
            </Stack>
          </Shelf>
          <InvestButton poolId={poolId} trancheId={trancheToken.id} />
        </Shelf>
      </Stack>
    </Box>
  )
}
