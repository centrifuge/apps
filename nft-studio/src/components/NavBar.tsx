import Identicon from 'polkadot-identicon'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { truncateAddress } from '../utils/web3'
import { useWeb3Context } from './Web3Provider'

export const NavBar: React.FC = () => {
  const { selectedAccount, connect } = useWeb3Context()
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
        <div>
          {selectedAccount.meta.name || truncateAddress(selectedAccount.address)}{' '}
          <Identicon account={selectedAccount.address} size={24} />
        </div>
      )}
    </div>
  )
}
