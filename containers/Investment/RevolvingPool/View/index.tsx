import * as React from 'react'
import { Box, Heading } from 'grommet'
import { Pool } from '../../../../config'
import { ITinlake as ITinlakeV3 } from '@centrifuge/tinlake-js-v3'

import { ExplainerCard } from './styles'
// import PoolOverview from './PoolOverview'
import TrancheOverview from './TrancheOverview'
import EpochOverview from './EpochOverview'
import AdminActions from './AdminActions'

interface Props {
  pool: Pool
  tinlake: ITinlakeV3
}

const InvestmentsView: React.FC<Props> = (props: Props) => {
  const isAdmin = true

  return (
    <Box margin={{ top: 'medium' }}>
      {/* <Heading level="4">Pool Overview {props.pool?.name}</Heading>
      <ExplainerCard margin={{ bottom: 'medium' }}>
        Investors can invest into this Tinlake pool through two tokens that are backed by collateral locked by the Asset
        Originator: TIN and DROP. Both tokens represent the liquidity deposited into Tinlake and accrue interest over
        time. TIN, known as the “risk token,” takes the risk of defaults first but also receives higher returns. DROP,
        known as the “yield token,” is protected against defaults by the TIN token and receives stable (but usually
        lower) returns at the DROP rate.
      </ExplainerCard>

      <PoolOverview pool={props.pool} /> */}

      <Heading level="4">Invest/Redeem in {props.pool?.name}</Heading>
      <ExplainerCard margin={{ bottom: 'medium' }}>
        Please place your DROP and TIN investments and redemptions below. Tinlake pool investments and redemptions are
        locked in throughout daily “Epochs” and executed at the end of the Epoch based on available capital and
        considering Reserve and TIN ratios. Please find more detailed information about Epochs, the Epoch Waterfall and
        how to invest and redeem into Tinlake here...
      </ExplainerCard>

      <Box direction="row" justify="start" gap="medium">
        <TrancheOverview pool={props.pool} tinlake={props.tinlake} tranche="junior" />
        <TrancheOverview pool={props.pool} tinlake={props.tinlake} tranche="senior" />
      </Box>

      {isAdmin && (
        <>
          <Heading level="4">Admin actions for {props.pool?.name}</Heading>
          <AdminActions pool={props.pool} tinlake={props.tinlake} />
          <EpochOverview tinlake={props.tinlake} />
        </>
      )}
    </Box>
  )
}

export default InvestmentsView
