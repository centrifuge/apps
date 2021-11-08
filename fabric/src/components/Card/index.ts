import css from '@styled-system/css'
import styled from 'styled-components'
import { Box, BoxProps } from '../Box'

type Props = {
  variant?: 'default' | 'interactive' | 'overlay'
}

export type CardProps = Props &
  Omit<BoxProps, 'border' | 'borderColor' | 'borderWidth' | 'borderStyle' | 'bg' | 'backgroundColor'>

export const Card = styled(Box)<Props>(({ variant = 'default' }) =>
  css({
    bg: 'backgroundPrimary',
    borderRadius: 'card',
    borderWidth: variant === 'default' ? 1 : 0,
    borderStyle: 'solid',
    borderColor: 'borderSecondary',
    boxShadow: variant === 'interactive' ? 'cardInteractive' : variant === 'overlay' ? 'cardOverlay' : undefined,

    'a:focus-visible &, button:focus-visible &, &:focus-visible': {
      boxShadow: 'buttonFocused',
    },
  })
)
