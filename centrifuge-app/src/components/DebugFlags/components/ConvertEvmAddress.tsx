import { evmToSubstrateAddress } from '@centrifuge/centrifuge-js'
import { useCentrifugeUtils, useWallet } from '@centrifuge/centrifuge-react'
import { isAddress } from '@ethersproject/address'

export function ConvertEvmAddress() {
  const ctx = useWallet()
  const utils = useCentrifugeUtils()
  function convert() {
    const addr = window.prompt('EVM address')
    if (!addr || !isAddress(addr)) {
      window.alert('Invalid EVM address')
      return
    }
    const chainId = window.prompt('Chain ID', String(ctx.substrate.evmChainId))
    if (!chainId || !Number.isSafeInteger(Number(chainId))) {
      window.alert('Invalid chain ID')
      return
    }
    const converted = evmToSubstrateAddress(addr, Number(chainId))
    const formatted = utils.formatAddress(converted)
    window.alert(formatted)
    console.log('Substrate address', formatted)
  }
  return <button onClick={convert}>Convert EVM to Substrate</button>
}
