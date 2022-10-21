import { Spinner } from '@centrifuge/axis-spinner'
import { AxisTheme } from '@centrifuge/axis-theme'
import { Anchor } from 'grommet'
import Link from 'next/link'
import { useRouter } from 'next/router'
import * as React from 'react'
import config from '../config'
import { theme } from '../theme'
import { Button } from './Button'
import { Card } from './Card'
import { Box, Center, Stack } from './Layout'
import ConnectStep from './Onboarding/ConnectStep'
import { Header } from './Onboarding/Header'
import KycStep from './Onboarding/KycStep'
import LinkStep from './Onboarding/LinkStep'
import { MultipleAddressesNotice } from './Onboarding/MultipleAddressesNotice'
import { Step } from './Onboarding/Step'
import { StepParagraph } from './Onboarding/StepParagraph'
import { PageContainer } from './PageContainer'
import { Text } from './Text'

type AuthState = null | 'initialAuthing' | 'authing' | 'aborted' | 'authed'

interface Props {
  hidePageTitle?: boolean
  onboarding: any
  address: string | null
  authState: AuthState
  connect: () => void
}

const deleteMyAccount = async (address: string, session: string) => {
  await fetch(`${config.onboardAPIHost}addresses/${address}?session=${session}`, { method: 'DELETE' })
  window.location.reload()
}

function getState(step: number, activeStep: number) {
  if (activeStep === step) return 'active'
  if (activeStep > step) return 'done'
  return 'todo'
}

export const InvestorOnboarding: React.FC<Props> = ({ authState, address, connect, onboarding }) => {
  const router = useRouter()
  const session = 'session' in router.query ? router.query.session : ''

  const completed = onboarding.data?.completed
  const kycStatus = onboarding.data?.kycStatus
  const accreditationStatus = onboarding.data?.accreditationStatus ?? true

  React.useEffect(() => {
    if (!address) setActiveStep(1)
    else if (completed) {
      setActiveStep(4)
    } else if (!kycStatus) {
      setActiveStep(2)
    } else if (
      ['none', 'requires-signin', 'updates-required', 'rejected', 'expired', 'processing'].includes(kycStatus)
    ) {
      setActiveStep(3)
    } else if (kycStatus === 'verified' && !accreditationStatus) {
      setActiveStep(3)
    } else {
      setActiveStep(4)
    }
  }, [address, kycStatus, accreditationStatus, completed])

  const [activeStep, setActiveStep] = React.useState(0)

  return (
    <AxisTheme full={true} theme={theme}>
      <PageContainer width="funnel" noMargin>
        <Card px={['medium', 'xxlarge']} py={['medium', 'large']}>
          <Stack gap="large">
            <Stack alignItems="center">
              <Box as="img" src="/static/logo.svg" height={16} mb="medium" />
              <Header title="Onboard as investor" />
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
                  <LinkStep state={getState(2, activeStep)} onboardingData={onboarding.data} />
                  <KycStep
                    state={getState(3, activeStep)}
                    onboardingData={onboarding.data}
                    kycStatus={kycStatus}
                    accreditationStatus={accreditationStatus}
                  />
                  <Step title="Finish onboarding" state={getState(4, activeStep)} last>
                    {activeStep === 4 && (
                      <>
                        <StepParagraph>
                          Congratulations, you’ve successfully onboarded as Tinlake investor!
                          <br />
                          Select a pool to start investing.
                        </StepParagraph>
                        <Link href="/">
                          <Button primary label="Browse pools" largeOnMobile={false} />
                        </Link>
                      </>
                    )}
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
