import { Box, Heading } from 'grommet'
import * as React from 'react'
import config, { Pool } from '../../../config'
import { Info } from './styles'
import InvestAction from '../../../components/InvestAction'
import OnboardModal from '../../../components/OnboardModal'

interface Props {
  pool: Pool
}

// {
/* {props.tranche === 'senior' && (
    <Info>
      <Heading level="6" margin={{ bottom: 'xsmall' }}>
        Sign up for this pool.
      </Heading>
      Your KYC status is pending, you can already continue onboarding as an investor by signing the Subscription
      Agreement for DROP tokens of {props.pool.metadata.name}.
      <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
        <Button primary label="Sign Subscription Agreement" onClick={connect} />
      </Box>
    </Info>
  )} */
// }
const OnboardCard: React.FC<Props> = (props: Props) => {
  return (
    <Box>
      <Info>
        <Heading level="6" margin={{ bottom: 'xsmall' }}>
          Interested in investing?
        </Heading>
        If you want to learn more get started with your onboarding process.
        <Box justify="end" margin={{ top: 'small' }}>
          {config.featureFlagNewOnboarding ? <OnboardModal pool={props.pool} /> : <InvestAction pool={props.pool} />}
        </Box>
      </Info>
    </Box>
  )
}

export default OnboardCard
