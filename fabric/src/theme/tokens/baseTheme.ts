import { FabricTheme } from '../types'
import { breakpoints } from './breakpoints'
import { space } from './space'
import { typography } from './typography'

export const baseTheme: Omit<FabricTheme, 'colors' | 'scheme'> = {
  breakpoints,
  typography,
  space,
  sizes: {
    container: 1152,
    iconSmall: 16,
    iconMedium: 24,
  },
  radii: {
    card: 8,
    input: 10,
  },
  fonts: {
    standard: 'Inter, sans-serif',
  },
  shadows: {
    cardInteractive: '0 1px 5px rgba(0, 0, 0, 0.2)',
    cardOverlay: '4px 8px 24px rgba(0, 0, 0, 0.2)',
    buttonFocused: `4px 4px 1px var(--fabric-color-focus)`,
  },
}
