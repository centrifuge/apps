import { ConvertAddress } from '../components/DebugFlags/components/ConvertAddress'
import { LayoutBase, LayoutMain } from '../components/LayoutBase'

export default function ConvertAddressPage() {
  return (
    <LayoutBase>
      <LayoutMain title="Convert address">
        <ConvertAddress />
      </LayoutMain>
    </LayoutBase>
  )
}
