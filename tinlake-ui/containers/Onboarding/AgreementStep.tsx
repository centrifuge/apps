import { ITinlake } from '@centrifuge/tinlake-js'
import * as React from 'react'
import { Pool } from '../../config'
import { Step, StepHeader, StepIcon, StepTitle, StepBody } from './styles'

interface Props {
  activePool: Pool
  tinlake: ITinlake
}

const KycStep: React.FC<Props> = (props: Props) => {
  return (
    <Step>
      <StepHeader>
        <StepIcon>
          <img src="/static/circle.svg" />
        </StepIcon>
        <StepTitle inactive>Sign the Subscription Agreement</StepTitle>
      </StepHeader>
      <StepBody inactive>&nbsp;</StepBody>
    </Step>
  )
}

export default KycStep
