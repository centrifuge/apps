import { Route, Routes } from 'react-router'
import { SelectedPoolsProvider, useSelectedPools } from '../../../src/utils/contexts/SelectedPoolsContext'
import AccountsPage from './AccountsPage'
import AssetsPage from './AssetsPage'
import Dashboard from './Dashboard'
import InvestorsPage from './InvestorsPage'

export default function DashboardPage() {
  const { pools } = useSelectedPools()

  // Talk to product about a message here or?
  if (!pools?.length) return

  return (
    <SelectedPoolsProvider>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/assets" element={<AssetsPage pools={pools} />} />
        <Route path="/investors" element={<InvestorsPage />} />
      </Routes>
    </SelectedPoolsProvider>
  )
}
