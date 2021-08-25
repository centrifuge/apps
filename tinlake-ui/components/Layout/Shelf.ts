import css from '@styled-system/css'
import * as CSS from 'csstype'
import styled from 'styled-components'
import { ResponsiveValue, TLengthStyledSystem } from 'styled-system'
import { Box } from './Box'

type StyledShelfProps = {
  gap?: ResponsiveValue<CSS.Property.ColumnGap<TLengthStyledSystem>>
  rowGap?: ResponsiveValue<CSS.Property.RowGap<TLengthStyledSystem>>
}

export const Shelf = styled(Box)<StyledShelfProps>(
  {
    display: 'flex',
    alignItems: 'center',
  },
  (props) =>
    css({
      columnGap: props.gap,
      rowGap: props.rowGap || props.gap,
    })
)

export const Wrap = styled(Shelf)({
  flexWrap: 'wrap',
})
