import { css } from 'styled-components'

export const buttonActionStyles = css`
  appearance: none;
  border: none;
  cursor: pointer;
  background-color: transparent;
  border-radius: ${({ theme }) => theme.radii.tooltip}px;

  &:hover,
  &:focus-visible {
    color: ${({ theme }) => theme.colors.textInteractiveHover};
  }
`
