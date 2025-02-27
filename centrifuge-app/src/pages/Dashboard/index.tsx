import { Route, Routes } from 'react-router'
import { SelectedPoolsProvider } from '../../../src/utils/contexts/SelectedPoolsContext'
import AccountsPage from './AccountsPage'
import AssetsPage from './AssetsPage'
import Dashboard from './Dashboard'
import InvestorsPage from './InvestorsPage'

export default function DashboardPage() {
  return (
    <SelectedPoolsProvider>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/account" element={<AccountsPage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/investors" element={<InvestorsPage />} />
      </Routes>
    </SelectedPoolsProvider>
  )
}
