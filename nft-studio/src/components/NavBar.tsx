import { encodeAddress } from '@polkadot/util-crypto'
import Identicon from 'polkadot-identicon'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { truncateAddress } from '../utils/web3'
import { useWeb3Context } from './Web3Provider'

export const NavBar: React.FC = () => {
  const { selectedAccount, connect, disconnect, selectAccount, accounts } = useWeb3Context()
  return (
    <div>
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
          <Identicon account={selectedAccount.address} size={24} />

          <button type="button" onClick={disconnect}>
            Disconnect
          </button>
        </div>
      ) : accounts && !accounts.length ? (
        <span>No accounts available</span>
      ) : (
        <button type="button" onClick={connect}>
          Connect
        </button>
      )}
    </div>
  )
}
