import { Spinner } from '@centrifuge/axis-spinner'
import { AgreementsStatus } from '@centrifuge/onboarding-api/src/controllers/types'
import { Anchor } from 'grommet'
import Link from 'next/link'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useSelector } from 'react-redux'
import config, { Pool } from '../../config'
import { AuthState } from '../../ducks/auth'
import { useAddress } from '../../utils/useAddress'
import { useOnboardingState } from '../../utils/useOnboardingState'
import { Button } from '../Button'
import { Card } from '../Card'
import { Box, Center, Stack } from '../Layout'
import { PoolLink } from '../PoolLink'
import { Text } from '../Text'
import AgreementStep from './AgreementStep'
import ConnectStep from './ConnectStep'
import { Header } from './Header'
import KycStep from './KycStep'
import LinkStep from './LinkStep'
import { MultipleAddressesNotice } from './MultipleAddressesNotice'
import { Step } from './Step'
import { StepParagraph } from './StepParagraph'

interface Props {
  activePool: Pool
  market?: 'rwa-market'
}

type Tranche = 'junior' | 'senior'

const DefaultTranche = 'senior'

const deleteMyAccount = async (address: string, session: string) => {
  await fetch(`${config.onboardAPIHost}addresses/${address}?session=${session}`, { method: 'DELETE' })
  window.location.reload()
}

function getState(step: number, activeStep: number) {
  if (activeStep === step) return 'active'
  if (activeStep > step) return 'done'
  return 'todo'
}

export const PoolOnboarding: React.FC<Props> = ({ activePool, market }) => {
  const router = useRouter()
  const session = 'session' in router.query ? router.query.session : ''
  const trancheOverride = router.query.tranche as Tranche | undefined
  const tranche = trancheOverride || DefaultTranche

  const address = useAddress()
  const { authState } = useSelector<any, AuthState>((state) => state.auth)
  const onboarding = useOnboardingState(activePool, tranche)

  const kycStatus = onboarding.data?.kyc?.requiresSignin ? 'requires-signin' : onboarding.data?.kyc?.status
  const accreditationStatus = onboarding.data?.kyc?.isUsaTaxResident ? onboarding.data?.kyc?.accredited || false : true
  const agreement = (onboarding.data?.agreements || []).filter(
    (agreement: AgreementsStatus) => agreement.tranche === tranche
  )[0]
  const whitelistStatus = onboarding.data?.kyc?.isWhitelisted ? onboarding.data?.kyc?.isWhitelisted[tranche] : false
  const agreementStatus = agreement?.declined
    ? 'declined'
    : agreement?.voided
    ? 'voided'
    : agreement?.counterSigned
    ? 'countersigned'
    : agreement?.signed
    ? 'signed'
    : 'none'

  React.useEffect(() => {
    if (!address) setActiveStep(1)
    else if (whitelistStatus === true) {
      setActiveStep(5)
    } else if (!kycStatus) {
      setActiveStep(2)
    } else if (['none', 'requires-signin', 'updates-required', 'rejected', 'expired'].includes(kycStatus)) {
      setActiveStep(3)
    } else if (kycStatus === 'verified' && !accreditationStatus) {
      setActiveStep(3)
    } else if (agreementStatus === 'none') {
      setActiveStep(4)
    } else if (kycStatus === 'processing' && agreementStatus === 'countersigned') {
      setActiveStep(3)
    } else if (kycStatus === 'processing' && agreementStatus === 'signed') {
      setActiveStep(4)
    } else if (kycStatus === 'processing' && !whitelistStatus) {
      setActiveStep(4)
    } else if ((kycStatus === 'verified' && agreementStatus === 'signed') || !whitelistStatus) {
      setActiveStep(4)
    } else {
      setActiveStep(5)
    }
  }, [address, kycStatus, agreementStatus])

  const [activeStep, setActiveStep] = React.useState(0)

  const hideKYC = kycStatus === 'verified' && accreditationStatus
  const logo = market === 'rwa-market' ? '/static/rwa-market.svg' : '/static/logo.svg'
  const logoHeight = market === 'rwa-market' ? 87 : 16
  const logoMargin = market === 'rwa-market' ? 'xsmall' : 'medium'

  return (
    <>
      <Card px={['medium', 'xxlarge']} py={['medium', 'large']}>
        <Stack gap="large">
          <Stack alignItems="center">
            <Box as="img" src={logo} height={logoHeight} mb={logoMargin} />
            <Header
              title={!market ? `${activePool.metadata.name} ${tranche === 'senior' ? 'DROP' : 'TIN'}` : ''}
              subtitle={market ? 'Onboard as investor' : 'Onboard to token'}
            />
          </Stack>
          {authState === 'initialAuthing' || (address && !onboarding.data) ? (
            <Spinner height={'400px'} message={'Loading...'} />
          ) : (
            <>
              {onboarding.data?.linkedAddresses && onboarding.data?.linkedAddresses.length > 0 && (
                <MultipleAddressesNotice
                  linkedAddresses={onboarding.data?.linkedAddresses}
                  connectedAddress={address!}
                />
              )}
              <div>
                <ConnectStep state={getState(1, activeStep)} />
                {!hideKYC && (
                  <>
                    <LinkStep state={getState(2, activeStep)} onboardingData={onboarding.data} />
                    <KycStep
                      state={getState(3, activeStep)}
                      onboardingData={onboarding.data}
                      kycStatus={kycStatus}
                      agreementStatus={agreementStatus}
                      accreditationStatus={accreditationStatus}
                    />
                  </>
                )}
                <AgreementStep
                  state={getState(4, activeStep)}
                  activePool={activePool}
                  onboardingData={onboarding.data}
                  agreement={agreement}
                  agreementStatus={agreementStatus}
                  whitelistStatus={whitelistStatus}
                />
                <Step title="Invest in token" state={getState(5, activeStep)} last>
                  {activeStep === 5 &&
                    (market === 'rwa-market' ? (
                      <>
                        <StepParagraph>
                          Congratulations, you’ve successfully onboarded to the RWA Market! <br />
                          You are now ready to invest.
                        </StepParagraph>
                        <Link href="https://rwamarket.io/#/deposit/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb480xb953a066377176092879a151c07798b3946eea4b">
                          <Button primary label={'Invest'} largeOnMobile={false} />
                        </Link>
                      </>
                    ) : (
                      <>
                        <StepParagraph>
                          Congratulations, you’ve successfully onboarded to the token! <br />
                          You are now ready to invest.
                        </StepParagraph>
                        <PoolLink href={{ pathname: '/investments', query: { invest: 'senior' } }}>
                          <Button primary label={'Invest'} largeOnMobile={false} />
                        </PoolLink>
                      </>
                    ))}
                </Step>
              </div>
            </>
          )}
          <Center mt="xlarge">
            <Text color="#777777" fontSize="14px">
              Need help?{' '}
              <Anchor
                color="#777777"
                href="https://docs.centrifuge.io/use/onboarding/"
                target="_blank"
                label="Read the onboarding guide"
                style={{ display: 'inline' }}
              />
            </Text>
          </Center>
        </Stack>
      </Card>

      {address && kycStatus && session && config.isDemo && (
        <Box mt="large" ml="auto">
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
    </>
  )
}
