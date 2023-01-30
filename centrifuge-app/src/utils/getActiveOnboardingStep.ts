import { OnboardingUser } from '../types'

const BASE_FLOW = {
  LINK_WALLET: 1,
  CHOOSE_INVESTOR_TYPE: 2,
}

const ENTITY_FLOW = {
  US: {
    VERIFY_ACCREDITATION: 7,
    SIGN_AGREEMENT: 8,
    COMPLETE: 9,
  },
  NON_US: {
    SIGN_AGREEMENT: 7,
    COMPLETE: 8,
  },
  ...BASE_FLOW,
  VERIFY_BUSINESS: 3,
  CONFIRM_OWNERS: 4,
  VERIFY_IDENTITY: 5,
  VERIFY_TAX_INFO: 6,
}

const INDIVIDUAL_FLOW = {
  US: {
    VERIFY_ACCREDITATION: 5,
    SIGN_AGREEMENT: 6,
    COMPLETE: 7,
  },
  NON_US: {
    SIGN_AGREEMENT: 5,
    COMPLETE: 6,
  },
  ...BASE_FLOW,
  VERIFY_IDENTITY: 3,
  VERIFY_TAX_INFO: 4,
}

export const getActiveOnboardingStep = (onboardingUser: OnboardingUser, poolId: string, trancheId: string) => {
  // user does not exist
  if (!Object.keys(onboardingUser).length) return BASE_FLOW.LINK_WALLET

  const { investorType, countryOfCitizenship } = onboardingUser
  const { verifyIdentity, verifyTaxInfo, verifyAccreditation } = onboardingUser.steps

  const completed = onboardingUser.steps.signAgreements[poolId][trancheId].completed

  if (investorType === 'entity') {
    const { jurisdictionCode } = onboardingUser
    const { confirmOwners, verifyBusiness } = onboardingUser.steps

    if (jurisdictionCode === 'us') {
      if (completed) return ENTITY_FLOW.US.COMPLETE
      if (verifyAccreditation.completed) return ENTITY_FLOW.US.SIGN_AGREEMENT
      if (verifyTaxInfo.completed) return ENTITY_FLOW.US.VERIFY_ACCREDITATION
    } else {
      if (completed) return ENTITY_FLOW.NON_US.COMPLETE
      if (verifyTaxInfo.completed) return ENTITY_FLOW.US.SIGN_AGREEMENT
    }

    if (verifyIdentity.completed) return ENTITY_FLOW.VERIFY_TAX_INFO
    if (confirmOwners.completed) return ENTITY_FLOW.VERIFY_IDENTITY
    if (verifyBusiness.completed) return ENTITY_FLOW.CONFIRM_OWNERS
  }

  if (investorType === 'individual') {
    if (countryOfCitizenship === 'us') {
      if (completed) return INDIVIDUAL_FLOW.US.COMPLETE
      if (verifyAccreditation.completed) return INDIVIDUAL_FLOW.US.SIGN_AGREEMENT
      if (verifyTaxInfo.completed) return INDIVIDUAL_FLOW.US.VERIFY_ACCREDITATION
    } else {
      if (completed) return INDIVIDUAL_FLOW.NON_US.COMPLETE
      if (verifyTaxInfo.completed) return INDIVIDUAL_FLOW.NON_US.SIGN_AGREEMENT
    }

    if (verifyIdentity.completed) return INDIVIDUAL_FLOW.VERIFY_TAX_INFO
  }

  return BASE_FLOW.LINK_WALLET
}
