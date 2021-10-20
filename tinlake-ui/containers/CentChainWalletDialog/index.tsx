import { Anchor, Box, Button } from 'grommet'
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
  const router = useRouter()

  const onConnect = async () => {
    await dispatch(connect())
  }

  React.useEffect(() => {
    if (polkadotExtensionInstalled) {
      ;(async () => {
        await dispatch(connect())
      })()
    }
  }, [polkadotExtensionInstalled])

  if (!polkadotExtensionInstalled) {
    return (
      <>
        Your CFG Rewards are earned on Ethereum but claimed on Centrifuge Chain.
        <br />
        <br />
        Please first install the Polkadot Wallet extension to get started. Please reload this page after you have
        installed the extension.
        <br />
        <Box direction="row" justify="end" margin={{ top: 'medium' }}>
          <Button
            primary={!clickedInstall}
            label="Install Browser Extension"
            href="https://polkadot.js.org/extension/"
            onClick={() => setClickInstall(true)}
            target="_blank"
          />
          {clickedInstall && <Button primary label="Reload Page" onClick={router.reload} margin={{ left: '24px' }} />}
        </Box>
      </>
    )
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
        <>
          You haven’t created an account yet in your Polkadot extension.
          <br />
          <br />
          <Alert type="info" margin={{ vertical: 'none' }}>
            Please create or add an account in the Polkadot extension to proceed.
            <br />
            <br />
            <Anchor href="https://docs.centrifuge.io/chain/get-started/account/" target="_blank">
              Learn how to create an account.
            </Anchor>
          </Alert>
        </>
      )}
    </div>
  )
}

export default CentChainWalletDialog
