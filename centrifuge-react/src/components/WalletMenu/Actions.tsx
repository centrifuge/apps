import styled, { css } from 'styled-components'

export const baseStyles = css`
  --size: 22px;

  appearance: none;
  display: block;
  width: var(--size);
  height: var(--size);
  padding: 4px;

  border: 0;
  border-radius: 50%;
  background-color: transparent;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;

  svg {
    display: block;
    width: 100%;
    height: 100%;
    stroke: currentColor;
  }

  &:focus-visible,
  &:hover {
    background-color: ${({ theme }) => theme.colors.blueScale[50]};
  }

  &:focus-visible {
    color: ${({ theme }) => theme.colors.accentPrimary};
  }
`
export const ActionAnchor = styled.a`
  ${baseStyles}
`

export const ActionButton = styled.button`
  ${baseStyles}
`
