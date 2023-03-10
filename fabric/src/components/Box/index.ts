import shouldForwardProp from '@styled-system/should-forward-prop'
import * as CSS from 'csstype'
import styled from 'styled-components'
import {
  background,
  BackgroundProps,
  border,
  BorderProps,
  color,
  ColorProps,
  compose,
  flexbox,
  FlexboxProps,
  get,
  grid,
  GridProps,
  layout,
  LayoutProps,
  position,
  PositionProps,
  ResponsiveValue,
  space,
  SpaceProps,
  system,
  textAlign,
  TextAlignProps,
  TLengthStyledSystem,
} from 'styled-system'
import { toPx } from '../../utils/styled'
import { PropsOf } from '../../utils/types'

interface BleedProps {
  bleedX?: ResponsiveValue<CSS.Property.MarginLeft<TLengthStyledSystem>>
  bleedY?: ResponsiveValue<CSS.Property.MarginLeft<TLengthStyledSystem>>
}

const bleed = system({
  bleedX: {
    properties: ['marginLeft', 'marginRight'],
    scale: 'space',
    transform: (n: string | number, scale: unknown) => `-${toPx(get(scale, n, n))}`,
  },
  bleedY: {
    properties: ['marginTop', 'marginBottom'],
    scale: 'space',
    transform: (n: string | number, scale: unknown) => `-${toPx(get(scale, n, n))}`,
  },
})

interface AspectProps {
  aspectRatio?: ResponsiveValue<CSS.Property.AspectRatio>
}

const aspect = system({
  aspectRatio: {
    property: 'aspectRatio',
  },
})

interface SystemProps
  extends SpaceProps,
    LayoutProps,
    BackgroundProps,
    ColorProps,
    FlexboxProps,
    GridProps,
    BorderProps,
    TextAlignProps,
    PositionProps,
    BleedProps,
    AspectProps {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface StyledBoxProps extends SystemProps {}

export const Box = styled('div').withConfig({
  shouldForwardProp: (prop) => shouldForwardProp(prop),
})<StyledBoxProps>(compose(space, layout, background, color, flexbox, grid, border, textAlign, position, bleed, aspect))

export type BoxProps = PropsOf<typeof Box>
