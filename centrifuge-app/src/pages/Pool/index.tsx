import { Route, Routes } from 'react-router-dom'
import { PoolDetailOverviewTab } from './Overview'
import { PoolDetailReportingTab } from './Reporting'

export default function PoolDetailPage() {
  return (
    <Routes>
      <Route path="/" element={<PoolDetailOverviewTab />} />
      <Route path="reporting/:report" element={<PoolDetailReportingTab />} />
      <Route path="data/:report" element={<PoolDetailReportingTab />} />
      <Route path="reporting" element={<PoolDetailReportingTab />} />
      <Route path="data" element={<PoolDetailReportingTab />} />
    </Routes>
  )
}
