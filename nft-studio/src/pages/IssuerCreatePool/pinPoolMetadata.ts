import { Balance, Rate } from '@centrifuge/centrifuge-js'
import { PoolFormValues } from '.'
import { PoolMetadata } from '../../types'
import { fetchLambda } from '../../utils/fetchLambda'
import { getFileDataURI } from '../../utils/getFileDataURI'
import { promiseAllObject } from '../../utils/promiseAllObject'

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
      minInitialInvestment: Balance.fromFloat(tranche.minInvestment).toString(),
    })),
    riskGroups: riskGroups.map((group) => ({
      name: group.groupName,
      advanceRate: Rate.fromPercent(group.advanceRate).toString(),
      financingFee: Rate.fromAprPercent(group.fee).toString(),
      probabilityOfDefault: Rate.fromPercent(group.probabilityOfDefault).toString(),
      lossGivenDefault: Rate.fromPercent(group.lossGivenDefault).toString(),
      discountRate: Rate.fromAprPercent(group.discountRate).toString(),
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
