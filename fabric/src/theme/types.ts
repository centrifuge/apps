import { ResponsiveValue } from 'styled-system'

type Status = 'Default' | 'Info' | 'Ok' | 'Warning' | 'Critical'

// Colors

type StatusColorName = `status${Status}`

type AccentColorName =
  | `accent${'Primary' | 'Secondary'}`
  | 'primarySelectedBackground'
  | 'secondarySelectedBackground'
  | 'borderFocus'
  | 'borderSelected'
  | 'textSelected'
  | 'textInteractive'
  | 'textInteractiveHover'
type TextColorName = `text${'Primary' | 'Secondary' | 'Disabled'}`
type BorderColorName = `border${'Primary' | 'Secondary'}`
type BackgroundColorName = `background${'Primary' | 'Secondary' | 'Page' | 'Input'}`

type ColorName = StatusColorName | AccentColorName | TextColorName | BorderColorName | BackgroundColorName
type ColorValue = string

type ThemeColors = {
  [k in ColorName]: ColorValue
}

// Lengths

type BreakpointName = 'S' | 'M' | 'L' | 'XL'
type BreakpointValue = string

export type ThemeBreakpoints = BreakpointValue[] & {
  [k in BreakpointName]: BreakpointValue
}

type SizeName = 'dialog' | 'container' | 'iconSmall' | 'iconMedium' | 'iconLarge'
type SizeValue = string | number

type ThemeSizes = {
  [k in SizeName]: SizeValue
}

type RadiusName = 'card' | 'input' | 'tooltip'
type RadiusValue = number

type ThemeRadii = {
  [k in RadiusName]: RadiusValue
}

type SpaceName = 'gutterMobile' | 'gutterTablet' | 'gutterDesktop'
type SpaceValue = number

type ThemeSpace = SpaceValue[] & {
  [k in SpaceName]: SpaceValue
}

// Typography

export type TextVariantName =
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'heading4'
  | 'heading5'
  | 'heading6'
  | 'emphasized'
  | 'interactive1'
  | 'interactive2'
  | 'body1'
  | 'body2'
  | 'body3'
  | 'label1'
  | 'label2'
  | 'label3'

type TypographyValue = Partial<{
  fontSize: ResponsiveValue<number | string>
  lineHeight: ResponsiveValue<number>
  fontWeight: ResponsiveValue<number>
  color: ColorName
}>

export type ThemeTypography = {
  [k in TextVariantName]: TypographyValue
}

type FontName = 'standard'
type FontValue = string

type ThemeFonts = {
  [k in FontName]: FontValue
}

// Shadows

type ShadowName = 'buttonFocused' | 'cardInteractive' | 'cardOverlay'
type ShadowValue = string

type ThemeShadows = {
  [k in ShadowName]: ShadowValue
}

export type FabricTheme = {
  scheme: 'light' | 'dark'
  colors: ThemeColors
  breakpoints: ThemeBreakpoints
  sizes: ThemeSizes
  typography: ThemeTypography
  radii: ThemeRadii
  fonts: ThemeFonts
  space: ThemeSpace
  shadows: ThemeShadows
}
