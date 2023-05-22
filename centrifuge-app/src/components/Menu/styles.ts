import { css } from 'styled-components'

export const baseButton = css<{ isActive?: boolean }>`
  cursor: pointer;
  border: none;
  color: ${({ isActive, theme }) => (isActive ? theme.colors.textSelected : theme.colors.textPrimary)};

  :hover {
    color: ${({ theme }) => theme.colors.textSelected};
  }

  :focus-visible {
    color: ${({ theme }) => theme.colors.textSelected};
    outline: solid ${({ theme }) => theme.colors.textSelected};
    outline-offset: -1px;
  }
`

export const primaryButton = css<{ isActive?: boolean; stacked?: boolean }>`
  display: grid;
  gap: ${({ stacked, theme }) => (stacked ? 0 : `${theme.space[1]}px`)};
  grid-template-rows: ${({ stacked }) => (stacked ? '20px 1fr' : '1fr')};
  grid-auto-flow: ${({ stacked }) => (stacked ? 'column' : 'row')};
  justify-items: ${({ stacked }) => (stacked ? 'center' : 'start')};
  align-items: center;
  padding: ${({ theme }) => theme.space[1]}px;

  background-color: ${({ isActive, theme }) => (isActive ? theme.colors.secondarySelectedBackground : 'transparent')};

  @media (max-width: ${({ theme }) => theme.breakpoints['XL']}) {
    font-size: 10px;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints['XL']}) {
    border-radius: 16px;
  }

  svg {
    display: block;
    width: ${({ theme }) => theme.sizes.iconSmall}px;
    height: ${({ theme }) => theme.sizes.iconSmall}px;
    object-fit: contain;
  }
`
