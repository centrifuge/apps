import * as React from 'react'
import { useDispatch } from 'react-redux'
import { ensureAuthed } from '../../ducks/auth'
import { useAddress } from '../../utils/useAddress'
import { Button } from '../Button'
import { Step, StepProps } from './Step'
import { StepParagraph } from './StepParagraph'

interface Props {
  state: StepProps['state']
}

const ConnectStep: React.FC<Props> = ({ state }) => {
  const address = useAddress()
  const dispatch = useDispatch()

  function connect() {
    dispatch(ensureAuthed())
  }

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
