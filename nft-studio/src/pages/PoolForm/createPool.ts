import { fetchLambda } from '../../utils/fetchLambda'
import { getFileDataURI } from '../../utils/getFileDataURI'
import { promiseAllObject } from '../../utils/promiseAllObject'

type CreatePoolArg = {
  poolName: string
  assetClass: string
  currency: string
  discountRate: string
  minEpochDuration: string
  challengeTime: string
  tranche: string
  tokenName: string
  interestRate: string
  minRiskBuffer: string
  issuerLogoFile?: File
  poolIconFile?: File
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

export const createPool = async (poolData: CreatePoolArg) => {
  // TODO: validate if the inputs are as expected

  // pin image files file. If not present, hash will be null
  const fileHashMap = await promiseAllObject<string | null>({
    issuerLogoFile: getFileIpfsHash(poolData.issuerLogoFile),
    poolIconFile: getFileIpfsHash(poolData.poolIconFile),
  })

  console.log({ fileHashMap })
}
