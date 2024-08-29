import styled from 'styled-components'
import { Box, BoxProps } from '../Box'

const Hr = styled(Box).attrs<BoxProps>({ as: 'hr' })``

export const Divider = styled(Hr)`
  margin: 0;
  border-top-width: 1px;
  border-right-width: 0;
  border-bottom-width: 0;
  border-left-width: 0;
  border-top-style: solid;
`

Divider.defaultProps = {
  width: '100%',
  borderColor: 'borderPrimary',
}
