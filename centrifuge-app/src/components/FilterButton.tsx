import { Text } from '@centrifuge/fabric'
import styled from 'styled-components'
import { buttonActionStyles } from './styles'

export const FilterButton = styled(Text)`
  display: flex;
  align-items: center;
  gap: 0.3em;

  ${buttonActionStyles}
`
