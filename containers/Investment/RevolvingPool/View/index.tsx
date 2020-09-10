import * as React from 'react'
import { Box, Heading } from 'grommet'
import { Pool } from '../../../../config'

import { ExplainerCard } from './styles'
import TrancheOverview from './TrancheOverview'

interface Props {
  pool: Pool
}

const InvestmentsView: React.FC<Props> = (props: Props) => {
  return (
    <Box>
      <Heading level="4">Invest/Redeem in {props.pool?.name}</Heading>

      <ExplainerCard margin={{ bottom: 'medium' }}>
        Please place your DROP and TIN invstments and redemptions below. Tinlake pool investments and redemptions are
        locked in throughout daily “Epochs” and executed at the end of the Epoch based on available capital and
        considering Reserve and TIN ratios. Please find more detailed information about Epochs, the Epoch Waterfall and
        how to invest and redeem into Tinlake here...
      </ExplainerCard>

      <TrancheOverview pool={props.pool} tranche="junior" />
      <TrancheOverview pool={props.pool} tranche="senior" />
    </Box>
  )
}

export default InvestmentsView
