import { Loan } from '@centrifuge/tinlake-js'
import * as React from 'react'
import styled from 'styled-components'
import { daysBetween } from '../../../utils/date'

interface Props {
  loan: Loan
}

const LoanLabel: React.FC<Props> = (props: Props) => {
  const getLabelType = (l: Loan): LabelType => {
    const days = daysBetween(new Date().getTime() / 1000, Number(l.maturityDate))
    if (l.status === 'ongoing' && days <= 0) return 'warning'
    if (l.status === 'closed') return 'success'
    if (l.status === 'NFT locked') return 'plain'
    return 'info'
  }

  const getLabelText = (l: Loan) => {
    const days = daysBetween(new Date().getTime() / 1000, Number(l.maturityDate))
    if (l.status === 'ongoing' && days === 0) return 'due today'
    else if (l.status === 'ongoing' && days === 1) return 'due tomorrow'
    else if (l.status === 'ongoing' && days > 1 && days <= 7)
      return `due in ${daysBetween(new Date().getTime() / 1000, Number(l.maturityDate))} days`
    else if (l.status === 'ongoing' && days < 0)
      return `due ${daysBetween(new Date().getTime() / 1000, Number(l.maturityDate))} days ago`
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
  opacity: 0.8;
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 12px;
  color: ${(props) => (props.type === 'plain' ? '#888' : '#fff')};
  font-weight: bold;
  width: 120px;
  text-align: center;
`
