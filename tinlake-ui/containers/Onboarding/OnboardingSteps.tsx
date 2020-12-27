import { ITinlake } from '@centrifuge/tinlake-js'
import { Box } from 'grommet'
import * as React from 'react'
import PoolTitle from '../../components/PoolTitle'
import { Pool } from '../../config'
import { Step, StepHeader, StepIcon, StepTitle } from './styles'
import KycStep from './KycStep'
import AgreementStep from './AgreementStep'
import { useDispatch, useSelector } from 'react-redux'
import { loadOnboardingStatus, OnboardingState } from '../../ducks/onboarding'
import ConnectStep from './ConnectStep'
import { AgreementsStatus } from '@centrifuge/onboard-api/src/controllers/types'

interface Props {
  activePool: Pool
  tinlake: ITinlake
}

export type Step = 'connect' | 'kyc' | 'agreement' | 'invest'

const DefaultTranche = 'senior'

const OnboardingSteps: React.FC<Props> = (props: Props) => {
  const dispatch = useDispatch()

  const address = useSelector<any, string | null>((state) => state.auth.address)
  const onboarding = useSelector<any, OnboardingState>((state) => state.onboarding)
  const kycStatus = onboarding.data?.kyc?.verified ? 'verified' : onboarding.data?.kyc?.created ? 'created' : 'none'
  const agreement = onboarding.data?.agreements.filter(
    (agreement: AgreementsStatus) => agreement.tranche === DefaultTranche
  )[0]
  const agreementStatus = agreement?.counterSigned ? 'countersigned' : agreement?.signed ? 'signed' : 'none'

  React.useEffect(() => {
    if (address) {
      dispatch(loadOnboardingStatus(props.activePool))
    }

    if (!address) setActiveStep('connect')
    else if (kycStatus === 'none') setActiveStep('kyc')
    else if (agreementStatus === 'none') setActiveStep('agreement')
    else if (kycStatus === 'created' && agreementStatus === 'signed') setActiveStep('agreement')
    // TODO: what to do here?
    else if (kycStatus === 'created' && agreementStatus === 'countersigned') setActiveStep('kyc')
    else if (kycStatus === 'verified' && agreementStatus === 'signed') setActiveStep('agreement')
    else setActiveStep('invest') // TODO: what to do here,
  }, [address, props.activePool, kycStatus, agreementStatus])

  const [activeStep, setActiveStep] = React.useState<Step>('connect')

  return (
    <Box margin={{ top: 'medium' }}>
      <PoolTitle pool={props.activePool} page="Onboarding" parentPage="Investments" parentPageHref="/investments" />
      <Box pad="medium" elevation="small" round="xsmall" background="white" width="80%">
        <ConnectStep {...props} active={activeStep === 'connect'} />
        <KycStep {...props} onboarding={onboarding} kycStatus={kycStatus} active={activeStep === 'kyc'} />
        <AgreementStep
          {...props}
          onboarding={onboarding}
          agreement={agreement}
          agreementStatus={agreementStatus}
          active={activeStep === 'agreement'}
        />
        <Step>
          <StepHeader>
            <StepIcon inactive={activeStep !== 'invest'} />
            <StepTitle inactive={activeStep !== 'invest'}>Invest in {props.activePool.metadata.name}</StepTitle>
          </StepHeader>
        </Step>
      </Box>
    </Box>
  )
}

export default OnboardingSteps
