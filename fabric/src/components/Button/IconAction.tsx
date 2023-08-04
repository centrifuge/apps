import styled, { css } from 'styled-components'

export const iconActionStyles = css`
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
    color: ${({ theme }) => theme.colors.accentPrimary};
  }
`
export const IconAnchor = styled.a`
  ${iconActionStyles}
`

export const IconButton = styled.button`
  ${iconActionStyles}
`
