import { Stack, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import * as React from 'react'
import { useRouteMatch } from 'react-router'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { DataTableCol, DataTableRow } from '../components/DataTable'
import { PageWithSideBar } from '../components/shared/PageWithSideBar'
import { useLoans } from '../utils/useLoans'
import { usePool } from '../utils/usePools'

export const PoolPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <Pool />
    </PageWithSideBar>
  )
}

const Pool: React.FC = () => {
  const {
    params: { pid: poolId },
  } = useRouteMatch<{ pid: string }>()
  const { data: pool } = usePool(poolId)
  const { data: loans } = useLoans(poolId)

  const centrifuge = useCentrifuge()

  return (
    <Stack gap={8} flex={1}>
      <Stack gap={3}>
        <Text variant="heading2" as="h2">
          Tranches
        </Text>
        {pool &&
          (pool as any).tranches.map((tranche: any) => (
            <DataTableRow key={tranche.name}>
              <DataTableCol>{tranche.name}</DataTableCol>
              <DataTableCol>
                {centrifuge.utils.formatPercentage(
                  tranche.minSubordinationRatio,
                  new BN(10).pow(new BN(18)).toString()
                )}
              </DataTableCol>
              <DataTableCol>{centrifuge.utils.feeToApr(tranche.interestPerSec)}</DataTableCol>
              <DataTableCol>{centrifuge.utils.formatRatio(tranche.price)}</DataTableCol>
              <DataTableCol>{centrifuge.utils.formatCurrencyAmount(tranche.totalIssuance)}</DataTableCol>
            </DataTableRow>
          ))}
      </Stack>
      <Stack gap={3}>
        <Text variant="heading2" as="h2">
          Assets
        </Text>
        {loans?.map((loan: any) => (
          <DataTableRow key={loan.id}>
            <DataTableCol>{loan.id}</DataTableCol>
            <DataTableCol>{centrifuge.utils.formatCurrencyAmount(loan.outstandingDebt)}</DataTableCol>
            <DataTableCol>{loan.status}</DataTableCol>
          </DataTableRow>
        ))}
      </Stack>
    </Stack>
  )
}
