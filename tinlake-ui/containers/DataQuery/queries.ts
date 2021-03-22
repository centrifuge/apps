import gql from 'graphql-tag'

const queries = {
  'Pool list': gql`
    {
      pools {
        id
        shortName
        totalDebt
        totalBorrowsCount
      }
    }
  `,
}

export default queries
