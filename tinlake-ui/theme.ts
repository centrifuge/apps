import { axisThemeConfig } from '@centrifuge/axis-theme'

const space = [0, 8, 16, 24, 32, 40]

const baseTheme = {
  breakpoints: ['600px', '900px', '1200px', '1500px'],
  space: {
    ...space,
    xsmall: space[1],
    small: space[2],
    medium: space[3],
    large: space[4],
    xlarge: space[5],
  },
}

export const theme = {
  ...axisThemeConfig,
  ...baseTheme,
}

export type Theme = typeof baseTheme
