import styled, { css } from 'styled-components'
interface IconActionProps {
  size?: string
}

export const iconActionStyles = css<IconActionProps>`
  --size: ${({ size }) => size || '22px'};
  --icon-size: calc(var(--size) - 4px);

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
    width: var(--icon-size);
    height: var(--icon-size);
    stroke: currentColor;
  }

  &:focus-visible,
  &:hover {
    background-color: ${({ theme }) => theme.colors.yellowScale[50]};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

export const IconAnchor = styled.a`
  ${iconActionStyles}
`

export const IconButton = styled.button`
  ${iconActionStyles}
`
IconButton.defaultProps = {
  type: 'button',
  size: '22px',
}
