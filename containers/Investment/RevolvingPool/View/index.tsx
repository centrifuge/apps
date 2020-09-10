import * as React from 'react'
import { Box, Heading } from 'grommet'
import { Pool } from '../../../../config'

import TrancheOverview from './TrancheOverview'

interface Props {
  pool: Pool
}

const InvestmentsView: React.FC<Props> = (props: Props) => {
  return (
    <Box>
      <Heading level="4">Invest/Redeem in {props.pool?.name}</Heading>

      <TrancheOverview pool={props.pool} tranche="junior" />
      <TrancheOverview pool={props.pool} tranche="senior" />
    </Box>
  )
}

export default InvestmentsView
