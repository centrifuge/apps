import { useParams } from 'react-router'
import { LayoutBase } from '../../components/LayoutBase'
import { PageSummary } from '../../components/PageSummary'
import { Tooltips } from '../../components/Tooltips'
import { formatBalance } from '../../utils/formatting'
import { usePool } from '../../utils/usePools'

import { NavManagementAssetTable } from './NavManagementAssetTable'
import { NavManagementHeader } from './NavManagementHeader'

export default function NavManagementOverviewPage() {
  const { pid } = useParams<{ pid: string }>()
  const pool = usePool(pid, false)
  return (
    <LayoutBase>
      <NavManagementHeader />
      <PageSummary
        data={[
          {
            label: <Tooltips type="totalNav" />,
            value: formatBalance(pool?.nav.total ?? 0, pool?.currency.symbol),
          },
          {
            label: 'Investments',
            value: formatBalance(pool?.nav.total ?? 0, pool?.currency.symbol),
          },
          {
            label: 'Redemptions',
            value: formatBalance(pool?.nav.total ?? 0, pool?.currency.symbol),
          },
        ]}
      />
      <NavManagementAssetTable key={pid} poolId={pid} />
    </LayoutBase>
  )
}
