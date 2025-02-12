import { Grid, GridRow, Shelf, Spinner, Stack, Text } from '@centrifuge/fabric'
import { useBalanceSheet } from '../hooks/useReport'

const poolId = '2779829532'

export function Report() {
  const { data, isLoading, isError } = useBalanceSheet(poolId)

  return (
    <Stack gap={2}>
      {isLoading ? (
        <Shelf justifyContent="center">
          <Spinner />
        </Shelf>
      ) : isError ? (
        <Shelf justifyContent="center">Data failed to load</Shelf>
      ) : (
        <Grid columns={5} width={1} gap={1}>
          <GridRow>
            <Text>Date</Text>
            <Text>Net asset value</Text>
            <Text>Onchain reserve</Text>
            <Text>Offchain cash</Text>
            <Text>Accrued fees</Text>
          </GridRow>
          {data?.map((entry) => (
            <GridRow key={entry.timestamp}>
              <Text>
                {new Date(entry.timestamp).toLocaleString('en', {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                })}
              </Text>
              <Text>{entry.netAssetValue.toFloat().toFixed(2)} USD</Text>
              <Text>{entry.onchainReserve.toFloat().toFixed(2)} USD</Text>
              <Text>{entry.offchainCash.toFloat().toFixed(2)} USD</Text>
              <Text>{entry.accruedFees.toFloat().toFixed(2)} USD</Text>
            </GridRow>
          ))}
        </Grid>
      )}
    </Stack>
  )
}
