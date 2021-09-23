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

// Epoch icon

const ICON_PATH = {
  clock: '/static/clock.svg',
  help: '/static/help-circle.svg',
  checked: '/static/circle-checked.svg',
}

const getEpochIconPath = (epochState?: string, solutionState?: string): string => {
  switch (epochState || '') {
    case 'open':
    case 'in-submission-period':
    case 'in-challenge-period':
      return ICON_PATH.clock
    case 'challenge-period-ended':
      return ICON_PATH.checked
    case 'can-be-closed':
      switch (solutionState || '') {
        case 'to-be-closed':
          return ICON_PATH.checked
        default:
          return ICON_PATH.help
      }
    default:
      return ''
  }
}

const EpochIcon = (props: { epochState?: string; solutionState?: string }) => {
  const imgSrc = getEpochIconPath(props.epochState, props.solutionState)
  return imgSrc ? <EpochImg src={imgSrc} /> : null
}

// Epoch state label

const getEpochStateLabel = (epochState?: string): string => {
  switch (epochState || '') {
    case 'open':
      return 'Ongoing'
    case 'can-be-closed':
      return 'Minimum duration ended'
    case 'in-submission-period':
    case 'in-challenge-period':
      return 'Computing orders'
    case 'challenge-period-ended':
      return 'Orders computed'
    default:
      return ''
  }
}

// Epoch state description

const getTooltipText = (epochState?: string, solutionState?: string): string => {
  switch (epochState || '') {
    case 'open':
      return 'Tinlake epochs have a minimum duration of 24 hours. Once the minimum duration has passed, the epoch will be closed and, if possible, the orders will be executed.'
    case 'in-submission-period':
    case 'in-challenge-period':
      return 'The epoch has been closed and orders are currently being computed. After the computing period has ended the orders will be executed.'
    case 'challenge-period-ended':
      return 'The epoch has been closed and orders have been computed. The orders will be executed shortly.'
    case 'can-be-closed':
      switch (solutionState || '') {
        case 'to-be-closed':
          return 'The minimum epoch duration has passed and will soon be closed automatically. All locked orders will be executed.'
        case 'no-orders-locked':
          return 'The minimum epoch duration has passed but currently no orders are locked. The epoch will be closed once orders are locked and can be executed.'
        case 'no-executions':
          return 'The minimum epoch duration has passed but the locked orders cannot be executed. This may be because the pool is oversubscribed or no liquidity is available for redemptions. The epoch will be closed and orders executed as soon as the pool state changes or liquidity is provided.'
        case 'partial-executions':
          return 'The minimum epoch duration has passed but only a fraction of the locked orders could be executed. The epoch is not automatically closed to avoid unsustainable gas fees for small transaction amounts.'
        default:
          return ''
      }
    default:
      return ''
  }
}

const getDescriptionText = (epochData?: EpochData, solutionState?: string): string => {
  switch (epochData?.state || '') {
    case 'open':
      return `${secondsToHms(epochData?.minimumEpochTimeLeft || 0)} until end of minimum duration`
    case 'in-submission-period':
      return `Minimum ${secondsToHms(epochData?.challengeTime || 0)} remaining`
    case 'in-challenge-period':
      return `${secondsToHms((epochData?.minChallengePeriodEnd || 0) + 60 - new Date().getTime() / 1000)} remaining...`
    case 'challenge-period-ended':
      return 'To be closed'
    case 'can-be-closed':
      switch (solutionState || '') {
        case 'to-be-closed':
          return 'To be closed'
        case 'no-orders-locked':
          return 'No orders locked'
        case 'no-executions':
          return 'Locked orders cannot be executed'
        case 'partial-executions':
          return 'Locked orders can only be partially executed'
        default:
          return ''
      }
    default:
      return ''
  }
}

const EpochDescription = (props: { epochData?: EpochData; solutionState?: string }) => {
  const tooltipText = getTooltipText(props.epochData?.state, props.solutionState)
  const descriptionText = getDescriptionText(props.epochData, props.solutionState)
  return tooltipText && descriptionText ? (
    <Tooltip title={tooltipText} underline>
      <EpochStatusDescrText>{descriptionText}</EpochStatusDescrText>
    </Tooltip>
  ) : null
}

const EpochOverview: React.FC<Props> = (props: Props) => {
  const { epochData, solutionState } = props

  const epochStateLabel = React.useMemo(() => getEpochStateLabel(epochData?.state), [epochData?.state])

  return (
    <Wrap p={24} gap="small" style={{ cursor: 'pointer' }} onClick={(ev) => props.onClick!(ev)}>
      <EpochIcon epochState={epochData?.state} solutionState={solutionState} />

      <SectionHeading>
        Epoch {epochData?.id} — {epochStateLabel}
      </SectionHeading>
      <Wrap
        gap="small"
        rowGap={0}
        alignItems="baseline"
        flexDirection={['column', 'row']}
        order={[3, 'initial']}
        flexBasis={['100%', 'auto']}
      >
        <LoadingValue done={!!(epochData?.state && solutionState)} alignRight={false} maxWidth={120}>
          <EpochDescription epochData={epochData} solutionState={solutionState} />
        </LoadingValue>
      </Wrap>
      <Caret style={{ marginLeft: 'auto', position: 'relative', top: '0' }}>
        <FormDown style={{ transform: props.isOpen ? 'rotate(-180deg)' : '' }} />
      </Caret>
    </Wrap>
  )
}

const EpochStatusDescrText = styled.h5`
  line-height: 24px;
  font-size: 14px;
  margin: 0;
  padding-top: 4px;
  color: #555;
`

const EpochImg = styled.img`
  width: 24px;
  height: 24px;
`

export default connect((state) => state, { createTransaction })(EpochOverview)
