import { ITinlake } from '@centrifuge/tinlake-js'
import { Box, Button } from 'grommet'
import * as React from 'react'
import PoolTitle from '../../components/PoolTitle'
import { Pool } from '../../config'
import { Step, StepHeader, StepIcon, StepTitle } from './styles'
import KycStep from './KycStep'
import AgreementStep from './AgreementStep'

interface Props {
  activePool: Pool
  tinlake: ITinlake
}

const OnboardingSteps: React.FC<Props> = (props: Props) => {
  return (
    <Box margin={{ top: 'medium' }}>
      <PoolTitle pool={props.activePool} page="Investor Onboarding" />
      <Box pad="medium" elevation="small" round="xsmall" background="white" width="80%">
        <KycStep {...props} />
        <AgreementStep {...props} />
        <Step>
          <StepHeader>
            <StepIcon>
              <img src="/static/circle.svg" />
            </StepIcon>
            <StepTitle inactive>Invest in {props.activePool.metadata.name}</StepTitle>
          </StepHeader>
        </Step>
      </Box>

      <div>
        <Button margin={{ top: 'medium' }} secondary label={`Go back`} fill={false} />
      </div>
    </Box>
  )
}

export default OnboardingSteps
