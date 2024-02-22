import { ResponsiveValue } from 'styled-system'

type Status = 'Default' | 'Info' | 'Ok' | 'Warning' | 'Critical' | 'Promote'

// Colors

type StatusColorName = `status${Status}` | `status${Status}Bg`

type AccentColorName =
  | `accent${'Primary' | 'Secondary'}`
  | 'primarySelectedBackground'
  | 'secondarySelectedBackground'
  | 'focus'
  | 'borderFocus'
  | 'borderSelected'
  | 'textSelected'
  | 'textInteractive'
  | 'textInteractiveHover'
type TextColorName = `text${'Primary' | 'Secondary' | 'Disabled' | 'Inverted'}`
type BorderColorName = `border${'Primary' | 'Secondary'}`
type BackgroundColorName = `background${
  | 'Primary'
  | 'Secondary'
  | 'Tertiary'
  | 'Page'
  | 'Input'
  | 'Thumbnail'
  | 'AccentPrimary'
  | 'AccentSecondary'}`
type ButtonColorName =
  | `${'background' | 'text' | 'border'}Button${'Primary' | 'Secondary' | 'Tertiary' | 'Inverted'}${
      | ''
      | 'Focus'
      | 'Hover'
      | 'Pressed'
      | 'Disabled'}`
  | 'shadowButtonPrimary'
  | 'shadowButtonSecondary'
  | 'shadowButtonInverted'

type ColorName =
  | StatusColorName
  | AccentColorName
  | TextColorName
  | BorderColorName
  | BackgroundColorName
  | ButtonColorName
type ColorValue = string

type ThemeColors = {
  [k in ColorName]: ColorValue
} & {
  accentScale: Record<number, string>
  yellowScale: Record<number, string>
  blueScale: Record<number, string>
  grayScale: Record<number, string>
}

// Lengths

type BreakpointName = 'S' | 'M' | 'L' | 'XL'
type BreakpointValue = string

export type ThemeBreakpoints = BreakpointValue[] & {
  [k in BreakpointName]: BreakpointValue
}

type SizeName = 'dialog' | 'drawer' | 'container' | 'iconSmall' | 'iconMedium' | 'iconRegular' | 'iconLarge' | 'input'
type SizeValue = number

type ThemeSizes = {
  [k in SizeName]: SizeValue
}

type RadiusName = 'card' | 'input' | 'tooltip' | 'button' | 'chip'
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
  | 'body4'
  | 'label1'
  | 'label2'
  | 'label3'

type TypographyValue = Partial<{
  fontSize: ResponsiveValue<number | string>
  lineHeight: ResponsiveValue<number>
  fontWeight: ResponsiveValue<number>
  color: ColorName
  letterSpacing: ResponsiveValue<number | string>
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

type ShadowName =
  | 'buttonPrimary'
  | 'buttonSecondary'
  | 'buttonInverted'
  | 'cardInteractive'
  | 'cardOverlay'
  | 'cardActive'
type ShadowValue = string

type ThemeShadows = {
  [k in ShadowName]: ShadowValue
}

type ZIndexName = 'sticky' | 'header' | 'overlay' | 'onTopOfTheWorld'
type ZIndexValue = number
type ThemeZIndices = {
  [k in ZIndexName]: ZIndexValue
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
  zIndices: ThemeZIndices
}
