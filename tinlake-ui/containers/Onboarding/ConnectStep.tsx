import { ITinlake } from '@centrifuge/tinlake-js'
import { Box, Button, Paragraph } from 'grommet'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Pool } from '../../config'
import { Step, StepHeader, StepIcon, StepTitle, StepBody } from './styles'
import { ensureAuthed } from '../../ducks/auth'

interface Props {
  activePool: Pool
  tinlake: ITinlake
  active: boolean
}

const ConnectStep: React.FC<Props> = (props: Props) => {
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
          <Box margin={{ bottom: 'medium' }}>&nbsp;</Box>
        </StepBody>
      )}
      {address && <StepBody inactive>&nbsp;</StepBody>}
    </Step>
  )
}

export default ConnectStep
