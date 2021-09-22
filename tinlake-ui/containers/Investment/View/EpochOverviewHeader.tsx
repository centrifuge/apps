import { FormDown } from 'grommet-icons'
import * as React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { SectionHeading } from '../../../components/Heading'
import { Wrap } from '../../../components/Layout'
import { LoadingValue } from '../../../components/LoadingValue/index'
import { Tooltip } from '../../../components/Tooltip'
import { createTransaction, TransactionProps } from '../../../ducks/transactions'
import { EpochData } from '../../../services/tinlake/actions'
import { secondsToHms } from '../../../utils/time'
import { Caret } from './styles'

interface Props extends TransactionProps {
  onClick: React.EventHandler<React.MouseEvent>
  isOpen: boolean
  epochData?: EpochData
  solutionState: string
}

const EpochOverview: React.FC<Props> = (props: Props) => {
  const { epochData, solutionState } = props

  return (
    <Wrap p={24} gap="small" style={{ cursor: 'pointer' }} onClick={(ev) => props.onClick!(ev)}>
      {epochData?.state === 'open' && <EpochIcon src="/static/clock.svg" />}
      {epochData?.state === 'can-be-closed' && solutionState !== 'to-be-closed' && (
        <EpochIcon src="/static/help-circle.svg" />
      )}
      {((epochData?.state === 'can-be-closed' && solutionState === 'to-be-closed') ||
        epochData?.state === 'challenge-period-ended') && <EpochIcon src="/static/circle-checked.svg" />}
      {(epochData?.state === 'in-submission-period' || epochData?.state === 'in-challenge-period') && (
        <EpochIcon src="/static/clock.svg" />
      )}

      <SectionHeading>Epoch {epochData?.id}</SectionHeading>
      <EpochState
        gap="small"
        rowGap={0}
        alignItems="baseline"
        flexDirection={['column', 'row']}
        order={[3, 'initial']}
        flexBasis={['100%', 'auto']}
      >
        <LoadingValue done={epochData?.state !== undefined} alignRight={false} maxWidth={120}>
          {epochData?.state === 'open' && <h4>Ongoing</h4>}
          {epochData?.state === 'can-be-closed' && <h4>Minimum duration ended</h4>}
          {epochData?.state === 'in-submission-period' && <h4>Computing orders</h4>}
          {epochData?.state === 'in-challenge-period' && <h4>Computing orders</h4>}
          {epochData?.state === 'challenge-period-ended' && <h4>Orders computed</h4>}
          {epochData?.state === 'open' && (
            <Tooltip
              title="Tinlake epochs have a minimum duration of 24 hours. Once the minimum duration has passed, the epoch will be closed and, if possible, the orders will be executed."
              underline
            >
              <h5>{secondsToHms(epochData?.minimumEpochTimeLeft || 0)} until end of minimum duration</h5>
            </Tooltip>
          )}
          {epochData?.state === 'can-be-closed' && (
            <>
              {solutionState === 'to-be-closed' && (
                <Tooltip
                  title="The minimum epoch duration has passed and will soon be closed automatically. All locked orders will be executed."
                  underline
                >
                  <h5>To be closed</h5>
                </Tooltip>
              )}
              {solutionState === 'no-orders-locked' && (
                <Tooltip
                  title="The minimum epoch duration has passed but currently no orders are locked. The epoch will be closed once orders are locked and can be executed."
                  underline
                >
                  <h5>No orders locked</h5>
                </Tooltip>
              )}
              {solutionState === 'no-executions' && (
                <Tooltip
                  title="The minimum epoch duration has passed but the locked orders cannot be executed. This may be because the pool is oversubscribed or no liquidity is available for redemptions. The epoch will be closed and orders executed as soon as the pool state changes or liquidity is provided."
                  underline
                >
                  <h5>Locked orders cannot be executed</h5>
                </Tooltip>
              )}
              {solutionState === 'partial-executions' && (
                <Tooltip
                  title="The minimum epoch duration has passed but only a fraction of the locked orders could be executed. The epoch is not automatically closed to avoid unsustainable gas fees for small transaction amounts."
                  underline
                >
                  <h5>Locked orders can only be partially executed</h5>
                </Tooltip>
              )}
            </>
          )}
          {epochData?.state === 'in-submission-period' && (
            <Tooltip
              title="The epoch has been closed and orders are currently being computed. After the computing period has ended the orders will be executed."
              underline
            >
              <h5>Minimum {secondsToHms(epochData?.challengeTime || 0)} remaining</h5>
            </Tooltip>
          )}
          {epochData?.state === 'in-challenge-period' && (
            <Tooltip
              title="The epoch has been closed and orders are currently being computed. After the computing period has ended the orders will be executed."
              underline
            >
              <h5>
                {secondsToHms((epochData?.minChallengePeriodEnd || 0) + 60 - new Date().getTime() / 1000)} remaining...
              </h5>
            </Tooltip>
          )}
          {epochData?.state === 'challenge-period-ended' && (
            <Tooltip
              title="The epoch has been closed and orders have been computed. The orders will be executed shortly."
              underline
            >
              <h5>To be closed</h5>
            </Tooltip>
          )}
        </LoadingValue>
      </EpochState>
      <Caret style={{ marginLeft: 'auto', position: 'relative', top: '0' }}>
        <FormDown style={{ transform: props.isOpen ? 'rotate(-180deg)' : '' }} />
      </Caret>
    </Wrap>
  )
}

const EpochState = styled(Wrap)`
  h4,
  h5 {
    line-height: 24px;
    font-size: 14px;
    margin: 0;
    color: #777777;
  }
`

const EpochIcon = styled.img`
  width: 24px;
  height: 24px;
`

export default connect((state) => state, { createTransaction })(EpochOverview)
