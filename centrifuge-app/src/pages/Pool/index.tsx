import { Route, Routes } from 'react-router-dom'
import { useDebugFlags } from '../../../src/components/DebugFlags'
import { PoolDetailAssetsTab } from './Assets'
import { PoolDetailOverviewTab } from './Overview'
import { PoolDetailReportingTab } from './Reporting'

export default function PoolDetailPage() {
  const { showData } = useDebugFlags()
  return (
    <Routes>
      <Route path="/" element={<PoolDetailOverviewTab />} />
      {showData && <Route path="data" element={<PoolDetailReportingTab />} />}
      <Route path="reporting/:report" element={<PoolDetailReportingTab />} />
      {showData && <Route path="data/:report" element={<PoolDetailReportingTab />} />}
      <Route path="reporting" element={<PoolDetailReportingTab />} />
      <Route path="assets" element={<PoolDetailAssetsTab />} />
    </Routes>
  )
}
