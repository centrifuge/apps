import { Box, Button } from 'grommet'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Alert from '../../components/Alert'
import { CentChainWalletState, connect } from '../../ducks/centChainWallet'

const CentChainWalletDialog: React.FC = () => {
  const dispatch = useDispatch()
  const cWallet = useSelector<any, CentChainWalletState>((state: any) => state.centChainWallet)

  const onConnect = async () => {
    await dispatch(connect())
  }

  return (
    <div>
      {(cWallet.state === 'disconnected' || cWallet.state === 'connecting') && (
        <>
          Please install the Polkadot Browser Extension and link your wallet to proceed.
          {cWallet.error && (
            <Alert type="error" margin={{ vertical: 'medium' }}>
              Unable to link your wallet. Please make sure you have the extension installed and authorized the Tinlake
              website to access the wallet.
            </Alert>
          )}
          <Box direction="row" margin={{ top: 'medium' }}>
            <Button
              secondary
              label="Install Browser Extension"
              href="https://polkadot.js.org/extension/"
              target="_blank"
              margin={{ left: 'auto' }}
            />
            <Button
              primary
              label="Link Wallet"
              onClick={onConnect}
              margin={{ left: 'small' }}
              disabled={cWallet.state === 'connecting'}
            />
          </Box>
        </>
      )}
      {cWallet.state === 'connected' && cWallet.accounts.length === 0 && (
        <Alert type="info" margin={{ vertical: 'none' }}>
          Please create or add an account in the Polkadot extension to proceed.
        </Alert>
      )}
      {cWallet.state === 'connected' && cWallet.accounts.length > 1 && (
        <Alert type="info" margin={{ vertical: 'none' }}>
          You currently have {cWallet.accounts.length} accounts in your Polkadot extension, but Tinlake can only use
          one. Please hide all accounts except the one you want to use in your Polkadot extension.
        </Alert>
      )}
    </div>
  )
}

export default CentChainWalletDialog
