import { PoolFormValues } from '.'
import { fetchLambda } from '../../utils/fetchLambda'
import { getFileDataURI } from '../../utils/getFileDataURI'
import { promiseAllObject } from '../../utils/promiseAllObject'
import { PoolMetadata } from './types'

type CreatePoolArg = {
  poolFormData: PoolFormValues
  issuerLogoFile?: File
}

const getFileIpfsHash = async (file?: File): Promise<string | null> => {
  if (!file) return null

  const resp = await fetchLambda('pinFile', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      fileDataUri: await getFileDataURI(file),
      fileName: file.name,
    }),
  })

  if (resp.ok && Math.floor(resp.status) / 100 === 2) {
    const json = await resp.json()
    return json.fileIpfsHash as string
  }
  return null
}

export const pinPoolMetadata = async ({ poolFormData, issuerLogoFile }: CreatePoolArg): Promise<string> => {
  // pin image files files. If not present, hash will be null
  const fileHashMap = await promiseAllObject<string | null>({
    issuerLogoFile: getFileIpfsHash(issuerLogoFile),
  })

  // build metadata JSON
  const tranches = [...poolFormData.tranches].reverse()
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
