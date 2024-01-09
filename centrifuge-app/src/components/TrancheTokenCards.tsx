import { Box, Button, Shelf, Stack, Text } from '@centrifuge/fabric'
import { Token } from '../pages/Pool/Overview'
import { formatPercentage } from '../utils/formatting'
import { Tooltips } from './Tooltips'

export const TrancheTokenCards = ({ trancheTokens }: { trancheTokens: Token[] }) => {
  return (
    <Shelf gap={3}>
      {trancheTokens?.map((token) => (
        <TrancheTokenCard token={token} key={token.id} />
      ))}
    </Shelf>
  )
}

const TrancheTokenCard = ({ token }: { token: Token }) => {
  const trancheSeniority = token.seniority === 0 ? 'juniorTrancheYields' : 'seniorTokenAPR'

  return (
    <Box p={2} backgroundColor="backgroundButtonSecondary" borderRadius="card" width="540px">
      <Stack height="100%" justifyContent="space-between" gap={2}>
        <Text fontSize="12px" variant="body3">
          {token.name} ({token.symbol})
        </Text>
        <Shelf justifyContent="space-between" alignItems="flex-end">
          <Shelf gap={2} alignItems="flex-end">
            <Stack gap={1}>
              <Tooltips type={trancheSeniority} />
              <Text fontSize="30px" variant="body3">
                {formatPercentage(token.apr)}
              </Text>
            </Stack>
            <Stack gap={1}>
              <Tooltips variant="secondary" type="subordination" />
              <Text variant="body2">0%</Text>
            </Stack>
          </Shelf>
          <Button>Invest</Button>
        </Shelf>
      </Stack>
    </Box>
  )
}
