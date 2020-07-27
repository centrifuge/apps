import * as React from 'react'
import { useTheme } from 'styled-components'
import { StatusInfo, Checkmark, Close } from 'grommet-icons'

import { Container, ToastCard, Icon, Content, Action, Title, Description } from './styles'
import { Spinner } from './Spinner'
import { Toast } from '../../ducks/toasts'

export const ToastWrapper: React.FC<Toast> = (props: Toast) => {
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

interface ContainerProps {
  toasts?: Toast[]
}

export const ToastContainer: React.FC<ContainerProps> = (props: ContainerProps) => {
  return (
    <Container>
      {props.toasts?.toasts?.map((toast: Toast) => (
        <ToastWrapper {...toast} />
      ))}
    </Container>
  )
}
