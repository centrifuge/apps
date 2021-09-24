import { axisThemeConfig } from '@centrifuge/axis-theme'

const breakpoints = ['600px', '900px', '1200px', '1500px'] as string[] & { [key: string]: string }
breakpoints.small = breakpoints[0]
breakpoints.medium = breakpoints[1]
breakpoints.large = breakpoints[2]
breakpoints.xlarge = breakpoints[3]

const baseTheme = {
  breakpoints,
  space: {
    xsmall: 8,
    small: 16,
    medium: 24,
    large: 32,
    xlarge: 40,
    xxlarge: 48,
    xxxlarge: 64,
  },
  sizes: {
    page: 1152,
    funnel: 760,
  },
}

export const theme = {
  ...axisThemeConfig,
  ...baseTheme,
}

export type Theme = typeof baseTheme
