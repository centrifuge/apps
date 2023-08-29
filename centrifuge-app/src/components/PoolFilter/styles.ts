import { Text } from '@centrifuge/fabric'
import styled, { css } from 'styled-components'

const sharedStyles = css`
  appearance: none;
  border: none;
  cursor: pointer;
  background-color: transparent;
  border-radius: ${({ theme }) => theme.radii.tooltip}px;

  &:focus-visible {
    outline: ${({ theme }) => `2px solid ${theme.colors.textSelected}`};
    outline-offset: 4px;
  }
`

export const FilterButton = styled(Text)`
  display: flex;
  align-items: center;
  gap: 0.3em;

  ${sharedStyles}
`
export const QuickAction = styled(Text)`
  ${sharedStyles}
`
