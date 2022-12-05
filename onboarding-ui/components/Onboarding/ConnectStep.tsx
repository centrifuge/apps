import * as React from 'react'
import { Button } from '../Button'
import { Step, StepProps } from './Step'
import { StepParagraph } from './StepParagraph'

interface Props {
  state: StepProps['state']
  address: string | null
  connect: () => void
}

const ConnectStep: React.FC<Props> = ({ address, connect, state }) => {
  return (
    <Step title="Connect wallet" state={state}>
      {!address && (
        <>
          <StepParagraph>Please connect with the wallet you want to use for investment.</StepParagraph>
          <Button largeOnMobile={false} primary label="Connect" onClick={connect} />
        </>
      )}
    </Step>
  )
}

export default ConnectStep
