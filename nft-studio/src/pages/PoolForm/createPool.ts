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

export const createPool = async ({ poolFormData, issuerLogoFile }: CreatePoolArg) => {
  // TODO: validate if the inputs are as expected

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

  // pin the metadata json
  // const pinMetadataResponse = await fetchLambda('pinJson', {
  //   method: 'POST',
  //   body: JSON.stringify(metadata),
  // })

  // if (!pinMetadataResponse.ok) {
  //   // todo report error
  //   const respText = await pinMetadataResponse.text()
  //   console.error(`Error pinning metadata: `, respText)
  //   return
  // }

  // build arguments to call createPool
  const trancheMatrix = tranches.map((tranche) => [parseFloat(tranche.interestRate), parseFloat(tranche.minRiskBuffer)])

  // call createPool transaction

  console.log(metadata, trancheMatrix)
}
