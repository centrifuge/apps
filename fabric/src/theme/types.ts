import { ResponsiveValue } from 'styled-system'

type Status = 'default' | 'info' | 'ok' | 'warning' | 'critical'

// Colors

type StatusColorVariant = 'Primary' | 'Foreground' | 'Background'
type StatusColorName = `${Status}${StatusColorVariant}`

type BrandColorName = 'brand'
type TextColorName = `text${'Primary' | 'Secondary' | 'Disabled'}`
type BorderColorName = `border${'Primary' | 'Secondary'}`
type BackgroundColorName = `background${'Primary' | 'Secondary' | 'Page'}`

type ColorName = StatusColorName | BrandColorName | TextColorName | BorderColorName | BackgroundColorName
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

type SizeName = 'container' | 'iconSmall' | 'iconMedium'
type SizeValue = string | number

type ThemeSizes = {
  [k in SizeName]: SizeValue
}

type RadiusName = 'card'
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
  | 'interactive'
  | 'interactive2'
  | 'body1'
  | 'body2'
  | 'label1'
  | 'label2'

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
  colors: ThemeColors
  breakpoints: ThemeBreakpoints
  sizes: ThemeSizes
  typography: ThemeTypography
  radii: ThemeRadii
  fonts: ThemeFonts
  space: ThemeSpace
  shadows: ThemeShadows
}
