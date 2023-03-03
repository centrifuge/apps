import { Box, Step, Stepper } from '@centrifuge/fabric'
import * as React from 'react'
import { Container, Header, Layout } from '../../components/Onboarding'
import { useOnboarding } from '../../components/OnboardingProvider'
import { InvestorTypes } from '../../types'
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

export const OnboardingPage: React.FC = () => {
  const { onboardingUser, activeStep, setActiveStep, isLoadingStep } = useOnboarding()
  const [investorType, setInvestorType] = React.useState<InvestorTypes>()

  const { data: signedAgreementData, isFetched: isSignedAgreementFetched } = useSignedAgreement()

  React.useEffect(() => {
    if (onboardingUser?.investorType) {
      setInvestorType(onboardingUser.investorType)
    }
  }, [onboardingUser?.investorType])

  return (
    <Layout>
      <Header>
        <Box pt={1}>Pool</Box>
      </Header>

      <Container
        isLoading={isLoadingStep}
        aside={
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
        }
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
      </Container>
    </Layout>
  )
}
