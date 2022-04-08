import { PoolFormValues } from '.'
import { fetchLambda } from '../../utils/fetchLambda'
import { getFileDataURI } from '../../utils/getFileDataURI'
import { promiseAllObject } from '../../utils/promiseAllObject'
import { PoolMetadata } from './types'

const getFileIpfsUri = async (file?: File | null): Promise<string | null> => {
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
    return json.fileURI as string
  }
  return null
}

export const pinPoolMetadata = async (poolFormData: PoolFormValues): Promise<string> => {
  // pin image files files. If not present, hash will be null
  const fileUriMap = await promiseAllObject<string | null>({
    poolIcon: getFileIpfsUri(poolFormData.poolIcon),
    issuerLogo: getFileIpfsUri(poolFormData.issuerLogo),
    executiveSummary: getFileIpfsUri(poolFormData.executiveSummary),
  })

  // build metadata JSON
  const { tranches, riskGroups } = poolFormData
  const metadata: PoolMetadata = {
    pool: {
      name: poolFormData.poolName,
      icon: fileUriMap.poolIcon || '',
      asset: { class: poolFormData.assetClass },
      issuer: {
        name: poolFormData.issuerName,
        description: poolFormData.issuerDescription,
        email: poolFormData.email,
        logo: fileUriMap.issuerLogo || '',
      },
      links: {
        executiveSummary: fileUriMap.executiveSummary || '',
        forum: poolFormData.forum,
        website: poolFormData.website,
      },
      status: 'open',
    },
    tranches: tranches.map((tranche) => ({
      name: tranche.tokenName,
      symbol: tranche.symbolName,
    })),
    riskGroups: riskGroups.map((group) => ({
      name: group.groupName,
      advanceRate: Number(group.advanceRate),
      financingFee: Number(group.fee),
      probabilityOfDefault: Number(group.probabilityOfDefault),
      lossGivenDefault: Number(group.lossGivenDefault),
      discountRate: Number(group.discountRate),
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
