/* eslint-disable react-hooks/rules-of-hooks */
import Centrifuge from '@centrifuge/centrifuge-js'
import { useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Button, Grid } from '@centrifuge/fabric'
import { Keyring } from '@polkadot/api'
import { u8aToHex } from '@polkadot/util'
import { addressToEvm, cryptoWaitReady, decodeAddress, encodeAddress } from '@polkadot/util-crypto'
import * as React from 'react'
import { PageSection } from '../../../components/PageSection'
import { usePool, usePoolMetadata } from '../../../utils/usePools'

type Props = {
  poolId?: string
}

// @ts-ignore
window.encAddr = encodeAddress
// @ts-ignore
window.toHexiflexi = centChainAddrToAccountId
// @ts-ignore
window.hexi = (addr) => u8aToHex(decodeAddress(addr))

export function centChainAddrToAccountId(addr: string) {
  const keyring = new Keyring()
  const accountId = keyring.decodeAddress(addr)
  const hex = u8aToHex(accountId)
  return hex
}

// @ts-ignore
window.addrEvm = addressToEvm

export const PodConfig: React.FC<Props> = (props) => {
  // var {
  //   substrate: { selectedAccount,  selectedWallet },
  // } = useWallet()
  // var cent = useCentrifuge()
  if (props.poolId) {
    var pool = usePool(props.poolId)
    var { data: metadata } = usePoolMetadata(pool)
    console.log('metadata', metadata)
  }

  const { isLoading } = useCentrifugeTransaction('Add POD account', (cent) => cent.pools.setMetadata)

  React.useEffect(() => {
    ;(async () => {
      await cryptoWaitReady()
      const keyring = new Keyring({ type: 'sr25519' })
      const AliceKeyRing = keyring.addFromUri('//Alice')
      const EveKeyRing = keyring.addFromUri('//Eve')

      const centrifuge = new Centrifuge({
        network: 'centrifuge',
        // polkadotWsUrl: 'ws://localhost:9944',
        // centrifugeWsUrl: 'ws://localhost:9946',
        polkadotWsUrl: 'wss://fullnode-relay.development.cntrfg.com',
        centrifugeWsUrl: 'wss://fullnode.development.cntrfg.com',
        signingAddress: AliceKeyRing,
        printExtrinsics: true,
        debug: true,
      })

      const token = await centrifuge.auth.generateJw3t(EveKeyRing, undefined, {
        onBehalfOf: EveKeyRing.address,
        proxyType: 'PodAdmin',
        expiresAt: String(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 10), // 10 years
      })
      console.log(token)
    })()
  }, [])

  return (
    // <FormikProvider value={form}>
    // <Form>
    <PageSection title="Create account on the POD">
      <Grid columns={2} gap={3}>
        <Button
          // onClick={createAccount}
          small
          loading={isLoading}
          loadingMessage={isLoading ? 'Pending...' : undefined}
          key="done"
        >
          Create account
        </Button>
      </Grid>
    </PageSection>
  )
}
