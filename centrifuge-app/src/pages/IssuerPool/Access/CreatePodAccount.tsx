import Centrifuge, { addressToHex } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Button } from '@centrifuge/fabric'
import { Keyring } from '@polkadot/api'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { useEffect } from 'react'
import { useMutation, useQuery } from 'react-query'
import { usePodUrl } from '../../../utils/usePools'

type Props = {
  poolId: string
  address: string
  onSuccess?: (res: ReturnType<Centrifuge['pod']['createAccount']> extends Promise<infer T> ? T : never) => void
}

async function getAdminToken(cent: Centrifuge) {
  await cryptoWaitReady()
  const keyring = new Keyring({ type: 'sr25519' })
  const EveKeyRing = keyring.addFromUri('//Eve')

  const token = await cent.auth.generateJw3t(EveKeyRing, undefined, {
    onBehalfOf: EveKeyRing.address,
    proxyType: 'PodAdmin',
    expiresAt: String(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 10), // 10 years
  })

  console.log('token', token)
  return token
}

export function CreatePodAccount({ poolId, address, onSuccess }: Props) {
  const cent = useCentrifuge()
  const podUrl = usePodUrl(poolId)

  const { data: existing, isLoading: isFetching } = useQuery(
    ['podAccount', podUrl, address],
    async () => {
      try {
        const { token } = await getAdminToken(cent)
        return cent.pod.getAccount([podUrl!, token, addressToHex(address)])
      } catch {
        return null
      }
    },
    {
      enabled: !!podUrl,
    }
  )

  const { mutate: create, isLoading } = useMutation(async () => {
    if (!podUrl) throw new Error('No Pod Url')
    const { token } = await getAdminToken(cent)
    const res = await cent.pod.createAccount([podUrl, token, addressToHex(address)])
    onSuccess?.(res)
  })

  useEffect(() => {
    if (existing) onSuccess?.(existing)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing])

  return (
    <div>
      <Button onClick={() => create()} small loading={isLoading || isFetching} key="done">
        Create Dev POD account
      </Button>
    </div>
  )
}
