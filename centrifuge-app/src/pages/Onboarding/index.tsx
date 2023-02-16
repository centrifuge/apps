import { useWallet, WalletMenu } from '@centrifuge/centrifuge-react'
import { Box, Flex, Grid, IconX, Shelf, Stack, Step, Stepper } from '@centrifuge/fabric'
import * as React from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../../components/AuthProvider'
import { useOnboarding } from '../../components/OnboardingProvider'
import { Spinner } from '../../components/Spinner'
import { config } from '../../config'
import { InvestorTypes } from '../../types'
import { useOnboardingStep } from '../../utils/useOnboardingStep'
import { Accreditation } from './Accreditation'
import { ApprovalStatus } from './ApprovalStatus'
import { BusinessInformation } from './BusinessInformation'
import { BusinessOwnership } from './BusinessOwnership'
import { InvestorType } from './InvestorType'
import { KnowYourCustomer } from './KnowYourCustomer'
import { LinkWallet } from './LinkWallet'
import { SignSubscriptionAgreement } from './SignSubscriptionAgreement'
import { TaxInfo } from './TaxInfo'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const [_, WordMark] = config.logo

export const OnboardingPage: React.FC = () => {
  const { selectedAccount } = useWallet()
  const { onboardingUser, pool } = useOnboarding()
  const [investorType, setInvestorType] = React.useState<InvestorTypes>()
  const { activeStep, nextStep, backStep, setActiveStep, isFetchingStep } = useOnboardingStep()
  const { authToken } = useAuth()
  const [hasSignedAgreement, setHasSignedAgreement] = React.useState(false)

  React.useEffect(() => {
    if (onboardingUser?.steps?.signAgreements) {
      setHasSignedAgreement(
        onboardingUser.steps.signAgreements[pool.id][pool.trancheId].signedDocument &&
          !!onboardingUser.steps.signAgreements[pool.id][pool.trancheId].transactionInfo.extrinsicHash
      )
    }
  }, [onboardingUser?.steps?.signAgreements, pool.id, pool.trancheId])

  const { data: signedAgreementData, isFetched: isSignedAgreementFetched } = useQuery(
    ['signed subscription agreement', selectedAccount?.address, pool.id, pool.trancheId],
    async () => {
      const response = await fetch(
        `${import.meta.env.REACT_APP_ONBOARDING_API_URL}/getSignedAgreement?poolId=${pool.id}&trancheId=${
          pool.trancheId
        }`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      )

      const json = await response.json()

      const documentBlob = new Blob([Uint8Array.from(json.signedAgreement.data).buffer], {
        type: 'application/pdf',
      })

      return URL.createObjectURL(documentBlob)
    },
    {
      enabled: hasSignedAgreement,
      refetchOnWindowFocus: false,
    }
  )

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
                {onboardingUser?.investorType === 'entity' && onboardingUser.jurisdictionCode.startsWith('us') ? (
                  <>
                    {activeStep === 7 && <Accreditation backStep={backStep} nextStep={nextStep} />}
                    {activeStep === 8 && (
                      <SignSubscriptionAgreement
                        backStep={backStep}
                        nextStep={nextStep}
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
                        backStep={backStep}
                        nextStep={nextStep}
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
                {activeStep === 3 && <KnowYourCustomer backStep={backStep} nextStep={nextStep} />}
                {activeStep === 4 && <TaxInfo backStep={backStep} nextStep={nextStep} />}
                {onboardingUser?.investorType === 'individual' && onboardingUser.countryOfCitizenship === 'us' ? (
                  <>
                    {activeStep === 5 && <Accreditation backStep={backStep} nextStep={nextStep} />}
                    {activeStep === 6 && (
                      <SignSubscriptionAgreement
                        backStep={backStep}
                        nextStep={nextStep}
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
                        backStep={backStep}
                        nextStep={nextStep}
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
