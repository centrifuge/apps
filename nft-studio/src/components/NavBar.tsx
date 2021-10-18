import { Button, Shelf } from '@centrifuge/fabric'
import Identicon from '@polkadot/react-identicon'
import { encodeAddress } from '@polkadot/util-crypto'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { truncateAddress } from '../utils/web3'
import { useWeb3Context } from './Web3Provider'

export const NavBar: React.FC = () => {
  const { selectedAccount, isConnecting, connect, disconnect, selectAccount, accounts } = useWeb3Context()
  return (
    <Shelf gap={2}>
      <nav>
        <Link to="/">Home</Link> <Link to="/collection/1">Collection 1</Link>
      </nav>
      {selectedAccount && accounts?.length ? (
        <div title={encodeAddress(selectedAccount.address, 2)}>
          <select onChange={(e) => selectAccount(e.target.value)} value={selectedAccount.address}>
            {accounts.map((acc) => (
              <option value={acc.address} key={acc.address}>
                {acc.meta.name || truncateAddress(acc.address)}
              </option>
            ))}
          </select>
          <Identicon value={selectedAccount.address} size={24} theme="polkadot" />

          <button type="button" onClick={disconnect}>
            Disconnect
          </button>
        </div>
      ) : accounts && !accounts.length ? (
        <span>No accounts available</span>
      ) : isConnecting ? (
        <span>Connecting...</span>
      ) : (
        <Button type="button" onClick={connect}>
          Connect
        </Button>
      )}
    </Shelf>
  )
}
