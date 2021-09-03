import styled from 'styled-components'
import { Box } from '../Layout'

const Hr = Box.withComponent('hr')

export const Divider = styled(Hr)`
  border: none;
  border-top-width: 1px;
  border-top-style: solid;
  border-top-color: #eeeeee;
`
