import { OnboardingUser } from '../types'

/*
 * ------------------------------------------Onboarding Steps------------------------------------------
 * Entity (US)                Entity (Non-US)            Individual (US)            Individual (Non-US)
 * 1. Link Wallet             1. Link Wallet             1. Link Wallet             1. Link Wallet
 * 2. Choose Investor Type    2. Choose Investor Type    2. Choose Investor Type    2. Choose Investor Type
 * 3. Verify Business         3. Verify Business         3. Verify Identity         3. Verify Identity
 * 4. Confirm Owners          4. Confirm Owners          4. Verify Tax Info         4. Verify Tax Info
 * 5. Verify Identity         5. Verify Identity         5. Verify Accreditation    5. Sign Agreement
 * 6. Verify Tax Info         6. Verify Tax Info         6. Sign Agreement          6. Complete
 * 7. Verify Accreditation    7. Sign Agreement          7. Complete
 * 8. Sign Agreement          8. Complete
 * 9. Complete
 */

export const getActiveOnboardingStep = (onboardingUser: OnboardingUser, poolId: string, trancheId: string) => {
  // user does not exist
  if (!Object.keys(onboardingUser).length) return 1

  const { investorType, countryOfCitizenship } = onboardingUser
  const { verifyIdentity, verifyTaxInfo, verifyAccreditation } = onboardingUser.steps

  const completed = onboardingUser.steps.signAgreements[poolId][trancheId].completed

  if (investorType === 'entity') {
    const { jurisdictionCode } = onboardingUser
    const { confirmOwners, verifyBusiness } = onboardingUser.steps

    if (jurisdictionCode === 'us') {
      if (completed) return 9
      if (verifyAccreditation.completed) return 8
    } else {
      if (completed) return 8
    }

    if (verifyTaxInfo.completed) return 7
    if (verifyIdentity.completed) return 6
    if (confirmOwners.completed) return 5
    if (verifyBusiness.completed) return 4
  }

  if (investorType === 'individual') {
    if (countryOfCitizenship === 'us') {
      if (completed) return 7
      if (verifyAccreditation.completed) return 6
    } else {
      if (completed) return 6
    }

    if (verifyTaxInfo.completed) return 5
    if (verifyIdentity.completed) return 4
  }

  return 1
}
