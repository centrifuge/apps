import * as React from 'react'
import { useTheme } from 'styled-components'
import { StatusInfo, Checkmark, Close } from 'grommet-icons'

import { Container, ToastCard, Icon, Content, Action, Title, Description } from './styles'
import { Spinner } from './Spinner'

export type ToastStatus = 'ok' | 'error' | 'warning' | 'pending'

interface Props {
  title: string
  description: string
  status: ToastStatus
  externalLink?: string
}

export const Toast: React.FC<Props> = (props: Props) => {
  const themeColors = (useTheme() as any).global.colors

  const getColor = () => {
    if (props.status === 'ok') return themeColors['status-ok']
    if (props.status === 'error') return themeColors['status-error']
    if (props.status === 'warning') return themeColors['status-warning']
    if (props.status === 'pending') return themeColors['status-unknown']
  }

  return (
    <ToastCard>
      <Icon color={getColor()}>
        {props.status === 'ok' && <Checkmark />}
        {props.status === 'error' && <Close />}
        {props.status === 'warning' && <StatusInfo />}
        {props.status === 'pending' && <Spinner color={getColor()} />}
      </Icon>
      <Content>
        <Title color={getColor()}>{props.title}</Title>
        <Description>{props.description}</Description>
      </Content>
      {props.externalLink && (
        <Action>
          <a href={props.externalLink} target="_blank">
            <img src="../../static/external-link.svg" alt="Open link" />
          </a>
        </Action>
      )}
    </ToastCard>
  )
}

interface ContainerProps {}

export const ToastContainer: React.FC<ContainerProps> = () => {
  return (
    <Container>
      <Toast status="warning" title="Waiting for confirmation" description="Approve DROP" />
      <Toast
        status="pending"
        title="Transaction pending"
        description="Supply 5,000.00 DAI"
        externalLink="https://centrifuge.io/"
      />
      <Toast
        status="ok"
        title="Transaction confirmed"
        description="Borrow 1,000.00 DAI"
        externalLink="https://centrifuge.io/"
      />
      <Toast
        status="error"
        title="Transaction failed"
        description="Borrow 1,000.00 DAI"
        externalLink="https://centrifuge.io/"
      />
    </Container>
  )
}
