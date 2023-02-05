import { WalletMenu } from '@centrifuge/centrifuge-react'
import { Box, Flex, Grid, IconX, Shelf, Stack, Step, Stepper } from '@centrifuge/fabric'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { useOnboardingUser } from '../../components/OnboardingUserProvider'
import { Spinner } from '../../components/Spinner'
import { config } from '../../config'
import { InvestorTypes } from '../../types'
import { useOnboardingStep } from '../../utils/useOnboardingStep'
import { Accreditation } from './Accreditation'
import { BusinessInformation } from './BusinessInformation'
import { BusinessOwnership } from './BusinessOwnership'
import { Completed } from './Completed'
import { InvestorType } from './InvestorType'
import { KnowYourCustomer } from './KnowYourCustomer'
import { LinkWallet } from './LinkWallet'
import { SignSubscriptionAgreement } from './SignSubscriptionAgreement'
import { TaxInfo } from './TaxInfo'

// TODO: make dynamic based on the pool and tranche that the user is onboarding to
const trancheId = 'FAKETRANCHEID'
const poolId = 'FAKEPOOLID'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const [_, WordMark] = config.logo

export const OnboardingPage: React.FC = () => {
  const { onboardingUser } = useOnboardingUser()
  const [investorType, setInvestorType] = React.useState<InvestorTypes>()
  const { activeStep, nextStep, backStep, setActiveStep, isFetchingStep } = useOnboardingStep()

  const isOnboarded = !!onboardingUser?.steps?.signAgreements[poolId][trancheId].completed

  React.useEffect(() => {
    if (onboardingUser?.investorType) {
      setInvestorType(onboardingUser.investorType)
    }
  }, [onboardingUser?.investorType])

  return (
    <Flex backgroundColor="backgroundSecondary" minHeight="100vh" flexDirection="column">
      <Shelf as="header" justifyContent="space-between" gap={2} p={3}>
        <Shelf alignItems="center" gap={3}>
          <Box as={Link} to="/" width={110}>
            <WordMark />
          </Box>

          <Box pt={1}>Pool</Box>
        </Shelf>
        <Box width="300px">
          <WalletMenu />
        </Box>
      </Shelf>
      {isFetchingStep ? (
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
        >
          <Box paddingTop={10} paddingLeft={7} paddingRight={7} paddingBottom={6}>
            <Stepper activeStep={activeStep} setActiveStep={isOnboarded ? null : setActiveStep}>
              <Step label="Link wallet" />
              <Step label="Selector investor type" />
              {investorType === 'individual' && (activeStep > 2 || !!onboardingUser?.investorType) && (
                <>
                  <Step label="Identity verification" />
                  <Step label="Tax information" />
                  {onboardingUser?.countryOfCitizenship === 'us' && <Step label="Accreditation" />}
                  <Step label="Sign subscription agreement" />
                </>
              )}
              {investorType === 'entity' && (activeStep > 2 || !!onboardingUser?.investorType) && (
                <>
                  <Step label="Business information" />
                  <Step label="Business ownership" />
                  <Step label="Authorized signer verification" />
                  <Step label="Tax information" />
                  {onboardingUser?.investorType === 'entity' && onboardingUser?.jurisdictionCode === 'us' && (
                    <Step label="Accreditation" />
                  )}
                  <Step label="Sign subscription agreement" />
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
            {activeStep === 1 && <LinkWallet nextStep={nextStep} />}
            {activeStep === 2 && (
              <InvestorType
                investorType={investorType}
                nextStep={nextStep}
                backStep={backStep}
                setInvestorType={setInvestorType}
              />
            )}
            {investorType === 'entity' && (
              <>
                {activeStep === 3 && <BusinessInformation nextStep={nextStep} backStep={backStep} />}
                {activeStep === 4 && <BusinessOwnership nextStep={nextStep} backStep={backStep} />}
                {activeStep === 5 && <KnowYourCustomer backStep={backStep} nextStep={nextStep} />}
                {activeStep === 6 && <TaxInfo backStep={backStep} nextStep={nextStep} />}
                {onboardingUser?.investorType === 'entity' && onboardingUser.jurisdictionCode === 'us' ? (
                  <>
                    {activeStep === 7 && <Accreditation backStep={backStep} nextStep={nextStep} />}
                    {activeStep === 8 && <SignSubscriptionAgreement backStep={backStep} nextStep={nextStep} />}
                    {activeStep === 9 && <Completed />}
                  </>
                ) : (
                  <>
                    {activeStep === 7 && <SignSubscriptionAgreement backStep={backStep} nextStep={nextStep} />}
                    {activeStep === 8 && <Completed />}
                  </>
                )}
              </>
            )}
            {investorType === 'individual' && (
              <>
                {activeStep === 3 && <KnowYourCustomer backStep={backStep} nextStep={nextStep} />}
                {activeStep === 4 && <TaxInfo backStep={backStep} nextStep={nextStep} />}
                {onboardingUser?.investorType === 'individual' && onboardingUser.countryOfCitizenship === 'us' ? (
                  <>
                    {activeStep === 5 && <Accreditation backStep={backStep} nextStep={nextStep} />}
                    {activeStep === 6 && <SignSubscriptionAgreement backStep={backStep} nextStep={nextStep} />}
                    {activeStep === 7 && <Completed />}
                  </>
                ) : (
                  <>
                    {activeStep === 5 && <SignSubscriptionAgreement backStep={backStep} nextStep={nextStep} />}
                    {activeStep === 6 && <Completed />}
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
