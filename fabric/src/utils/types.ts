import * as CSS from 'csstype'
import { DefaultTheme } from 'styled-components'

export type PropsOf<C extends keyof JSX.IntrinsicElements | React.JSXElementConstructor<any>> =
  JSX.LibraryManagedAttributes<C, React.ComponentPropsWithRef<C>>

export type ThemeColor = keyof Omit<DefaultTheme['colors'], 'modes'>
export type Color = ThemeColor | CSS.Property.Color
