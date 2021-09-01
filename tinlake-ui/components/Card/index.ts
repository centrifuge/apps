import styled from 'styled-components'
import { Box } from '../Layout'

interface Props {
  interactive?: boolean
}

export const Card = styled(Box)<Props>`
  border-radius: 8px;
  box-shadow: ${(props) => (props.interactive ? '0px 1px 5px rgba(0, 0, 0, 0.2)' : '0 0 0 1px #eeeeee')};
  cursor: ${(props) => (props.interactive ? 'pointer' : undefined)};
`

Card.defaultProps = {
  background: 'white',
}
