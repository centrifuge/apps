import { Button, Drawer, Stack } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { useTheme } from 'styled-components'
import { LayoutBase } from '../../../components/LayoutBase'
import { LiquidityEpochSection } from '../../../components/LiquidityEpochSection'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { MaxReserveForm } from '../../../components/MaxReserveForm'
import { PageSection } from '../../../components/PageSection'
import { PageSummary } from '../../../components/PageSummary'
import { Tooltips } from '../../../components/Tooltips'
import { formatBalance } from '../../../utils/formatting'
import { useSuitableAccounts } from '../../../utils/usePermissions'
import { usePool } from '../../../utils/usePools'
import { PoolDetailHeader } from '../Header'

const CashDragChart = React.lazy(() => import('../../../components/Charts/CashDragChart'))
const LiquidityTransactionsSection = React.lazy(() => import('../../../components/LiquidityTransactionsSection'))

export function PoolDetailLiquidityTab() {
  return (
    <LayoutBase>
      <PoolDetailHeader />
      <LoadBoundary>
        <PoolDetailLiquidity />
      </LoadBoundary>
    </LayoutBase>
  )
}

export function PoolDetailLiquidity() {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const { colors } = useTheme()
  const [showReserveForm, setShowReserveForm] = React.useState(false)
  const [liquidityAdmin] = useSuitableAccounts({ poolId, poolRole: ['LiquidityAdmin'] })

  const pageSummaryData = [
    {
      label: <Tooltips type="poolReserve" />,
      value: formatBalance(pool.reserve.total.toDecimal() || 0, pool.currency.symbol || ''),
    },
    {
      label: <Tooltips type="maxReserve" />,
      value: formatBalance(pool.reserve.max.toDecimal() || 0, pool.currency.symbol || ''),
    },
  ]

  return (
    <>
      <Drawer isOpen={showReserveForm} onClose={() => setShowReserveForm(false)}>
        <LoadBoundary>
          <MaxReserveForm poolId={poolId} />
        </LoadBoundary>
      </Drawer>
      <PageSummary data={pageSummaryData}>
        {liquidityAdmin && (
          <Button variant="secondary" onClick={() => setShowReserveForm(true)} small>
            Set max reserve
          </Button>
        )}
      </PageSummary>
      {!('addresses' in pool) && (
        <>
          <LoadBoundary>
            <LiquidityTransactionsSection
              pool={pool}
              title="Originations & repayments"
              dataKeys={['sumRepaidAmountByPeriod', 'sumBorrowedAmountByPeriod']}
              dataNames={['Repayment', 'Origination']}
              dataColors={[colors.blueScale[200], colors.blueScale[400]]}
              tooltips={['repayment', 'origination']}
            />
          </LoadBoundary>

          <LoadBoundary>
            <LiquidityTransactionsSection
              pool={pool}
              title="Investments & redemptions"
              dataKeys={['sumInvestedAmountByPeriod', 'sumRedeemedAmountByPeriod']}
              dataNames={['Investment', 'Redemption']}
              dataColors={[colors.statusOk, colors.statusCritical]}
              tooltips={['investment', 'redemption']}
            />
          </LoadBoundary>

          <PageSection title="Cash drag">
            <Stack height="290px">
              <LoadBoundary>
                <CashDragChart />
              </LoadBoundary>
            </Stack>
          </PageSection>
        </>
      )}
      <LiquidityEpochSection pool={pool} />
    </>
  )
}
