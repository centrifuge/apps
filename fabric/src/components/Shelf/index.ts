import css from '@styled-system/css'
import * as CSS from 'csstype'
import styled from 'styled-components'
import { ResponsiveValue, TLengthStyledSystem } from 'styled-system'
import { Flex, FlexProps } from '../Flex'

type StyledShelfProps = {
  gap?: ResponsiveValue<CSS.Property.ColumnGap<TLengthStyledSystem>>
  rowGap?: ResponsiveValue<CSS.Property.RowGap<TLengthStyledSystem>>
}

export const Shelf = styled(Flex)<StyledShelfProps>((props) =>
  css({
    columnGap: props.gap,
    rowGap: props.rowGap != null ? props.rowGap : props.gap,
  })
)

Shelf.defaultProps = {
  alignItems: 'center',
}

export type ShelfProps = FlexProps & StyledShelfProps
