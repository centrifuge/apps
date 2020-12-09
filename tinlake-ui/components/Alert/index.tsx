import { Box } from 'grommet'
import * as React from 'react'
import styled from 'styled-components'

interface Props {
  type: 'error' | 'info' | 'success'
  children: React.ReactNode
  [key: string]: any
}

function Alert({ type, children, ...rest }: Props) {
  return (
    <AlertContainer type={type} {...rest}>
      {children}
    </AlertContainer>
  )
}

const colors = {
  error: {
    backgroundColor: '#fed7d7',
    color: '#9b2c2c',
  },
  info: {
    backgroundColor: '#f2f2f2',
    color: '#333',
  },
  success: {
    backgroundColor: '#c6f6d5',
    color: '#276749',
  },
}

const AlertContainer = styled(Box)<{ type: 'error' | 'info' | 'success' }>`
  padding: 24px;
  background-color: ${(p) => colors[p.type].backgroundColor};
  color: ${(p) => colors[p.type].color};
  border-radius: 8px;
`

export default Alert
