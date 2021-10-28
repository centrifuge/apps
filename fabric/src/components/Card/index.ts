import css from '@styled-system/css'
import styled from 'styled-components'
import { Box, BoxProps } from '../Box'

type Props = {
  interactive?: boolean
}

export type CardProps = Props &
  Omit<BoxProps, 'border' | 'borderColor' | 'borderWidth' | 'borderStyle' | 'bg' | 'backgroundColor'>

export const Card = styled(Box)<Props>((props) =>
  css({
    bg: 'backgroundPrimary',
    borderRadius: 'card',
    borderWidth: props.interactive ? 0 : 1,
    borderStyle: 'solid',
    borderColor: 'borderSecondary',
    boxShadow: props.interactive ? 'cardInteractive' : undefined,

    'a:focus-visible &, button:focus-visible &': {
      boxShadow: props.interactive ? 'buttonFocused' : 'none',
    },
  })
)
