import { LayoutBase, LayoutMain } from '../components/LayoutBase'
import { Orders } from '../components/Swaps/Orders'

export function SwapsPage() {
  return (
    <LayoutBase>
      <LayoutMain title="Open swap orders">
        <Orders />
      </LayoutMain>
    </LayoutBase>
  )
}
