import { Spinner } from '@centrifuge/axis-spinner'
import { AgreementsStatus } from '@centrifuge/onboarding-api/src/controllers/types'
import { ITinlake } from '@centrifuge/tinlake-js'
import { Anchor, Box, Button, Table, TableBody, TableCell, TableRow } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PageTitle from '../../components/PageTitle'
import { PoolLink } from '../../components/PoolLink'
import config, { Pool } from '../../config'
import { loadOnboardingStatus, OnboardingState } from '../../ducks/onboarding'
import { ExplainerCard } from '../Investment/View/styles'
import AgreementStep from './AgreementStep'
import ConnectStep from './ConnectStep'
import KycStep from './KycStep'
import LinkStep from './LinkStep'
import { HelpIcon, Step, StepBody, StepHeader, StepIcon, StepTitle } from './styles'

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
    else if (!kycStatus) {
      setActiveSteps(2)
    } else if (kycStatus === 'none' || kycStatus === 'requires-signin' || kycStatus === 'updates-required') {
      setActiveSteps(3)
    } else if (kycStatus === 'verified' && !accreditationStatus) {
      setActiveSteps(3)
    } else if (agreementStatus === 'none') {
      setActiveSteps(4)
    } else if (kycStatus === 'processing' && !whitelistStatus) {
      setActiveSteps(4)
    } else if (kycStatus === 'processing' && agreementStatus === 'signed') {
      setActiveSteps(4)
    } else if (kycStatus === 'processing' && agreementStatus === 'countersigned') {
      setActiveSteps(3)
    } else if ((kycStatus === 'verified' && agreementStatus === 'signed') || !whitelistStatus) {
      setActiveSteps(4)
    } else {
      setActiveSteps(5)
    }
  }, [address, props.activePool, kycStatus, agreementStatus])

  const [activeSteps, setActiveSteps] = React.useState(0)

  return (
    <Box margin={{ top: 'medium' }}>
      <PageTitle pool={props.activePool} page="Onboarding" parentPage="Investments" parentPageHref="/investments" />
      {/* <Heading level="5" margin={{ bottom: 'medium' }} style={{ maxWidth: '100%' }}>
        To invest in this pool, start your onboarding process now.
      </Heading> */}

      <Box direction="row" gap="medium">
        <Box pad="medium" elevation="small" round="xsmall" background="white" basis="2/3">
          {address && onboarding.state !== 'found' ? (
            <Spinner height={'400px'} message={'Loading...'} />
          ) : (
            <>
              {onboarding.data?.linkedAddresses && onboarding.data?.linkedAddresses.length > 0 && (
                <ExplainerCard margin={{ bottom: 'medium' }}>
                  This account is linked to {onboarding.data?.linkedAddresses.join(', ')}.
                </ExplainerCard>
              )}

              <ConnectStep {...props} />
              <LinkStep {...props} onboarding={onboarding} linked={!!kycStatus} active={activeSteps >= 2} />
              <KycStep
                {...props}
                onboarding={onboarding}
                kycStatus={kycStatus}
                accreditationStatus={accreditationStatus}
                active={activeSteps >= 3}
              />
              <AgreementStep
                {...props}
                onboarding={onboarding}
                agreement={agreement}
                agreementStatus={agreementStatus}
                whitelistStatus={whitelistStatus}
                active={activeSteps >= 4}
              />
              <Step>
                <StepHeader>
                  <StepIcon inactive={activeSteps < 5} />
                  <StepTitle inactive={activeSteps < 5}>Invest in {props.activePool.metadata.name}</StepTitle>
                </StepHeader>
                {activeSteps >= 5 && (
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
        <Box basis="1/3">
          <Box background="#eee" pad="medium" round="xsmall" style={{ color: '#555555' }}>
            <Box direction="row" pad={'0 0 14px'}>
              <HelpIcon src="/static/help-circle.svg" />
              <h3 style={{ margin: 0 }}>How to invest</h3>
            </Box>
            Pools have real world legal structure (SPVs). Investing requires KYC plus singing subdoc. There are certain
            investment restrictions per pool. Minimum amount, ususall 10k or 5k. Residents from some countries may be
            blocked [link list of sanctioned countries]
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell scope="row" border={{ color: 'transparent' }}>
                    <Box direction="row">Minimum investment</Box>
                  </TableCell>
                  <TableCell style={{ textAlign: 'end' }} border={{ color: 'transparent' }}>
                    10.000 DAI
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <Anchor href="https://docs.centrifuge.io/tinlake/userguide/investing/" target="_blank">
              Read the User Guide
            </Anchor>
          </Box>
        </Box>
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
