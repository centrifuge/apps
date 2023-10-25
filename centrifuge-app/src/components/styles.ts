import { css } from 'styled-components'

export const buttonActionStyles = css`
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
