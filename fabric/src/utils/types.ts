import * as CSS from 'csstype'
import { DefaultTheme } from 'styled-components'
import { TLengthStyledSystem } from 'styled-system'

export type PropsOf<C extends keyof JSX.IntrinsicElements | React.JSXElementConstructor<unknown>> =
  JSX.LibraryManagedAttributes<C, React.ComponentPropsWithRef<C>>

export type ThemeColor = keyof DefaultTheme['colors']
export type Color = ThemeColor | CSS.Property.Color

export type ThemeSize = keyof DefaultTheme['sizes']
export type Size = ThemeSize | CSS.Property.Width<TLengthStyledSystem>
