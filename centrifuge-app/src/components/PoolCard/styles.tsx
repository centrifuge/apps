import { Box } from '@centrifuge/fabric'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

export const Root = styled(Box)`
  position: relative;
  border-radius: ${({ theme }) => theme.radii.card}px;
  border: ${({ theme }) => `1px solid ${theme.colors.borderSecondary}`};
  box-shadow: ${({ theme }) => `0px 1px 0px ${theme.colors.borderPrimary}`};
  transition: box-shadow 0.15s linear;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.cardInteractive};
  }
`

export const Anchor = styled(Link)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: ${({ theme }) => theme.radii.card}px;
  background-color: transparent;
  outline-offset: -2px;

  &:focus-visible {
    outline: ${({ theme }) => `2px solid ${theme.colors.textInteractive}`};
  }
`

export const Ellipsis = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`
