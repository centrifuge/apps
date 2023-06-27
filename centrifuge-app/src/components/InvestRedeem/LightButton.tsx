import css from '@styled-system/css'
import styled from 'styled-components'

export const LightButton = styled.button<{ $left?: boolean; $right?: boolean }>(
  {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: 0,
    appearance: 'none',
    height: 36,
    cursor: 'pointer',
  },
  (props) =>
    css({
      color: 'textPrimary',
      borderBottomLeftRadius: props.$left ? 'card' : undefined,
      borderBottomRightRadius: props.$right ? 'card' : undefined,
      backgroundColor: 'secondarySelectedBackground',
      '&:hover, &:focus-visible': {
        color: 'textSelected',
      },
      '&:disabled': {
        cursor: 'not-allowed',
      },
    })
)
