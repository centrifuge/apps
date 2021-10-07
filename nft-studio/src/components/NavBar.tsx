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
        <div>{truncateAddress(selectedAccount.address)}</div>
      )}
    </div>
  )
}
