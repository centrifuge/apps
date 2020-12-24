import { ITinlake } from '@centrifuge/tinlake-js'
import { Box, Button } from 'grommet'
import * as React from 'react'
import PoolTitle from '../../components/PoolTitle'
import { Pool } from '../../config'
import { Step, StepHeader, StepIcon, StepTitle } from './styles'
import KycStep from './KycStep'
import AgreementStep from './AgreementStep'
import { useDispatch, useSelector } from 'react-redux'
import { loadOnboardingStatus } from '../../ducks/onboarding'

interface Props {
  activePool: Pool
  tinlake: ITinlake
}

const OnboardingSteps: React.FC<Props> = (props: Props) => {
  const dispatch = useDispatch()

  const address = useSelector<any, string | null>((state) => state.auth.address)

  React.useEffect(() => {
    if (address) {
      dispatch(loadOnboardingStatus(props.activePool))
    }
  }, [address, props.activePool])

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
