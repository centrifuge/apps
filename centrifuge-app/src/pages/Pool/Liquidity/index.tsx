import { Button, Drawer } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { useTheme } from 'styled-components'
import { LiquidityEpochSection } from '../../../components/LiquidityEpochSection'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { MaxReserveForm } from '../../../components/MaxReserveForm'
import { PageSummary } from '../../../components/PageSummary'
import { Tooltips } from '../../../components/Tooltips'
import { formatBalance } from '../../../utils/formatting'
import { useSuitableAccounts } from '../../../utils/usePermissions'
import { usePool } from '../../../utils/usePools'
import { PoolDetailHeader } from '../Header'

const LiquidityTransactionsSection = React.lazy(() => import('../../../components/LiquidityTransactionsSection'))

export function PoolDetailLiquidityTab() {
  return (
    <>
      <PoolDetailHeader />
      <LoadBoundary>
        <PoolDetailLiquidity />
      </LoadBoundary>
    </>
  )
}

export function PoolDetailLiquidity() {
  const { pid: poolId } = useParams<{ pid: string }>()

  if (!poolId) throw new Error('Pool not found')

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
          <LiquidityTransactionsSection
            pool={pool}
            title="Originations & repayments"
            dataKeys={['sumRepaidAmountByPeriod', 'sumBorrowedAmountByPeriod']}
            dataNames={['Repayment', 'Origination']}
            dataColors={[colors.grayScale[500], colors.blueScale[500]]}
            tooltips={['repayment', 'origination']}
          />

          <LiquidityTransactionsSection
            pool={pool}
            title="Investments & redemptions"
            dataKeys={['sumInvestedAmountByPeriod', 'sumRedeemedAmountByPeriod']}
            dataNames={['Investment', 'Redemption']}
            dataColors={[colors.statusOk, colors.statusCritical]}
            tooltips={['investment', 'redemption']}
          />
          {/* 
          <PageSection title="Cash drag">
            <Stack height="290px">
              <LoadBoundary>
                <CashDragChart />
              </LoadBoundary>
            </Stack>
          </PageSection> */}
        </>
      )}
      <LiquidityEpochSection pool={pool} />
    </>
  )
}
