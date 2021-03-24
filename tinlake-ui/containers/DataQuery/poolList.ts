import gql from 'graphql-tag'
import Apollo from '../../services/apollo'
import { downloadCSV } from '../../utils/export'
import { csvName } from './queries'

export async function poolList() {
  const data = await Apollo.runCustomQuery(gql`
    {
      pools {
        id
        shortName
        totalDebt
        totalBorrowsCount
      }
    }
  `)

  Object.keys(data).map((root: string) => {
    const elements = data[root]
    const header = Object.keys(elements[0])
    // TODO: this doesnt support nested objects (e.g. pools { loans { id }})
    const rows = [header, ...elements.map((e: any) => Object.values(e))]

    downloadCSV(rows, csvName('Pool list'))
  })
}
