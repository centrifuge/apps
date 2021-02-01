import { Spinner } from '@centrifuge/axis-spinner'
import { AgreementsStatus } from '@centrifuge/onboard-api/src/controllers/types'
import { ITinlake } from '@centrifuge/tinlake-js'
import { Box, Button, Heading } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PageTitle from '../../components/PageTitle'
import { PoolLink } from '../../components/PoolLink'
import config, { Pool } from '../../config'
import { loadOnboardingStatus, OnboardingState } from '../../ducks/onboarding'
import AgreementStep from './AgreementStep'
import ConnectStep from './ConnectStep'
import KycStep from './KycStep'
import { Step, StepBody, StepHeader, StepIcon, StepTitle } from './styles'

interface Props {
  activePool: Pool
  tinlake: ITinlake
}

export type Step = 'connect' | 'kyc' | 'agreement' | 'invest'

const DefaultTranche = 'senior'

const deleteMyAccount = async (address: string, session: string) => {
  await fetch(`${config.onboardAPIHost}addresses/${address}?session=${session}`, { method: 'DELETE' })
  window.location.reload()
}

const OnboardingSteps: React.FC<Props> = (props: Props) => {
  const dispatch = useDispatch()

  const address = useSelector<any, string | null>((state) => state.auth.address)
  const onboarding = useSelector<any, OnboardingState>((state) => state.onboarding)
  const kycStatus = onboarding.data?.kyc?.requiresSignin ? 'requires-signin' : onboarding.data?.kyc?.status
  const accreditationStatus = onboarding.data?.kyc?.isUsaTaxResident ? onboarding.data?.kyc?.accredited || false : true
  const agreement = (onboarding.data?.agreements || []).filter(
    (agreement: AgreementsStatus) => agreement.tranche === DefaultTranche
  )[0]
  const whitelistStatus = onboarding.data?.kyc?.isWhitelisted
    ? onboarding.data?.kyc?.isWhitelisted[DefaultTranche]
    : false
  const agreementStatus = agreement?.counterSigned ? 'countersigned' : agreement?.signed ? 'signed' : 'none'

  const router = useRouter()
  const session = 'session' in router.query ? router.query.session : ''

  React.useEffect(() => {
    dispatch(loadOnboardingStatus(props.activePool))

    if (!address) setActiveSteps(1)
    else if (!kycStatus || kycStatus === 'none' || kycStatus === 'requires-signin' || kycStatus === 'updates-required')
      setActiveSteps(2)
    else if (kycStatus === 'verified' && !accreditationStatus) setActiveSteps(2)
    else if (agreementStatus === 'none') setActiveSteps(3)
    else if (kycStatus === 'processing' && agreementStatus === 'signed') setActiveSteps(3)
    // TODO: what to do here?
    else if (kycStatus === 'processing' && agreementStatus === 'countersigned') setActiveSteps(2)
    else if ((kycStatus === 'verified' && agreementStatus === 'signed') || !whitelistStatus) setActiveSteps(3)
    else setActiveSteps(4) // TODO: what to do here
  }, [address, props.activePool, kycStatus, agreementStatus])

  const [activeSteps, setActiveSteps] = React.useState(0)

  return (
    <Box margin={{ top: 'medium' }}>
      <PageTitle pool={props.activePool} page="Onboarding" parentPage="Investments" parentPageHref="/investments" />
      <Heading level="5" margin={{ bottom: 'medium' }} style={{ maxWidth: '100%' }}>
        To invest in this pool, start your onboarding process now.
      </Heading>

      <Box pad="medium" elevation="small" round="xsmall" background="white">
        {address && onboarding.state !== 'found' ? (
          <Spinner height={'400px'} message={'Loading...'} />
        ) : (
          <>
            <ConnectStep {...props} />
            <KycStep
              {...props}
              onboarding={onboarding}
              kycStatus={kycStatus}
              accreditationStatus={accreditationStatus}
              active={activeSteps >= 2}
            />
            <AgreementStep
              {...props}
              onboarding={onboarding}
              agreement={agreement}
              agreementStatus={agreementStatus}
              whitelistStatus={whitelistStatus}
              active={activeSteps >= 3}
            />
            <Step>
              <StepHeader>
                <StepIcon inactive={activeSteps < 4} />
                <StepTitle inactive={activeSteps < 4}>Invest in {props.activePool.metadata.name}</StepTitle>
              </StepHeader>
              {activeSteps >= 4 && (
                <StepBody>
                  <Box pad={{ vertical: 'medium' }}>
                    You're now ready to invest in {props.activePool.metadata.name}!
                  </Box>
                  <Box>
                    <div>
                      <PoolLink href={{ pathname: '/investments', query: { invest: 'senior' } }}>
                        <Button primary label={'Invest'} fill={false} />
                      </PoolLink>
                    </div>
                  </Box>
                </StepBody>
              )}
            </Step>
          </>
        )}
      </Box>

      {address && kycStatus && session && config.isDemo && (
        <Box margin={{ top: 'medium', left: 'auto' }}>
          <div>
            <Button
              label="Delete my account"
              secondary
              size="small"
              onClick={() => deleteMyAccount(address, session as string)}
            />
          </div>
        </Box>
      )}
    </Box>
  )
}

export default OnboardingSteps
