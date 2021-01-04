import { Loan } from '@centrifuge/tinlake-js'
import * as React from 'react'
import styled from 'styled-components'
import { daysBetween } from '../../../utils/date'

interface Props {
  loan: Loan
}

const LoanLabel: React.FC<Props> = (props: Props) => {
  const getLabelType = (l: Loan): LabelType => {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const days = daysBetween(today.getTime() / 1000, Number(l.maturityDate))

    if (l.status === 'ongoing' && days <= 5) return 'warning'
    if (l.status === 'closed') return 'info'
    if (l.status === 'NFT locked') return 'plain'
    return 'success'
  }

  const getLabelText = (l: Loan) => {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const days = daysBetween(today.getTime() / 1000, Number(l.maturityDate))

    if (l.status === 'ongoing' && days === 0) return 'due today'
    else if (l.status === 'ongoing' && days === 1) return 'due tomorrow'
    else if (l.status === 'ongoing' && days > 1 && days <= 5) return `due in ${days} days`
    else if (l.status === 'ongoing' && days < 0) return `due ${Math.abs(days)} days ago`
    return l.status
  }

  return <StatusLabel type={getLabelType(props.loan)}>{getLabelText(props.loan)}</StatusLabel>
}

export default LoanLabel

type LabelType = 'plain' | 'info' | 'success' | 'warning'
const StatusLabel = styled.div<{ type: LabelType }>`
  background: ${(props) =>
    props.type === 'success'
      ? 'green'
      : props.type === 'warning'
      ? '#fcba59'
      : props.type === 'plain'
      ? 'transparent'
      : '#aaa'};
  border: ${(props) => (props.type === 'plain' ? '1px solid #ccc' : '1px solid transparent')};
  opacity: 1;
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 12px;
  color: ${(props) => (props.type === 'plain' ? '#888' : '#fff')};
  font-weight: bold;
  width: 120px;
  text-align: center;
`
