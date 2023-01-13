type Props = {
  nextKnowYourCustomerStep: () => void
}

export const PhotoID = ({ nextKnowYourCustomerStep }: Props) => {
  return (
    <div>
      PhotoID<button onClick={nextKnowYourCustomerStep}>Next</button>
    </div>
  )
}
