import { Contract } from '@ethersproject/contracts'
import { InfuraProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import { Request } from 'express'
import { lastValueFrom } from 'rxjs'
import { HttpError, reportHttpError } from '../httpError'
import MemberListAdminAbi from './abi/MemberListAdmin.abi.json'
import { getCentrifuge } from './centrifuge'

export interface LaunchingPool extends BasePool {}

interface SecuritizeData {
  issuerId: string
  slug: string
}

interface PoolMedia {
  logo?: string
  icon?: string
  drop?: string
  tin?: string
}

interface JuniorInvestor {
  name: string
  address: string
}

interface PoolMetadataDetails {
  name: string
  shortName?: string
  slug: string
  description?: string
  media?: PoolMedia
  website?: string
  asset: string
  securitize?: SecuritizeData
  attributes?: { Issuer: string; Links: { [key: string]: string } }
  assetMaturity?: string
  currencySymbol?: string
  isUpcoming?: boolean
  isArchived?: boolean
  isLaunching?: boolean
  maker?: { ilk: string }
  issuerEmail?: string
  juniorInvestors?: JuniorInvestor[]
  repName: string
  newInvestmentsStatus: {
    junior: 'closed' | 'request' | 'open'
    senior: 'closed' | 'request' | 'open'
  }
}

interface BasePool {
  network: 'mainnet' | 'kovan' | 'goerli'
  version: 2 | 3
  metadata: PoolMetadataDetails
}

interface ActivePool extends BasePool {
  addresses: {
    TINLAKE_CURRENCY: string
    ROOT_CONTRACT: string
    ACTIONS: string
    PROXY_REGISTRY: string
    COLLATERAL_NFT: string
    SENIOR_TOKEN: string
    JUNIOR_TOKEN: string
    CLERK?: string
    ASSESSOR: string
    RESERVE: string
    SENIOR_TRANCHE: string
    JUNIOR_TRANCHE: string
    JUNIOR_OPERATOR: string
    SENIOR_OPERATOR: string
    FEED: string
    POOL_ADMIN?: string
    SENIOR_MEMBERLIST: string
    JUNIOR_MEMBERLIST: string
    COORDINATOR: string
    PILE: string
    MCD_VAT?: string
    MCD_JUG?: string
    MAKER_MGR?: string
  }
  versions?: {
    FEED?: number
    POOL_ADMIN?: number
  }
  contractConfig?: {
    JUNIOR_OPERATOR: 'ALLOWANCE_OPERATOR'
    SENIOR_OPERATOR: 'ALLOWANCE_OPERATOR' | 'PROPORTIONAL_OPERATOR'
  }
}

function parsePoolsMetadata(poolsMetadata): { active: ActivePool[] } {
  const launching = poolsMetadata.filter((p): p is LaunchingPool => !!p.metadata?.isLaunching)
  const active = poolsMetadata.filter(
    (p): p is ActivePool => !!('addresses' in p && p.addresses.ROOT_CONTRACT && !launching?.includes(p))
  )
  return { active }
}

const goerliConfig = {
  poolsHash: 'QmQe9NTiVJnVcb4srw6sBpHefhYieubR7v3J8ZriULQ8vB', // TODO: add registry to config and fetch poolHash
  memberListAddress: '0xaEcFA11fE9601c1B960661d7083A08A5df7c1947',
}
const mainnetConfig = {
  poolsHash: 'QmNvauf8E6TkUiyF1ZgtYtntHz335tCswKp2uhBH1fiui1', // TODO: add registry to config and fetch poolHash
  memberListAddress: '0xB7e70B77f6386Ffa5F55DDCb53D87A0Fb5a2f53b',
}

export const getTinlakeConfig = () => ({
  network: process.env.EVM_NETWORK,
  multicallContractAddress: '0x5ba1e12693dc8f9c48aad8770482f4739beed696', // Same for all networks
  signerPrivateKey: process.env.EVM_MEMBERLIST_ADMIN_PRIVATE_KEY,
  ...(process.env.EVM_NETWORK === 'goerli' ? goerliConfig : mainnetConfig),
})

export const getTinlakePoolById = async (poolId: string) => {
  const uri = getTinlakeConfig().poolsHash
  const data = (await lastValueFrom(getCentrifuge().metadata.getMetadata(uri))) as PoolMetadataDetails
  const pools = parsePoolsMetadata(Object.values(data))
  const poolData = pools.active.find((p) => p.addresses.ROOT_CONTRACT === poolId)

  if (!poolData) {
    throw new HttpError(404, `Tinlake pool ${poolId} not found`)
  }

  const id = poolData.addresses.ROOT_CONTRACT
  const metadata = {
    pool: {
      newInvestmentsStatus: poolData.metadata.newInvestmentsStatus,
      name: poolData.metadata.name,
      issuer: {
        name: poolData.metadata.attributes?.Issuer ?? '',
        email: poolData.metadata?.issuerEmail ?? 'info@centrifuge.io',
        repName: poolData.metadata.repName ?? '',
      },
      links: {
        executiveSummary: { uri: poolData.metadata.attributes?.Links?.['Executive Summary'] },
      },
    },
    onboarding: {
      tranches: {
        [`${id}-0`]: {
          agreement: {
            uri: poolData.metadata.attributes?.Links.Agreements?.[`${id}-0`],
            mime: 'application/pdf',
          },
        },
        [`${id}-1`]: {
          agreement: {
            uri: poolData.metadata.attributes?.Links.Agreements?.[`${id}-1`],
            mime: 'application/pdf',
          },
        },
      },
    },
  }
  const pool = {
    id,
    metadata: uri,
    tranches: [
      {
        id: `${id}-0`,
        currency: {
          name: 'TIN',
        },
      },
      {
        id: `${id}-1`,
        currency: {
          name: 'DROP',
        },
      },
    ],
  }

  return {
    pool,
    metadata,
    addresses: poolData.addresses,
  }
}

export const addTinlakeInvestorToMemberList = async (wallet: Request['wallet'], poolId: string, trancheId: string) => {
  try {
    const pool = await getTinlakePoolById(poolId)
    const provider = new InfuraProvider(wallet.chainId, process.env.INFURA_KEY)
    const ethConfig = getTinlakeConfig()
    const signer = new Wallet(ethConfig.signerPrivateKey).connect(provider)
    const memberAdminContract = new Contract(ethConfig.memberListAddress, MemberListAdminAbi, signer)
    const memberlistAddress = trancheId.endsWith('1')
      ? pool.addresses.SENIOR_MEMBERLIST
      : pool.addresses.JUNIOR_MEMBERLIST

    const OneHundredYearsFromNow = Math.floor(Date.now() / 1000 + 100 * 365 * 24 * 60 * 60)
    const tx = await memberAdminContract.functions.updateMember(
      memberlistAddress,
      wallet.address,
      OneHundredYearsFromNow,
      {
        gasLimit: 1000000,
        // TODO: find a better number, this is causing errors on goerli
        // maxPriorityFeePerGas: 4000000000, // 4 gwei
      }
    )
    const finalizedTx = await tx.wait()
    console.log(`tx finalized: ${finalizedTx.transactionHash}, nonce=${tx.nonce}`)
    return { txHash: finalizedTx.transactionHash }
  } catch (e) {
    reportHttpError(e)
    throw new HttpError(400, `Could not add ${wallet.address} to MemberList for pool ${poolId}`)
  }
}
