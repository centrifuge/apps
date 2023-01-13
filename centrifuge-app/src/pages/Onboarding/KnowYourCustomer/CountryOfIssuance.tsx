type Props = {
  nextKnowYourCustomerStep: () => void
}

export const CountryOfIssuance = ({ nextKnowYourCustomerStep }: Props) => {
  return (
    <div>
      CountryOfIssuance<button onClick={nextKnowYourCustomerStep}>Next</button>
    </div>
  )
}
