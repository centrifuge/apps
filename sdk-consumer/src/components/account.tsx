import { useAccount, useDisconnect, useEnsName } from 'wagmi'
import { useAccountBalance } from '../hooks/useAccountbalance'

export function Account() {
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: ensName } = useEnsName({ address })
  const balance = useAccountBalance()

  return (
    <div>
      {address && <div>{ensName ? `${ensName} (${address})` : address}</div>}
      <h1>Your balance is {balance !== null ? balance.toString() : 'Loading...'}</h1>
      <button onClick={() => disconnect()}>Disconnect</button>
    </div>
  )
}
