import { Text } from '@centrifuge/fabric'
import styled from 'styled-components'
import { baseButton, primaryButton } from './styles'

export const Toggle = styled(Text)<{ isActive?: boolean; stacked?: boolean }>`
  ${baseButton}
  ${primaryButton}
  width: 100%;
  grid-template-columns: ${({ stacked, theme }) =>
    stacked ? '1fr' : `${theme.sizes.iconSmall}px 1fr ${theme.sizes.iconSmall}px`};
  color: ${({ isActive, theme }) => (isActive ? theme.colors.textGold : theme.colors.textInverted)};
  border-radius: 4px;
  background-color: transparent;

  &:hover {
    color: ${({ theme }) => theme.colors.textGold};
    background-color: rgba(145, 150, 155, 0.13);
  }
`
