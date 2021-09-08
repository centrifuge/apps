import { Loan } from '@centrifuge/tinlake-js'
import * as React from 'react'
import styled from 'styled-components'
import { daysBetween } from '../../../utils/date'

interface Props {
  loan: Loan
  dot?: boolean
}

const LoanLabel: React.FC<Props> = ({ loan, dot }) => {
  const getLabelType = (l: Loan): LabelType => {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const days = daysBetween(today.getTime() / 1000, Number(l.maturityDate))

    if (l.status === 'ongoing' && days >= 0 && days <= 5) return 'warning'
    if (l.status === 'ongoing' && days < 0) return 'error'
    if (l.status === 'closed') return 'info'
    if (l.status === 'NFT locked') return 'plain'
    return 'success'
  }

  const getLabelText = (l: Loan) => {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const days = daysBetween(today.getTime() / 1000, Number(l.maturityDate))

    if (l.status === 'ongoing' && days === 0) return 'due today'
    if (l.status === 'ongoing' && days === 1) return 'due tomorrow'
    if (l.status === 'ongoing' && days > 1 && days <= 5) return `due in ${days} days`
    if (l.status === 'ongoing' && days < 0) return `due ${Math.abs(days)} days ago`
    return l.status
  }

  const type = getLabelType(loan)
  const text = getLabelText(loan)

  return dot ? <StatusDot type={type} aria-label={text} /> : <StatusLabel type={type}>{text}</StatusLabel>
}

export default LoanLabel

type LabelType = 'plain' | 'info' | 'success' | 'warning' | 'error'

const StatusLabel = styled.div<{ type: LabelType }>`
  background: ${(props) =>
    props.type === 'success'
      ? '#7ED321'
      : props.type === 'warning'
      ? '#fcba59'
      : props.type === 'error'
      ? '#F44E72'
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

const StatusDot = styled.div<{ type: LabelType }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(props) =>
    props.type === 'success'
      ? '#7ED321'
      : props.type === 'warning'
      ? '#fcba59'
      : props.type === 'error'
      ? '#F44E72'
      : props.type === 'plain'
      ? '#aaa'
      : '#636363'};
`
