import { useConnect } from 'wagmi'

export function WalletOptions() {
  const { connectors, connect } = useConnect()

  return connectors.map((connector) => (
    <button
      key={connector.uid}
      onClick={() => connect({ connector })}
      style={{ marginRight: 8, marginLeft: 8, marginTop: 8 }}
    >
      {connector.name}
    </button>
  ))
}
