import Identicon from 'polkadot-identicon'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { truncateAddress } from '../utils/web3'
import { useWeb3Context } from './Web3Provider'

export const NavBar: React.FC = () => {
  const { selectedAccount, connect, selectAccount, accounts } = useWeb3Context()
  return (
    <div>
      <nav>
        <Link to="/">Home</Link> <Link to="/collection/1">Collection 1</Link>
      </nav>
      {!selectedAccount ? (
        <button type="button" onClick={connect}>
          Connect
        </button>
      ) : (
        <div title={selectedAccount.address}>
          <select
            onChange={(e) => selectAccount(Number(e.target.value))}
            value={accounts.findIndex((acc) => acc.address === selectedAccount.address)}
          >
            {accounts.map((acc, i) => (
              <option value={i} key={acc.address}>
                {acc.meta.name || truncateAddress(acc.address)}
              </option>
            ))}
          </select>
          <Identicon account={selectedAccount.address} size={24} />
        </div>
      )}
    </div>
  )
}
