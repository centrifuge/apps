import styled from 'styled-components'
import { Box } from '../Layout'

const Hr = Box.withComponent('hr')

export const Divider = styled(Hr)`
  border-top-width: 1px;
  border-right-width: 0;
  border-bottom-width: 0;
  border-left-width: 0;
  border-top-style: solid;
`

Divider.defaultProps = {
  width: '100%',
  borderColor: '#eeeeee',
}
