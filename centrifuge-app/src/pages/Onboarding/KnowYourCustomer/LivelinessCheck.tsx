type Props = {
  nextStep: () => void
}

export const LivelinessCheck = ({ nextStep }: Props) => {
  return (
    <div>
      LivelinessCheck<button onClick={nextStep}>Next</button>
    </div>
  )
}
