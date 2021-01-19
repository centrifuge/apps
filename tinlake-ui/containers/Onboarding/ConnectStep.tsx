import { ITinlake } from '@centrifuge/tinlake-js'
import { Box, Button, Paragraph } from 'grommet'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Pool } from '../../config'
import { ensureAuthed } from '../../ducks/auth'
import { Step, StepBody, StepHeader, StepIcon, StepTitle } from './styles'

interface Props {
  activePool: Pool
  tinlake: ITinlake
}

const ConnectStep: React.FC<Props> = () => {
  const address = useSelector<any, string | null>((state) => state.auth.address)

  const dispatch = useDispatch()

  const connect = () => {
    dispatch(ensureAuthed())
  }

  return (
    <Step>
      <StepHeader>
        <StepIcon checked={!!address} />
        <StepTitle>Connect your wallet</StepTitle>
      </StepHeader>
      {!address && (
        <StepBody>
          <Paragraph margin={{ bottom: 'medium' }} style={{ width: '100%' }}>
            Please connect with the wallet you want to use for investment.
          </Paragraph>
          <div>
            <Button primary label={`Connect`} onClick={connect} fill={false} />
          </div>
          <Box margin={{ bottom: 'small' }}>&nbsp;</Box>
        </StepBody>
      )}
      {address && <StepBody>&nbsp;</StepBody>}
    </Step>
  )
}

export default ConnectStep
