import { useParams } from 'react-router'
import { LayoutBase } from '../../components/LayoutBase'
import { NavManagementHeader } from './NavManagementHeader'

export default function NavManagementFeesPage() {
  return (
    <LayoutBase>
      <NavManagementHeader />
      <NavManagementFees />
    </LayoutBase>
  )
}

function NavManagementFees() {
  const { pid: poolId } = useParams<{ pid: string }>()

  return <div>Fees</div>
}
