import { useParams } from 'react-router'
import { LayoutBase } from '../../components/LayoutBase'
import { NavManagementHeader } from './NavManagementHeader'

export default function NavManagementInvestorsPage() {
  return (
    <LayoutBase>
      <NavManagementHeader />
      <NavManagementInvestors />
    </LayoutBase>
  )
}

function NavManagementInvestors() {
  const { pid: poolId } = useParams<{ pid: string }>()

  return <div>Investors</div>
}
