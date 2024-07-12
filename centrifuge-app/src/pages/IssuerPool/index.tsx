import { Route, Routes, useParams } from 'react-router-dom'
import { PoolChangesBanner } from '../../components/PoolChangesBanner'
import { IssuerPoolAccessPage } from './Access'
import { IssuerPoolAssetPage } from './Assets'
import { IssuerPoolConfigurationPage } from './Configuration'
import { IssuerPoolCreateLoanTemplatePage } from './Configuration/CreateLoanTemplate'
import { IssuerPoolViewLoanTemplatePage } from './Configuration/ViewLoanTemplate'
import { IssuerPoolInvestorsPage } from './Investors'
import { IssuerPoolLiquidityPage } from './Liquidity'
import { IssuerPoolOverviewPage } from './Overview'
import { IssuerPoolFeesPage } from './PoolFees'
import { IssuerPoolPricingPage } from './Pricing'
import { IssuerPoolReportingPage } from './Reporting'

export default function IssuerPoolPage() {
  const { pid: poolId } = useParams<{ pid: string }>()
  return (
    <>
      <Routes>
        <Route path="/" element={<IssuerPoolOverviewPage />} />
        <Route path="configuration/view-asset-template/:sid" element={<IssuerPoolViewLoanTemplatePage />} />
        <Route path="configuration/create-asset-template" element={<IssuerPoolCreateLoanTemplatePage />} />
        <Route path="configuration" element={<IssuerPoolConfigurationPage />} />
        <Route path="investors" element={<IssuerPoolInvestorsPage />} />
        <Route path="access" element={<IssuerPoolAccessPage />} />
        <Route path="assets" element={<IssuerPoolAssetPage />} />
        <Route path="liquidity" element={<IssuerPoolLiquidityPage />} />
        <Route path="reporting" element={<IssuerPoolReportingPage />} />
        <Route path="reporting/:report" element={<IssuerPoolReportingPage />} />
        <Route path="pricing" element={<IssuerPoolPricingPage />} />
        <Route path="fees" element={<IssuerPoolFeesPage />} />
      </Routes>
      <PoolChangesBanner poolId={poolId} />
    </>
  )
}
