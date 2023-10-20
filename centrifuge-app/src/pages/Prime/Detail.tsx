import { useParams } from 'react-router'
import { LayoutBase } from '../../components/LayoutBase'

export function PrimeDetailPage() {
  return (
    <LayoutBase>
      <PrimeDetail />
    </LayoutBase>
  )
}

function PrimeDetail() {
  const { dao } = useParams<{ dao: string }>()
  return <div>Prime detail, {dao}</div>
}
