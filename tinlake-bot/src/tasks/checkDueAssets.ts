import { addThousandsSeparators, baseToDisplay, toPrecision } from '@centrifuge/tinlake-js'
import config from '../config'
import { fetchFromSubgraph } from '../util/fetchFromSubgraph'
import { groupBy } from '../util/groupBy'
import { PoolMap } from '../util/ipfs'
import { pushNotificationToSlack } from '../util/slack'

export const checkDueAssets = async (pools: PoolMap) => {
  console.log('Checking if any assets are due in the next 3 days')
  try {
    const threeDaysFromNow = Math.ceil(Date.now() / 1000 + 3 * 24 * 60 * 60)
    const data = await fetchFromSubgraph(`
      query {
        loans(where: { maturityDate_not: 0, maturityDate_lte: "${threeDaysFromNow}", borrowsCount_gt:0, repaysCount:0}) {
          debt
          index
          maturityDate
          pool {
            shortName
            id
          }
        }
      }
      
    `)

    if (!data.loans) {
      console.error(`Failed to retrieve loans: ${data}`)
      return
    }

    const groupedLoans = groupBy(data.loans, (loan: any) => loan.pool.id)

    Object.keys(groupedLoans).forEach((poolId: string) => {
      const pool = pools[poolId]
      const name = pool.metadata.shortName || pool.metadata.name
      const loans = groupedLoans[poolId]
      console.log(`${name}: ${loans.length}`)

      const currencySymbol = pool.metadata.currencySymbol || 'DAI'

      pushNotificationToSlack(
        pool,
        `There ${loans.length > 1 ? 'are' : 'is'} ${loans.length} ${
          loans.length > 1 ? 'assets' : 'asset'
        } due in the next few days for *<${config.tinlakeUiHost}pool/${pool.addresses.ROOT_CONTRACT}/${
          pool.metadata.slug
        }|${name}>*.`,
        loans.map((loan: any) => {
          return {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Asset ${loan.index}*\n${addThousandsSeparators(
                toPrecision(baseToDisplay(loan.debt, 18), 0)
              )} ${currencySymbol}} is due on ${dateToYMD(loan.maturityDate)}.`,
            },
            accessory: {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View',
              },
              value: 'click_me_123',
              url: `${config.tinlakeUiHost}pool/${pool.addresses.ROOT_CONTRACT}/${pool.metadata.slug}/assets/asset?assetId=${loan.index}`,
              action_id: 'button-action',
            },
          }
        })
      )
    })
  } catch (e) {
    console.error(`Error caught during pool closing task: ${e}`)
  }
}

export const dateToYMD = (unix: number) => {
  return new Date(unix * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
