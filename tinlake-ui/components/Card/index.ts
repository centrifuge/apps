import styled from 'styled-components'
import { Box } from '../Layout'

interface Props {
  interactive?: boolean
}

export const Card = styled(Box)<Props>`
  box-shadow: ${(props) => (props.interactive ? '0px 1px 5px rgba(0, 0, 0, 0.2)' : '0 0 0 1px #eeeeee')};
`

Card.defaultProps = {
  background: 'white',
  borderRadius: '8px',
}
