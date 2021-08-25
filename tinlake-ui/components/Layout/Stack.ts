import css from '@styled-system/css'
import * as CSS from 'csstype'
import styled from 'styled-components'
import { ResponsiveValue, TLengthStyledSystem } from 'styled-system'
import { Box } from './Box'

type StyledStackProps = {
  gap?: ResponsiveValue<CSS.Property.RowGap<TLengthStyledSystem>>
}

export const Stack = styled(Box)<StyledStackProps>(
  {
    display: 'flex',
    flexDirection: 'column',
  },
  (props) =>
    css({
      rowGap: props.gap,
    })
)
