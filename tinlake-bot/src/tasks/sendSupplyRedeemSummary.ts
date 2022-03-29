import Tinlake, { addThousandsSeparators, baseToDisplay } from '@centrifuge/tinlake-js'
import { aggregate } from '@makerdao/multicall'
import Decimal from 'decimal.js-light'
import { BigNumber, ethers } from 'ethers'
import config from '../config'
import { PoolMap } from '../util/ipfs'
import { pushNotificationToSlack } from '../util/slack'
const BN = require('bn.js')

const multicallConfig = {
  rpcUrl: config.rpcUrl,
  multicallAddress: config.multicallContractAddress,
}

const e18 = new BN('10').pow(new BN('18'))

const toBN = (val: BigNumber) => new BN(val.toString())

const toPrecision = (val: any, precision: number) => new Decimal(val.toString()).toFixed(precision)

const format21 = (val: any) => addThousandsSeparators(toPrecision(baseToDisplay(val, 21), 0))

const epochStates = {
  open: 'Ongoing',
  'can-be-closed': 'Minimum duration ended',
  'in-submission-period': 'Computing orders',
  'in-challenge-period': 'Computing orders',
  'challenge-period-ended': 'Orders computed',
}

export const sendSupplyRedeemSummary = async (
  pools: PoolMap,
  provider: ethers.providers.Provider,
  signer: ethers.Signer
) => {
  const calls = []
  Object.values(pools).forEach((pool) => {
    calls.push(
      {
        target: pool.addresses.SENIOR_TRANCHE,
        call: ['totalSupply()(uint256)'],
        returns: [[`${pool.addresses.ROOT_CONTRACT}.seniorSupply`, toBN]],
      },
      {
        target: pool.addresses.SENIOR_TRANCHE,
        call: ['totalRedeem()(uint256)'],
        returns: [[`${pool.addresses.ROOT_CONTRACT}.seniorRedeem`, toBN]],
      },
      {
        target: pool.addresses.JUNIOR_TRANCHE,
        call: ['totalSupply()(uint256)'],
        returns: [[`${pool.addresses.ROOT_CONTRACT}.juniorSupply`, toBN]],
      },
      {
        target: pool.addresses.JUNIOR_TRANCHE,
        call: ['totalRedeem()(uint256)'],
        returns: [[`${pool.addresses.ROOT_CONTRACT}.juniorRedeem`, toBN]],
      }
    )
  })

  const {
    results: {
      transformed: { ...dataTransformed },
    },
  } = await aggregate(calls, multicallConfig)

  const dataPerPool = {}
  Object.entries(dataTransformed).forEach(([type, value]) => {
    const poolId = type.split('.')[0]
    const key = type.split('.')[1]
    if (!(poolId in dataPerPool)) dataPerPool[poolId] = {}
    dataPerPool[poolId][key] = value
  })

  const blocks = await Promise.all(
    Object.entries(pools).map(async ([poolId, pool]) => {
      const tinlake = new Tinlake({
        provider,
        signer,
        contractAddresses: pool.addresses,
        contractVersions: pool.versions,
      })
      const state = await tinlake.getCurrentEpochState()
      const poolData = dataPerPool[poolId]
      const hasSignificantOrders = [
        poolData.seniorSupply,
        poolData.seniorRedeem,
        poolData.juniorSupply,
        poolData.juniorRedeem,
      ].some((val) => val.gt(e18))

      if (!hasSignificantOrders) return null

      return {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${pool.metadata.name}*: ${epochStates[state]}
:drop-white: +${format21(poolData.seniorSupply)}K / -${format21(poolData.seniorRedeem)}K
:tin: +${format21(poolData.juniorSupply)}K / -${format21(poolData.juniorRedeem)}K`,
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View on Tinlake',
            emoji: true,
          },
          value: 'tinlake',
          url: `${config.tinlakeUiHost}pool/${poolId}/${pool.metadata.slug}`,
        },
      }
    })
  )

  await pushNotificationToSlack(
    {} as any,
    `Here’s a list of all open orders in Tinlake pools on ${new Date().toLocaleDateString('en')}:`,
    blocks.filter(Boolean)
  )
}
