import { Balance, Rate } from '@centrifuge/centrifuge-js'
import { hash } from '@stablelib/blake2b'
import BN from 'bn.js'
import { PoolFormValues } from '.'
import { PoolMetadata } from '../../types'
import { fetchLambda } from '../../utils/fetchLambda'
import { getFileDataURI } from '../../utils/getFileDataURI'
import { promiseAllObject } from '../../utils/promiseAllObject'

function toHex(data: Uint8Array) {
  const hex = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f']
  const out = []

  for (let i = 0; i < data.length; i++) {
    out.push(hex[(data[i] >> 4) & 0xf])
    out.push(hex[data[i] & 0xf])
  }
  return `0x${out.join('')}`
}

function computeTrancheId(trancheIndex: number, poolId: string) {
  const a = new BN(trancheIndex).toArray('le', 8)
  const b = new BN(poolId).toArray('le', 8)
  const data = Uint8Array.from(a.concat(b))

  return toHex(hash(data, 16))
}

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

export const pinPoolMetadata = async (poolFormData: PoolFormValues, poolId: string): Promise<string> => {
  // pin image files files. If not present, hash will be null
  const fileUriMap = await promiseAllObject<string | null>({
    poolIcon: getFileIpfsUri(poolFormData.poolIcon),
    issuerLogo: getFileIpfsUri(poolFormData.issuerLogo),
    executiveSummary: getFileIpfsUri(poolFormData.executiveSummary),
  })

  // build metadata JSON
  const { tranches, riskGroups } = poolFormData

  const tranchesById: PoolMetadata['tranches'] = {}
  tranches.forEach((tranche, index) => {
    tranchesById[computeTrancheId(index, poolId)] = {
      name: tranche.tokenName,
      symbol: tranche.symbolName,
      minInitialInvestment: Balance.fromFloat(tranche.minInvestment).toString(),
    }
  })

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
    tranches: tranchesById,
    riskGroups: riskGroups.map((group) => ({
      name: group.groupName,
      advanceRate: Rate.fromPercent(group.advanceRate).toString(),
      interestRatePerSec: Rate.fromAprPercent(group.fee).toString(),
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
