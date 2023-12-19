import { FabricTheme } from '../types'
import { breakpoints } from './breakpoints'
import { space } from './space'
import { typography } from './typography'

export const baseTheme: Omit<FabricTheme, 'colors' | 'scheme'> = {
  breakpoints,
  typography,
  space,
  sizes: {
    dialog: 564,
    drawer: 461,
    container: 1152,
    iconSmall: 16,
    iconMedium: 24,
    iconRegular: 32,
    iconLarge: 40,
    input: 40,
  },
  radii: {
    tooltip: 4,
    card: 8,
    input: 2,
    button: 4,
    chip: 4,
  },
  fonts: {
    standard: 'Inter, sans-serif',
  },
  shadows: {
    cardInteractive: '1px 3px 6px rgba(0, 0, 0, 0.15)',
    cardActive: ' 0 0 0 1px var(--fabric-focus), 0 1px 5px rgba(0, 0, 0, 0.2)',
    cardOverlay: '4px 8px 24px rgba(0, 0, 0, 0.2)',
    buttonPrimary: `1px 2px 7px var(--fabric-shadowButtonPrimary)`,
    buttonSecondary: `1px 2px 1px var(--fabric-shadowButtonSecondary)`,
  },
  zIndices: {
    sticky: 10,
    header: 30,
    overlay: 50,
    onTopOfTheWorld: 1000, // use sparingly, only for edge cases
  },
}
