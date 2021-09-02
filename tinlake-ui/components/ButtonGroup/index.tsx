import styled from 'styled-components'
import { Wrap } from '../Layout'

export const ButtonGroup = styled(Wrap)``

ButtonGroup.defaultProps = {
  justifyContent: ['center', 'flex-end'],
  gap: 'small',
  rowGap: 'xsmall',
}
