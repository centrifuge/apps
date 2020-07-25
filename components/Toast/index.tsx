import * as React from 'react'
import { useTheme } from 'styled-components'
import { StatusInfo as StatusInfoIcon } from 'grommet-icons'

import { Container, ToastCard, Icon, Content, Action, Title, Description } from './styles'

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
      <Icon>
        <StatusInfoIcon color={'status-warning'} />
      </Icon>
      <Content>
        <Title color={getColor()}>{props.title}</Title>
        <Description>{props.description}</Description>
      </Content>
      {props.externalLink && <Action>&nbsp;</Action>}
    </ToastCard>
  )
}

interface ContainerProps {}

export const ToastContainer: React.FC<ContainerProps> = () => {
  return (
    <Container>
      <Toast status="warning" title="Waiting for confirmation" description="Approve DROP" />
      <Toast status="pending" title="Transaction pending" description="Supply 5,000.00 DAI" />
      <Toast status="ok" title="Transaction confirmed" description="Borrow 1,000.00 DAI" />
      <Toast status="error" title="Transaction failed" description="Borrow 1,000.00 DAI" />
    </Container>
  )
}
