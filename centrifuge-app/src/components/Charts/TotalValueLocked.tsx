import { Box } from '@centrifuge/fabric'
import * as React from 'react'
import { getTinlakeSubgraphTVL } from '../../utils/tinlake/getTinlakeSubgraphTVL'

export function TotalValueLocked() {
  React.useEffect(() => {
    async function fetchData() {
      const data = await getTinlakeSubgraphTVL()
      console.log('data', data)
    }
    fetchData()
  }, [])

  return <Box>Total value locked chart</Box>
}
