import { Contract } from '@ethersproject/contracts'
import { InfuraProvider } from '@ethersproject/providers'
import { Request } from 'express'
import { lastValueFrom } from 'rxjs'
import { InferType } from 'yup'
import { signAndSendDocumentsInput } from '../controllers/emails/signAndSendDocuments'
import RemarkerAbi from './abi/Remarker.abi.json'
import { centrifuge } from './centrifuge'
import { HttpError } from './httpError'

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

const ETH_NETWORK = process.env.EVM_NETWORK || 'mainnet'

const goerliConfig = {
  rpcUrl: 'https://goerli.infura.io/v3/f9ba987e8cb34418bb53cdbd4d8321b5',
  poolRegistryAddress: '0x5ba1e12693dc8f9c48aad8770482f4739beed696',
  remarkerAddress: '0x6E395641087a4938861d7ada05411e3146175F58',
  tinlakeUrl: 'https://goerli.staging.tinlake.cntrfg.com/',
  poolsHash: 'QmYY9GPHZ19A75S1UUQCiY1ckxchaJdRpESpkRvZTVDBPM', // TODO: add registry to config and fetch poolHash
}
const mainnetConfig = {
  rpcUrl: 'https://mainnet.infura.io/v3/ed5e0e19bcbc427cbf8f661736d44516',
  poolRegistryAddress: '0x5ba1e12693dc8f9c48aad8770482f4739beed696',
  remarkerAddress: '0x075f37451e7a4877f083aa070dd47a6969af2ced',
  tinlakeUrl: 'https://tinlake.centrifuge.io',
  poolsHash: 'QmcqJHaFR7VRcdFgtHsqoZvN1iE1Z2q7mPgqd3N8XM4FPE', // TODO: add registry to config and fetch poolHash
}

export const ethConfig = {
  network: ETH_NETWORK,
  multicallContractAddress: '0x5ba1e12693dc8f9c48aad8770482f4739beed696', // Same for all networks
  ...(ETH_NETWORK === 'goerli' ? goerliConfig : mainnetConfig),
}

function parsePoolsMetadata(poolsMetadata): { active: ActivePool[] } {
  const launching = poolsMetadata.filter((p): p is LaunchingPool => !!p.metadata.isLaunching)
  const active = poolsMetadata.filter(
    (p): p is ActivePool => !!('addresses' in p && p.addresses.ROOT_CONTRACT && !launching.includes(p))
  )
  return { active }
}

export const getTinlakePoolById = async (poolId: string) => {
  const uri = ethConfig.poolsHash
  const data = (await lastValueFrom(centrifuge.metadata.getMetadata(uri))) as PoolMetadataDetails
  const pools = parsePoolsMetadata(Object.values(data))
  const poolData = pools.active.find((p) => p.addresses.ROOT_CONTRACT === poolId)

  if (!poolData) {
    throw new Error(`Pool ${poolId} not found`)
  }

  const id = poolData.addresses.ROOT_CONTRACT
  const metadata = {
    pool: {
      name: poolData.metadata.name,
      issuer: {
        name: poolData.metadata.attributes?.Issuer ?? '',
        email: poolData.metadata?.issuerEmail ?? 'info@centrifuge.io',
      },
    },
  }
  const pool = {
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
  }
}

export const validateEvmRemark = async (
  wallet: Request['wallet'],
  transactionInfo: InferType<typeof signAndSendDocumentsInput>['transactionInfo'],
  expectedRemark: string
) => {
  const EVM_NETWORK = process.env.EVM_NETWORK
  const INFURA_KEY = process.env.INFURA_KEY

  const provider = new InfuraProvider(EVM_NETWORK, INFURA_KEY)
  const contract = new Contract(ethConfig.remarkerAddress, RemarkerAbi).connect(provider)
  const filteredEvents = await contract.queryFilter(
    'Remarked',
    Number(transactionInfo.blockNumber),
    Number(transactionInfo.blockNumber)
  )

  const [sender, actualRemark] = filteredEvents.flatMap((ev) => ev.args?.map((arg) => arg.toString()))
  if (actualRemark !== expectedRemark || sender !== wallet.address) {
    throw new HttpError(400, 'Invalid remark')
  }
}
