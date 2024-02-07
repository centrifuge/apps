import css from '@styled-system/css'
import styled from 'styled-components'
import { Box, BoxProps } from '../Box'

type Props = {
  variant?: 'default' | 'interactive' | 'overlay'
  backgroundColor?: string
}

export type CardProps = Props &
  Omit<BoxProps, 'border' | 'borderColor' | 'borderWidth' | 'borderStyle' | 'bg' | 'backgroundColor'>

export const Card = styled(Box)<Props>(({ variant = 'default', backgroundColor }) =>
  css({
    bg: backgroundColor ?? 'backgroundPage',
    borderRadius: 'card',
    borderWidth: variant === 'default' && !backgroundColor ? 1 : 0,
    borderStyle: 'solid',
    borderColor: 'borderSecondary',
    boxShadow: variant === 'interactive' ? 'cardInteractive' : variant === 'overlay' ? 'cardOverlay' : undefined,
    transition: 'box-shadow 100ms ease',

    'a:hover &, button:hover &, a&:hover, button&:hover': {},
    'a:focus-visible &, button:focus-visible &, &:focus-visible, &:focus-within': {
      boxShadow: variant === 'interactive' ? 'cardActive' : undefined,
    },
  })
)
