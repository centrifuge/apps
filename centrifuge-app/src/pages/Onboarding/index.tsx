import { Step, Stepper } from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { Container, Header, Layout, PoolBranding } from '../../components/Onboarding'
import { useOnboarding } from '../../components/OnboardingProvider'
import { InvestorTypes } from '../../types'
import { usePool, usePoolMetadata } from '../../utils/usePools'
import { Accreditation } from './Accreditation'
import { ApprovalStatus } from './ApprovalStatus'
import { GlobalStatus } from './GlobalStatus'
import { InvestorType } from './InvestorType'
import { KnowYourBusiness } from './KnowYourBusiness'
import { KnowYourCustomer } from './KnowYourCustomer'
import { LinkWallet } from './LinkWallet'
import { useGlobalOnboardingStatus } from './queries/useGlobalOnboardingStatus'
import { useSignedAgreement } from './queries/useSignedAgreement'
import { SignSubscriptionAgreement } from './SignSubscriptionAgreement'
import { UltimateBeneficialOwners } from './UltimateBeneficialOwners'

export default function OnboardingPage() {
  const [investorType, setInvestorType] = React.useState<InvestorTypes>()
  const { search } = useLocation()
  const poolId = new URLSearchParams(search).get('poolId')
  const trancheId = new URLSearchParams(search).get('trancheId')
  const { onboardingUser, activeStep, setActiveStep, isLoadingStep, setPool, pool } = useOnboarding()
  const { data: globalOnboardingStatus, isFetching: isFetchingGlobalOnboardingStatus } = useGlobalOnboardingStatus()

  const history = useHistory()
  const poolDetails = usePool(poolId || '', false)
  const { data: metadata } = usePoolMetadata(poolDetails)

  React.useEffect(() => {
    const isTinlakePool = poolId?.startsWith('0x')
    const trancheName = trancheId?.split('-')[1] === '0' ? 'junior' : 'senior'
    const canOnboard = isTinlakePool && metadata?.pool?.newInvestmentsStatus?.[trancheName] !== 'closed'

    if (!poolId || !trancheId || (isTinlakePool && !canOnboard)) {
      setPool(null)
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

    setPool(null)
    return history.push('/onboarding')
  }, [poolId, setPool, trancheId, history, poolDetails, metadata])

  const { data: signedAgreementData, isFetched: isSignedAgreementFetched } = useSignedAgreement()

  React.useEffect(() => {
    if (onboardingUser?.investorType) {
      setInvestorType(onboardingUser.investorType)
    }
  }, [onboardingUser?.investorType])

  return (
    <Layout>
      <Header>{!!poolId && <PoolBranding poolId={poolId} symbol={pool?.symbol} />}</Header>

      <Container
        isLoading={isLoadingStep || isFetchingGlobalOnboardingStatus}
        aside={
          <Stepper activeStep={activeStep} setActiveStep={setActiveStep}>
            <Step label="Link wallet" />
            <Step label="Selector investor type" />
            {investorType === 'individual' && (activeStep > 2 || !!onboardingUser?.investorType) && (
              <>
                <Step label="Identity verification" />
                {onboardingUser?.countryOfCitizenship === 'us' && <Step label="Accreditation" />}
                {pool ? (
                  <>
                    <Step label="Sign subscription agreement" />
                    <Step label="Status" />
                  </>
                ) : (
                  <Step label="Status" />
                )}
              </>
            )}
            {investorType === 'entity' && (activeStep > 2 || !!onboardingUser?.investorType) && (
              <>
                <Step label="Business information" />
                <Step label="Confirm ultimate beneficial owners" />
                <Step label="Authorized signer verification" />
                {onboardingUser?.investorType === 'entity' && onboardingUser?.jurisdictionCode.startsWith('us') && (
                  <Step label="Accreditation" />
                )}
                {pool ? (
                  <>
                    <Step label="Sign subscription agreement" />
                    <Step label="Status" />
                  </>
                ) : (
                  <Step label="Status" />
                )}
              </>
            )}
            {activeStep < 3 && !onboardingUser?.investorType && <Step empty />}
          </Stepper>
        }
      >
        {activeStep === 1 && <LinkWallet globalOnboardingStatus={globalOnboardingStatus} />}
        {activeStep === 2 && <InvestorType investorType={investorType} setInvestorType={setInvestorType} />}
        {investorType === 'entity' && (
          <>
            {activeStep === 3 && <KnowYourBusiness />}
            {activeStep === 4 && <UltimateBeneficialOwners />}
            {activeStep === 5 && <KnowYourCustomer />}
            {onboardingUser?.investorType === 'entity' && onboardingUser.jurisdictionCode.startsWith('us') ? (
              <>
                {activeStep === 6 && <Accreditation />}
                {pool ? (
                  <>
                    {activeStep === 7 && (
                      <SignSubscriptionAgreement signedAgreementUrl={signedAgreementData as string} />
                    )}

                    {activeStep === 8 && <ApprovalStatus signedAgreementUrl={signedAgreementData} />}
                  </>
                ) : (
                  activeStep === 7 && <GlobalStatus />
                )}
              </>
            ) : pool ? (
              <>
                {activeStep === 6 && <SignSubscriptionAgreement signedAgreementUrl={signedAgreementData} />}
                {activeStep === 7 && <ApprovalStatus signedAgreementUrl={signedAgreementData} />}
              </>
            ) : (
              activeStep === 6 && <GlobalStatus />
            )}
          </>
        )}
        {investorType === 'individual' && (
          <>
            {activeStep === 3 && <KnowYourCustomer />}
            {onboardingUser?.investorType === 'individual' && onboardingUser.countryOfCitizenship === 'us' ? (
              <>
                {activeStep === 4 && <Accreditation />}
                {pool ? (
                  <>
                    {activeStep === 5 && <SignSubscriptionAgreement signedAgreementUrl={signedAgreementData} />}
                    {activeStep === 6 && <ApprovalStatus signedAgreementUrl={signedAgreementData} />}
                  </>
                ) : (
                  activeStep === 5 && <GlobalStatus />
                )}
              </>
            ) : pool ? (
              <>
                {activeStep === 4 && <SignSubscriptionAgreement signedAgreementUrl={signedAgreementData} />}
                {activeStep === 5 && <ApprovalStatus signedAgreementUrl={signedAgreementData} />}
              </>
            ) : (
              activeStep === 4 && <GlobalStatus />
            )}
          </>
        )}
      </Container>
    </Layout>
  )
}
