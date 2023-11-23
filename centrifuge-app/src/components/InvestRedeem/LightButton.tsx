import css from '@styled-system/css'
import styled from 'styled-components'

export const LightButton = styled.button(
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
      backgroundColor: 'secondarySelectedBackground',
      '&:hover, &:focus-visible': {
        color: 'textSelected',
      },
      '&:disabled': {
        cursor: 'not-allowed',
      },
      '&:first-child': {
        borderBottomLeftRadius: 'card',
      },
      '&:last-child': {
        borderBottomRightRadius: 'card',
      },
    })
)
