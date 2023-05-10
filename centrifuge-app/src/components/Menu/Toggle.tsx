import { Text } from '@centrifuge/fabric'
import styled from 'styled-components'
import { baseButton, primaryButton } from './styles'

export const Toggle = styled(Text)<{ isActive?: boolean; stacked?: boolean }>`
  ${baseButton}
  ${primaryButton}
  width: 100%;
  grid-template-columns: ${({ stacked, theme }) =>
    stacked ? '1fr' : `${theme.sizes.iconSmall}px 1fr ${theme.sizes.iconSmall}px`};
`
