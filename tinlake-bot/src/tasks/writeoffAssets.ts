import { fetchFromSubgraph } from '../util/fetchFromSubgraph'
import { PoolMap } from '../util/ipfs'

export const writeoffAssets = async (pools: PoolMap) => {
  console.log('Checking if any assets should be written off')
  try {
    const today = Date.now() / 1000
    const data = await fetchFromSubgraph(`
      query {
        loans(where: { maturityDate_not: 0, maturityDate_lte: "${today}", borrowsCount_gt:0, repaysCount:0}) {
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

    console.log(`Overdue assets: ${JSON.stringify(data.loans)}`)
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
