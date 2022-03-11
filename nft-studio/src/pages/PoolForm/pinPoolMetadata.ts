import { PoolFormValues } from '.'
import { fetchLambda } from '../../utils/fetchLambda'
import { getFileIpfsHash } from '../../utils/getFileIpfsHash'
import { promiseAllObject } from '../../utils/promiseAllObject'
import { PoolMetadata } from './types'

type CreatePoolArg = {
  poolFormData: PoolFormValues
  issuerLogoFile?: File
}

export const pinPoolMetadata = async ({ poolFormData, issuerLogoFile }: CreatePoolArg): Promise<string> => {
  // pin image files files. If not present, hash will be null
  const fileHashMap = await promiseAllObject<string | null>({
    issuerLogoFile: getFileIpfsHash(issuerLogoFile),
  })

  // build metadata JSON
  const tranches = [...poolFormData.tranches]
  const metadata: PoolMetadata = {
    pool: {
      name: poolFormData.poolName,
      asset: { class: poolFormData.assetClass },
      issuer: {
        logo: fileHashMap.issuerLogoFile || '',
      },
      status: 'open',
    },
    tranches: tranches.map((tranche) => ({
      name: tranche.tokenName,
      symbol: tranche.symbolName,
    })),
  }

  const resp = await fetchLambda('pinJson', { method: 'POST', body: JSON.stringify(metadata) })
  if (!resp.ok) {
    const respText = await resp.text()
    throw new Error(`Error pinning pool metadata: ${respText}`)
  }
  const json = await resp.json()
  return json.ipfsHash as string
}
