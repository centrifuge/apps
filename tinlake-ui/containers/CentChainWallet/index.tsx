import { Tooltip } from '@centrifuge/axis-tooltip'
import { Button } from 'grommet'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { CentChainWalletState, connect } from '../../ducks/centChainWallet'
import { shortAddr } from '../../utils/shortAddr'

const CentChainWallet: React.FC = () => {
  const dispatch = useDispatch()
  const cWallet = useSelector<any, CentChainWalletState>((state: any) => state.centChainWallet)

  const onConnect = async () => {
    await dispatch(connect())
  }

  return (
    <div>
      {cWallet.error && (
        <>
          Please{' '}
          <a href="https://polkadot.js.org/extension/" target="_blank">
            install the Polkadot extension for your browser
          </a>{' '}
          and authorize Tinlake to connect to it.
        </>
      )}
      {cWallet.state === 'disconnected' && (
        <>
          <Button secondary label="Connect" onClick={onConnect} />
        </>
      )}
      {cWallet.state === 'connecting' && <>Connecting...</>}
      {cWallet.state === 'connected' && cWallet.accounts.length === 0 && (
        <>Please add an account to the Polkadot extension.</>
      )}
      {cWallet.state === 'connected' && cWallet.accounts.length > 1 && (
        <>
          You currently have {cWallet.accounts.length} in your Polkadot extension, but can only use one on this page.
          Please hide all accounts except the one you want to use in your Polkadot extension.
        </>
      )}
      {cWallet.state === 'connected' && cWallet.accounts.length === 1 && (
        <>
          Connected with Centrifuge Chain address{' '}
          <Tooltip
            title="Unexpected Address?"
            description={
              'Your address may show up as {shortAddr(cWallet.accounts[0].addrInjected)} in the Polkadot extension. In the extension settings, change the display address format to "Centrifuge Chain".'
            }
          >
            {shortAddr(cWallet.accounts[0].addrCentChain)}
          </Tooltip>{' '}
          ("{cWallet.accounts[0].name}")
        </>
      )}
    </div>
  )
}

export default CentChainWallet
