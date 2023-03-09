import { WalletMenu } from '@centrifuge/centrifuge-react'
import { Box, Flex, Grid, IconX, Shelf, Stack, Step, Stepper, Thumbnail } from '@centrifuge/fabric'
import * as React from 'react'
import { Link, useHistory, useLocation } from 'react-router-dom'
import { useOnboarding } from '../../components/OnboardingProvider'
import { Spinner } from '../../components/Spinner'
import { config } from '../../config'
import { InvestorTypes } from '../../types'
import { usePool } from '../../utils/usePools'
import { Accreditation } from './Accreditation'
import { ApprovalStatus } from './ApprovalStatus'
import { BusinessInformation } from './BusinessInformation'
import { BusinessOwnership } from './BusinessOwnership'
import { InvestorType } from './InvestorType'
import { KnowYourCustomer } from './KnowYourCustomer'
import { LinkWallet } from './LinkWallet'
import { useSignedAgreement } from './queries/useSignedAgreement'
import { SignSubscriptionAgreement } from './SignSubscriptionAgreement'
import { TaxInfo } from './TaxInfo'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const [_, WordMark] = config.logo

export const OnboardingPage: React.FC = () => {
  const [investorType, setInvestorType] = React.useState<InvestorTypes>()
  const { search } = useLocation()
  const poolId = new URLSearchParams(search).get('poolId')
  const trancheId = new URLSearchParams(search).get('trancheId')
  const { onboardingUser, activeStep, setActiveStep, isLoadingStep, setPool, pool } = useOnboarding()

  const history = useHistory()
  const poolDetails = usePool(poolId || '', false)

  React.useEffect(() => {
    if (!poolId || !trancheId) {
      return history.push('/onboarding')
    }

    // @ts-expect-error known typescript issue: https://github.com/microsoft/TypeScript/issues/44373
    const trancheDetails = poolDetails?.tranches.find((tranche) => tranche.id === trancheId)

    if (trancheDetails) {
      return setPool({
        id: poolId,
        trancheId,
        name: trancheDetails.currency.name,
        symbol: trancheDetails.currency.symbol,
      })
    }

    return history.push('/onboarding')
  }, [poolId, setPool, trancheId, history, poolDetails])

  const { data: signedAgreementData, isFetched: isSignedAgreementFetched } = useSignedAgreement()

  React.useEffect(() => {
    if (onboardingUser?.investorType) {
      setInvestorType(onboardingUser.investorType)
    }
  }, [onboardingUser?.investorType])

  return (
    <Flex backgroundColor="#f9f9f9" minHeight="100vh" flexDirection="column">
      <Shelf as="header" justifyContent="space-between" gap={2} p={3}>
        <Shelf alignItems="center" gap={3}>
          <Box as={Link} to="/" width={110}>
            <WordMark />
          </Box>
          {pool?.symbol && (
            <Box pt={1}>
              <Thumbnail type="token" size="large" label={pool.symbol} />
            </Box>
          )}
        </Shelf>
        <Box width="300px">
          <WalletMenu />
        </Box>
      </Shelf>
      {isLoadingStep ? (
        <Box
          mx="150px"
          my={5}
          height="520px"
          borderRadius="18px"
          backgroundColor="backgroundPrimary"
          alignItems="flex-start"
        >
          <Flex height="100%" alignItems="center" justifyContent="center">
            <Spinner />
          </Flex>
        </Box>
      ) : (
        <Grid
          columns={4}
          mx="150px"
          my={5}
          height="100%"
          borderRadius="18px"
          backgroundColor="backgroundPrimary"
          alignItems="flex-start"
          gridTemplateColumns="350px 1px 1fr min-content"
          maxWidth="1200px"
        >
          <Box paddingTop={10} paddingLeft={7} paddingRight={7} paddingBottom={6}>
            <Stepper activeStep={activeStep} setActiveStep={setActiveStep}>
              <Step label="Link wallet" />
              <Step label="Selector investor type" />
              {investorType === 'individual' && (activeStep > 2 || !!onboardingUser?.investorType) && (
                <>
                  <Step label="Identity verification" />
                  <Step label="Tax information" />
                  {onboardingUser?.countryOfCitizenship === 'us' && <Step label="Accreditation" />}
                  <Step label="Sign subscription agreement" />
                  <Step label="Status" />
                </>
              )}
              {investorType === 'entity' && (activeStep > 2 || !!onboardingUser?.investorType) && (
                <>
                  <Step label="Business information" />
                  <Step label="Business ownership" />
                  <Step label="Authorized signer verification" />
                  <Step label="Tax information" />
                  {onboardingUser?.investorType === 'entity' && onboardingUser?.jurisdictionCode.startsWith('us') && (
                    <Step label="Accreditation" />
                  )}
                  <Step label="Sign subscription agreement" />
                  <Step label="Status" />
                </>
              )}
              {activeStep < 3 && !onboardingUser?.investorType && <Step empty />}
            </Stepper>
          </Box>
          <Box height="100%" backgroundColor="borderPrimary" />
          <Stack
            paddingTop={10}
            paddingLeft={7}
            paddingRight={7}
            paddingBottom={6}
            justifyContent="space-between"
            minHeight="520px"
          >
            {activeStep === 1 && <LinkWallet />}
            {activeStep === 2 && <InvestorType investorType={investorType} setInvestorType={setInvestorType} />}
            {investorType === 'entity' && (
              <>
                {activeStep === 3 && <BusinessInformation />}
                {activeStep === 4 && <BusinessOwnership />}
                {activeStep === 5 && <KnowYourCustomer />}
                {activeStep === 6 && <TaxInfo />}
                {onboardingUser?.investorType === 'entity' && onboardingUser.jurisdictionCode.startsWith('us') ? (
                  <>
                    {activeStep === 7 && <Accreditation />}
                    {activeStep === 8 && (
                      <SignSubscriptionAgreement
                        isSignedAgreementFetched={isSignedAgreementFetched}
                        signedAgreementUrl={signedAgreementData as string}
                      />
                    )}
                    {activeStep === 9 && <ApprovalStatus signedAgreementUrl={signedAgreementData} />}
                  </>
                ) : (
                  <>
                    {activeStep === 7 && (
                      <SignSubscriptionAgreement
                        isSignedAgreementFetched={isSignedAgreementFetched}
                        signedAgreementUrl={signedAgreementData}
                      />
                    )}
                    {activeStep === 8 && <ApprovalStatus signedAgreementUrl={signedAgreementData} />}
                  </>
                )}
              </>
            )}
            {investorType === 'individual' && (
              <>
                {activeStep === 3 && <KnowYourCustomer />}
                {activeStep === 4 && <TaxInfo />}
                {onboardingUser?.investorType === 'individual' && onboardingUser.countryOfCitizenship === 'us' ? (
                  <>
                    {activeStep === 5 && <Accreditation />}
                    {activeStep === 6 && (
                      <SignSubscriptionAgreement
                        isSignedAgreementFetched={isSignedAgreementFetched}
                        signedAgreementUrl={signedAgreementData}
                      />
                    )}
                    {activeStep === 7 && <ApprovalStatus signedAgreementUrl={signedAgreementData} />}
                  </>
                ) : (
                  <>
                    {activeStep === 5 && (
                      <SignSubscriptionAgreement
                        isSignedAgreementFetched={isSignedAgreementFetched}
                        signedAgreementUrl={signedAgreementData}
                      />
                    )}
                    {activeStep === 6 && <ApprovalStatus signedAgreementUrl={signedAgreementData} />}
                  </>
                )}
              </>
            )}
          </Stack>
          <Box paddingTop={4} paddingRight={4} justifyContent="flex-end">
            <Link to="/">
              <IconX color="textPrimary" />
            </Link>
          </Box>
        </Grid>
      )}
    </Flex>
  )
}
