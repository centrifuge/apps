import { Shelf } from '@centrifuge/fabric'
import styled from 'styled-components'

export const ButtonGroup = styled(Shelf)``

ButtonGroup.defaultProps = {
  justifyContent: ['center', 'flex-end'],
  gap: 2,
  rowGap: 1,
  flexWrap: 'wrap',
}
