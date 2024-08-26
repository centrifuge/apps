import { LayoutMain } from '../components/LayoutBase'
import { Orders } from '../components/Swaps/Orders'

export default function SwapsPage() {
  return (
    <LayoutMain title="Open swap orders">
      <Orders />
    </LayoutMain>
  )
}
