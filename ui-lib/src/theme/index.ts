/**
 *
 * !!!!!!!!!!!!!!!!!!!!!!!
 * THIS THEME WAS COPIED FOM TINLAKE-UI, IT NEEDS TO BE REPLACED
 * WITH THE ACTUAL THEME REFLECTING THE BRAND ASSETS FROM DESIGN
 */
const breakpoints = ['600px', '900px', '1200px', '1500px'] as string[] & { [key: string]: string }
breakpoints.small = breakpoints[0]
breakpoints.medium = breakpoints[1]
breakpoints.large = breakpoints[2]
breakpoints.xlarge = breakpoints[3]

export const theme = {
  breakpoints,
  space: {
    xsmall: 8,
    small: 16,
    medium: 24,
    large: 32,
    xlarge: 40,
    xxlarge: 64,
  },
  sizes: {
    container: 1152,
  },
  colors: {
    altairYellow: '#FAB961',
    centrifugeBlue: '#2762FF',
    centrifugeOrange: '#FCBA59',
    statusCritical: '#F44E72',
    statusOk: '#7ED321',
    statusUnknown: '#D8D8D8',
    statusWarning: '#FCBA59',
  },
}

export type Theme = typeof theme
