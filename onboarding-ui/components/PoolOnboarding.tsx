import { Spinner } from '@centrifuge/axis-spinner'
import { AxisTheme } from '@centrifuge/axis-theme'
import { Anchor } from 'grommet'
import Link from 'next/link'
import { useRouter } from 'next/router'
import * as React from 'react'
import config, { Pool } from '../config'
import { theme } from '../theme'
import { AgreementsStatus } from '../types'
import { Button } from './Button'
import { Card } from './Card'
import { Box, Center, Stack } from './Layout'
import AgreementStep from './Onboarding/AgreementStep'
import ConnectStep from './Onboarding/ConnectStep'
import { Header } from './Onboarding/Header'
import KycStep from './Onboarding/KycStep'
import LinkStep from './Onboarding/LinkStep'
import { MultipleAddressesNotice } from './Onboarding/MultipleAddressesNotice'
import { Step } from './Onboarding/Step'
import { StepParagraph } from './Onboarding/StepParagraph'
import { PageContainer } from './PageContainer'
import { PoolLink } from './PoolLink'
import { Text } from './Text'

type AuthState = null | 'initialAuthing' | 'authing' | 'aborted' | 'authed'

interface Props {
  pool: Pool
  market?: 'rwa-market'
  onboarding: any
  address: string | null
  authState: AuthState
  connect: () => void
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

export const PoolOnboarding: React.FC<Props> = ({ authState, address, connect, pool, market, onboarding }) => {
  const router = useRouter()
  const session = 'session' in router.query ? router.query.session : ''
  const trancheOverride = router.query.tranche as Tranche | undefined
  const tranche = trancheOverride || DefaultTranche

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
    <AxisTheme full={true} theme={theme}>
      <PageContainer width="funnel" noMargin>
        <Card px={['medium', 'xxlarge']} py={['medium', 'large']}>
          <Stack gap="large">
            <Stack alignItems="center">
              <Box as="img" src={logo} height={logoHeight} mb={logoMargin} />
              <Header
                title={!market ? `${pool.metadata.name} ${tranche === 'senior' ? 'DROP' : 'TIN'}` : ''}
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
                  <ConnectStep address={address} connect={connect} state={getState(1, activeStep)} />
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
                    activePool={pool}
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
      </PageContainer>
    </AxisTheme>
  )
}
