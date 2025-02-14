import { Route, Routes, useParams } from 'react-router-dom'
import { PoolChangesBanner } from '../../components/PoolChangesBanner'
import LoanPage from '../Loan'
import { IssuerPoolAccessPage } from './Access'
import { IssuerPoolAssetPage } from './Assets'
import { IssuerPoolConfigurationPage } from './Configuration'
import { IssuerPoolInvestorsPage } from './Investors'
import { IssuerPoolLiquidityPage } from './Liquidity'
import { IssuerPoolOverviewPage } from './Overview'
import { IssuerPoolFeesPage } from './PoolFees'
import { IssuerPoolPricingPage } from './Pricing'
import { IssuerPoolReportingPage } from './Reporting'

export default function IssuerPoolPage() {
  const { pid: poolId } = useParams<{ pid: string }>()

  if (!poolId) throw new Error('Pool not found')

  return (
    <>
      <Routes>
        <Route path="/" element={<IssuerPoolOverviewPage />} />
        <Route path="configuration" element={<IssuerPoolConfigurationPage />} />
        <Route path="investors" element={<IssuerPoolInvestorsPage />} />
        <Route path="access" element={<IssuerPoolAccessPage />} />
        <Route path="assets/:aid" element={<LoanPage />} />
        <Route path="assets" element={<IssuerPoolAssetPage />} />
        <Route path="liquidity" element={<IssuerPoolLiquidityPage />} />
        <Route path="reporting" element={<IssuerPoolReportingPage />} />
        <Route path="reporting/:report" element={<IssuerPoolReportingPage />} />
        <Route path="data" element={<IssuerPoolReportingPage />} />
        <Route path="data/:report" element={<IssuerPoolReportingPage />} />
        <Route path="pricing" element={<IssuerPoolPricingPage />} />
        <Route path="fees" element={<IssuerPoolFeesPage />} />
      </Routes>
      <PoolChangesBanner poolId={poolId} />
    </>
  )
}
