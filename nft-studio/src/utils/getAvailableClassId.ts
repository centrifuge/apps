import { initPolkadotApi } from './web3'

const getRandomUint64 = (): number => (Math.random() * 18446744073709551615) >>> 0

const MAX_ATTEMPTS = 10

export const getAvailableClassId = async () => {
  const api = await initPolkadotApi()
  for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
    const id = getRandomUint64()
    const res = await api.query.uniques.class(id)
    if (res.toJSON() === null) {
      return id
    }
  }
  throw new Error(`Could not find an available class ID in ${MAX_ATTEMPTS} attempts`)
}
