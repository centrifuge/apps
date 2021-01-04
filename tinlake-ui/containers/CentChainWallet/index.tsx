import { ITinlake } from '@centrifuge/tinlake-js'
import { Button } from 'grommet'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { CentChainWalletState, connect } from '../../ducks/centChainWallet'

interface Props {
  tinlake: ITinlake
}

const CentChainWallet: React.FC<Props> = ({ tinlake }: Props) => {
  const dispatch = useDispatch()
  const cWallet = useSelector<any, CentChainWalletState>((state: any) => state.centChainWallet)

  const onConnect = async () => {
    await dispatch(connect())
  }

  return (
    <>
      {cWallet.error && (
        <div>
          Please{' '}
          <a href="https://polkadot.js.org/extension/" target="_blank">
            install the Polkadot extension for your browser
          </a>{' '}
          and authorize Tinlake to connect to it.
        </div>
      )}
      {cWallet.state === 'disconnected' && (
        <div>
          Connect your wallet to get started:
          <Button secondary label="Connect" onClick={onConnect} />
        </div>
      )}
      {cWallet.state === 'connecting' && <div>Connecting...</div>}
      {cWallet.state === 'connected' && <div>Connected, woohoo!</div>}
      {cWallet.state === 'connected' && cWallet.accounts.length === 0 && (
        <div>Please add an account to the Polkadot extension.</div>
      )}
      {cWallet.state === 'connected' && cWallet.accounts.length > 1 && (
        <div>
          You currently have {cWallet.accounts.length} in your Polkadot extension, but can only use one on this page.
          Please hide all accounts except the one you want to use in your Polkadot extension.
        </div>
      )}
      {cWallet.state === 'connected' && cWallet.accounts.length === 1 && (
        <div>
          Connected with account "{cWallet.accounts[0].name}": {cWallet.accounts[0].addrCentChain} (this may show up as{' '}
          {cWallet.accounts[0].addrInjected} in the Polkadot extension – change the display address format to
          "Centrifuge Chain" to verify the address).
        </div>
      )}
    </>
  )
}

export default CentChainWallet
