import { Route, Routes } from 'react-router-dom'
import { PoolDetailAssetsTab } from './Assets'
import { PoolDetailLiquidityTab } from './Liquidity'
import { PoolDetailOverviewTab } from './Overview'
import { PoolFeesTab } from './PoolFees'
import { PoolDetailReportingTab } from './Reporting'

export default function PoolDetailPage() {
  return (
    <Routes>
      <Route path="/" element={<PoolDetailOverviewTab />} />
      <Route path="reporting/:report" element={<PoolDetailReportingTab />} />
      <Route path="reporting" element={<PoolDetailReportingTab />} />
      <Route path="liquidity" element={<PoolDetailLiquidityTab />} />
      <Route path="assets" element={<PoolDetailAssetsTab />} />
      <Route path="fees" element={<PoolFeesTab />} />
    </Routes>
  )
}
