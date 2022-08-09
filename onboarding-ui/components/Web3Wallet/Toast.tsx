import Image from 'next/image'
import * as React from 'react'
import { WalletTransaction } from '../../ducks/transactions'
import { Spinner } from './Spinner'
import { Action, Content, Description, FailedReason, Icon, MainToastCard, Title, ToastCard } from './styles'

const statusConfig = {
  succeeded: {
    title: 'Transaction successful',
    color: '#7ED321',
    background: '#fff',
    icon: '/static/wallet/check-circle.svg',
  },
  failed: {
    title: 'Transaction failed',
    color: '#F44E72',
    background: '#fff',
    icon: '/static/wallet/failed-circle.svg',
  },
  unconfirmed: {
    title: 'Waiting for confirmation',
    color: '#FCBA59',
    background: '#FFF5DA',
    icon: '/static/wallet/alert-circle.svg',
  },
  pending: { title: 'Transaction pending', color: '#999', background: '#fff', icon: 'spinner' },
}

interface Props extends WalletTransaction {}

export const ToastWrapper: React.FC<Props> = (props: Props) => {
  const config = statusConfig[props.status]

  return (
    <ToastCard backgroundColor={config.background}>
      <MainToastCard>
        <Icon color={config.color}>
          {config.icon === 'spinner' && <Spinner color={config.color} />}
          {config.icon !== 'spinner' && <Image src={config.icon} alt={config.title} width={24} height={24} />}
        </Icon>
        <Content>
          <Title color={config.color}>{config.title}</Title>
          <Description>{props.description}</Description>
        </Content>
        {props.externalLink && (
          <Action>
            <a href={props.externalLink} target="_blank" rel="noreferrer">
              <Image src="/static/wallet/external-link.svg" alt="Open link" width={24} height={24} />
            </a>
          </Action>
        )}
      </MainToastCard>

      {props.failedReason && <FailedReason color={config.color}>{props.failedReason}</FailedReason>}
    </ToastCard>
  )
}
