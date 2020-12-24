import { ITinlake } from '@centrifuge/tinlake-js'
import { Box } from 'grommet'
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

export type Step = 'connect' | 'kyc' | 'agreement' | 'invest'

const OnboardingSteps: React.FC<Props> = (props: Props) => {
  const dispatch = useDispatch()

  const address = useSelector<any, string | null>((state) => state.auth.address)

  React.useEffect(() => {
    if (address) {
      dispatch(loadOnboardingStatus(props.activePool))
    }
  }, [address, props.activePool])

  // const [activeStep, setActiveStep] = React.useState<Step>('connect')

  return (
    <Box margin={{ top: 'medium' }}>
      <PoolTitle pool={props.activePool} page="Onboarding" parentPage="Investments" parentPageHref="/investments" />
      <Box pad="medium" elevation="small" round="xsmall" background="white" width="80%">
        <KycStep {...props} />
        <AgreementStep {...props} />
        <Step>
          <StepHeader>
            <StepIcon inactive />
            <StepTitle inactive>Invest in {props.activePool.metadata.name}</StepTitle>
          </StepHeader>
        </Step>
      </Box>
    </Box>
  )
}

export default OnboardingSteps
