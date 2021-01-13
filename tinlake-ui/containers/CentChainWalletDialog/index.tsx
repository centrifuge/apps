import { Box, Button } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Alert from '../../components/Alert'
import { CentChainWalletState, connect } from '../../ducks/centChainWallet'
import { usePolkadotExtensionInstalled } from '../../utils/usePolkadotExtensionInstalled'

const CentChainWalletDialog: React.FC = () => {
  const polkadotExtensionInstalled = usePolkadotExtensionInstalled()
  const dispatch = useDispatch()
  const cWallet = useSelector<any, CentChainWalletState>((state: any) => state.centChainWallet)
  const [clickedInstall, setClickInstall] = React.useState(false)
  const [triedAutoConnect, setTriedAutoConnect] = React.useState(false)
  const router = useRouter()

  const onConnect = async () => {
    await dispatch(connect())
  }

  React.useEffect(() => {
    if (polkadotExtensionInstalled) {
      ;(async () => {
        await dispatch(connect())
        setTriedAutoConnect(true)
      })()
    }
  }, [polkadotExtensionInstalled])

  if (!polkadotExtensionInstalled) {
    return (
      <>
        Please install the Polkadot Wallet browser extension to get started and reload this page.
        <Box direction="row" margin={{ top: 'medium' }}>
          {!clickedInstall ? (
            <Button
              primary
              label="Install Browser Extension"
              href="https://polkadot.js.org/extension/"
              onClick={() => setClickInstall(true)}
              target="_blank"
              margin={{ left: 'auto' }}
            />
          ) : (
            <Button primary label="Reload Page" onClick={router.reload} margin={{ left: 'auto' }} />
          )}
        </Box>
      </>
    )
  }

  if (!triedAutoConnect) {
    return null
  }

  return (
    <div>
      {(cWallet.state === 'disconnected' || cWallet.state === 'connecting') && (
        <>
          Start linking your ETH address to a Centrifuge Chain account by connecting your Polkadot Wallet.
          {cWallet.error && (
            <Alert type="error" margin={{ vertical: 'medium' }}>
              Unable to link your wallet. Please make sure you have the extension installed and authorized the Tinlake
              website to access the wallet.
            </Alert>
          )}
          <Box direction="row" margin={{ top: 'medium' }}>
            <Button
              primary
              label="Connect Centrifuge Chain Wallet"
              onClick={onConnect}
              margin={{ left: 'auto' }}
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
