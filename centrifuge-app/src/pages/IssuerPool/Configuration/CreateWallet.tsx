import { Shelf, Stack } from '@centrifuge/fabric'
import { Keyring } from '@polkadot/api'
import Identicon from '@polkadot/react-identicon'
import { blake2AsU8a, decodeAddress, mnemonicGenerate } from '@polkadot/util-crypto'
import * as React from 'react'
import { PageSection } from '../../../components/PageSection'

const blake2 = (value: Uint8Array): Uint8Array => blake2AsU8a(value, 512)

type WalletObj = {
  mnemonic: string
  address: string
}

interface Scheme {
  freq: number
  colors: number[]
  name: string
}

const SCHEMA: { [index: string]: Scheme } = {
  target: { colors: [0, 28, 0, 0, 28, 0, 0, 28, 0, 0, 28, 0, 0, 28, 0, 0, 28, 0, 1], freq: 1, name: 'target' },
  cube: { colors: [0, 1, 3, 2, 4, 3, 0, 1, 3, 2, 4, 3, 0, 1, 3, 2, 4, 3, 5], freq: 20, name: 'cube' },
  quazar: { colors: [1, 2, 3, 1, 2, 4, 5, 5, 4, 1, 2, 3, 1, 2, 4, 5, 5, 4, 0], freq: 16, name: 'quazar' },
  flower: { colors: [0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 3], freq: 32, name: 'flower' },
  cyclic: { colors: [0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 6], freq: 32, name: 'cyclic' },
  vmirror: { colors: [0, 1, 2, 3, 4, 5, 3, 4, 2, 0, 1, 6, 7, 8, 9, 7, 8, 6, 10], freq: 128, name: 'vmirror' },
  hmirror: { colors: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 8, 6, 7, 5, 3, 4, 2, 11], freq: 128, name: 'hmirror' },
}

let zeroHash: Uint8Array = new Uint8Array()

function addressToId(address: string): Uint8Array {
  if (!zeroHash.length) {
    zeroHash = blake2(new Uint8Array(32))
  }

  return blake2(decodeAddress(address)).map((x, i) => (x + 256 - zeroHash[i]) % 256)
}

const total = Object.values(SCHEMA)
  .map((s): number => s.freq)
  .reduce((a, b): number => a + b)

function getAddressScheme(address: string) {
  const id = addressToId(address)
  const d = Math.floor((id[30] + id[31] * 256) % total)
  const rot = (id[28] % 6) * 3
  const sat = (Math.floor((id[29] * 70) / 256 + 26) % 80) + 30
  const scheme = findScheme(d)

  return scheme
}

function findScheme(d: number): Scheme {
  let cum = 0
  const schema = Object.values(SCHEMA).find((schema): boolean => {
    cum += schema.freq

    return d < cum
  })

  if (!schema) {
    throw new Error('Unable to find schema')
  }

  return schema
}
const num = 10

export const CreateWallet: React.FC = () => {
  const [loading, setLoading] = React.useState(false)
  const [list, setList] = React.useState<WalletObj[][]>([])
  const [page, setPage] = React.useState(0)

  async function createWallet() {
    const mnemonic: string = mnemonicGenerate()
    return getWallet(mnemonic)
  }

  async function getWallet(seed: string) {
    const keyring = new Keyring({ type: 'sr25519' })
    const wallet = await keyring.addFromUri(`${seed}`, { name: 'new keypair' })
    console.log(wallet)
    const { address } = wallet
    return {
      address,
      mnemonic: seed,
    } as WalletObj
  }

  React.useEffect(() => {
    setPage(list.length - 1)
  }, [list])

  async function handleCreate() {
    setLoading(true)
    let listArr: WalletObj[] = []
    while (listArr.length < num) {
      let obj: WalletObj = await createWallet()
      const scheme = getAddressScheme(obj.address)
      console.log('scheme.name', scheme.name)
      if (!['target', 'flowers'].includes(scheme.name)) continue
      listArr.push(obj)
    }
    setLoading(false)
    setList((prev) => [...prev, listArr])
  }
  return (
    <PageSection title="Create wallet">
      <button onClick={handleCreate}>Create</button>
      <button onClick={() => setPage((p) => Math.max(p - 1, 0))}>&lt;&lt;</button>
      <button onClick={() => setPage((p) => Math.min(p + 1, list.length - 1))}>&gt;&gt;</button>
      {loading && 'loading'}
      {list[page]?.map((item, index) => (
        <Stack key={item.address} mb={2}>
          <Shelf>
            <div className="title">
              <div className="iconbox">
                <Identicon value={item.address} size={24} theme="polkadot" />
                <Identicon value={item.address} size={24} theme="jdenticon" />
                <Identicon value={item.address} size={24} theme="beachball" />
                {getAddressScheme(item.address).name}
              </div>
            </div>
            <div>{item.address}</div>
          </Shelf>
          <div>
            <div>{item.mnemonic}</div>
          </div>
        </Stack>
      ))}
    </PageSection>
  )
}
