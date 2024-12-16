import { useAccount, useDisconnect, useEnsName } from 'wagmi'
import { useAccountBalance } from '../hooks/useAccount'
import { useActiveNetworks, useVaults } from '../hooks/usePool'
import { ConnectionGuard } from './ConnectionGuard'

const poolId = '2779829532'
const trancheId = '0xac6bffc5fd68f7772ceddec7b0a316ca'

export function Invest() {
  const { data: networks } = useActiveNetworks(poolId)
  console.log('active networks', networks)
  return (
    <ConnectionGuard networks={networks?.map((n) => n.chainId) || []}>
      <InvestInner />
    </ConnectionGuard>
  )
}

function InvestInner() {
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: ensName } = useEnsName({ address })
  const { data: balance, error, retry, isError } = useAccountBalance()
  const { data: vaults } = useVaults(poolId, trancheId, 11155111)

  return (
    <div>
      {address && <div>{ensName ? `${ensName} (${address})` : address}</div>}
      <h1>Your balance is {balance?.toFloat() ?? 'Loading...'}</h1>
      {error ? (
        <div>
          Error {isError && 'fatal'}
          <button type="button" onClick={() => retry()}>
            Retry
          </button>
        </div>
      ) : null}
      <button onClick={() => disconnect()}>Disconnect</button>
    </div>
  )
}
