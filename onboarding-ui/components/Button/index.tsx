import { Button as GrommetButton, ButtonType } from 'grommet'
import * as React from 'react'
import styled from 'styled-components'

interface OwnProps {
  largeOnMobile?: boolean
}

type Props = OwnProps & ButtonType

const StyledButton = styled(GrommetButton)<OwnProps>`
  @media (max-width: 599px) {
    min-width: ${(props) => (props.largeOnMobile ? '220px' : 0)};
  }
`

export const Button: React.FC<Props> = ({ children, ...rest }) => {
  return <StyledButton {...rest}>{children}</StyledButton>
}

Button.defaultProps = {
  largeOnMobile: true,
}
