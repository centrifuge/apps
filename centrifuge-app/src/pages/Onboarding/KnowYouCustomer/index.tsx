import { AuthorizedSignerVerification } from './AuthorizedSignerVerification'
import { CountryOfIssuance } from './CountryOfIssuance'
import { LivelinessCheck } from './LivelinessCheck'
import { PhotoID } from './PhotoID'

type Props = {
  nextKnowYourCustomerStep: () => void
  nextStep: () => void
  activeKnowYourCustomerStep: number
}

export const KnowYouCustomer = ({ nextStep, activeKnowYourCustomerStep, nextKnowYourCustomerStep }: Props) => {
  if (activeKnowYourCustomerStep === 0) {
    return <AuthorizedSignerVerification nextKnowYourCustomerStep={nextKnowYourCustomerStep} />
  }

  if (activeKnowYourCustomerStep === 1) {
    return <CountryOfIssuance nextKnowYourCustomerStep={nextKnowYourCustomerStep} />
  }

  if (activeKnowYourCustomerStep === 2) {
    return <PhotoID nextKnowYourCustomerStep={nextKnowYourCustomerStep} />
  }

  if (activeKnowYourCustomerStep === 3) {
    return <LivelinessCheck nextStep={nextStep} />
  }

  return null
}
