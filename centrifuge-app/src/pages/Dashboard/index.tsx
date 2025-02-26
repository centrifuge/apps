import { Route, Routes } from 'react-router'
import AccountsPage from './AccountsPage'
import AssetsPage from './AssetsPage'
import Dashboard from './Dashboard'
import InvestorsPage from './InvestorsPage'

export default function DashboardPage() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/account" element={<AccountsPage />} />
      <Route path="/assets" element={<AssetsPage />} />
      <Route path="/investors" element={<InvestorsPage />} />
    </Routes>
  )
}
