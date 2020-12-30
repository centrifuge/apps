import { ITinlake } from '@centrifuge/tinlake-js'
import { Box, Heading } from 'grommet'
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

    if (!address) setActiveSteps(1)
    else if (kycStatus === 'none') setActiveSteps(2)
    else if (agreementStatus === 'none') setActiveSteps(3)
    else if (kycStatus === 'created' && agreementStatus === 'signed') setActiveSteps(3)
    // TODO: what to do here?
    else if (kycStatus === 'created' && agreementStatus === 'countersigned') setActiveSteps(2)
    else if (kycStatus === 'verified' && agreementStatus === 'signed') setActiveSteps(3)
    else setActiveSteps(4) // TODO: what to do here,
  }, [address, props.activePool, kycStatus, agreementStatus])

  const [activeSteps, setActiveSteps] = React.useState(0)

  return (
    <Box margin={{ top: 'medium' }}>
      <PoolTitle pool={props.activePool} page="Onboarding" parentPage="Investments" parentPageHref="/investments" />
      <Heading level="5" margin={{ bottom: 'medium' }} style={{ maxWidth: '100%' }}>
        To invest in this this pool, start your onboarding process now.
      </Heading>

      <Box pad="medium" elevation="small" round="xsmall" background="white" width="80%">
        <ConnectStep {...props} />
        <KycStep {...props} onboarding={onboarding} kycStatus={kycStatus} active={activeSteps >= 2} />
        <AgreementStep
          {...props}
          onboarding={onboarding}
          agreement={agreement}
          agreementStatus={agreementStatus}
          active={activeSteps >= 3}
        />
        <Step>
          <StepHeader>
            <StepIcon inactive={activeSteps < 4} />
            <StepTitle inactive={activeSteps < 4}>Invest in {props.activePool.metadata.name}</StepTitle>
          </StepHeader>
        </Step>
      </Box>
    </Box>
  )
}

export default OnboardingSteps
