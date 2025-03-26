import { Text } from '@centrifuge/fabric'
import styled from 'styled-components'
import { baseButton, primaryButton } from './styles'

export const LIGHT_BACKGROUND = 'rgba(145, 150, 155, 0.13)'

export const Toggle = styled(Text)<{ isActive?: boolean; stacked?: boolean }>`
  ${baseButton}
  ${primaryButton}
  width: 100%;
  grid-template-columns: ${({ stacked, theme }) =>
    stacked ? '1fr' : `${theme.sizes.iconSmall}px 1fr ${theme.sizes.iconSmall}px`};
  color: ${({ theme }) => theme.colors.textInverted};
  border-radius: 4px;
  background-color: ${({ isActive }) => (isActive ? LIGHT_BACKGROUND : 'transparent')};
  font-weight: 400;

  &:hover {
    background-color: rgba(145, 150, 155, 0.13);

    & span {
      color: ${({ theme }) => theme.colors.textGold};
    }

    & svg {
      color: ${({ theme }) => theme.colors.textGold};
    }
  }
`
