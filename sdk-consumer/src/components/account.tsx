import { useAccount, useDisconnect, useEnsName } from 'wagmi'
import { useAccountBalance } from '../hooks/useAccount'

export function Account() {
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: ensName } = useEnsName({ address })
  const { data: balance } = useAccountBalance()

  return (
    <div>
      {address && <div>{ensName ? `${ensName} (${address})` : address}</div>}
      <h1>Your balance is {balance?.toFloat() ?? 'Loading...'}</h1>
      <button onClick={() => disconnect()}>Disconnect</button>
    </div>
  )
}
