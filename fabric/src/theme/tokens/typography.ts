import { ResponsiveValue } from 'styled-system'
import { BaseColors } from './baseColors'
import { BrandColors } from './brandColors'
import { ModeTheme } from './modes'

type Variants =
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

type Values = Partial<{
  fontSize: ResponsiveValue<number | string>
  lineHeight: ResponsiveValue<number>
  fontWeight: ResponsiveValue<number>
  color: keyof BaseColors | keyof BrandColors | keyof ModeTheme['colors']
}>

type Typography = {
  [key in Variants]: Values
}

const typography: Typography = {
  heading1: {
    fontSize: [20, 24],
    lineHeight: 1.25,
    fontWeight: [500, 600],
    color: 'textPrimary',
  },
  heading2: {
    fontSize: 20,
    lineHeight: 1.25,
    fontWeight: 600,
    color: 'textPrimary',
  },
  heading3: {
    fontSize: 16,
    lineHeight: 1.375,
    fontWeight: 600,
    color: 'textPrimary',
  },
  heading4: {
    fontSize: 14,
    lineHeight: 1.375,
    fontWeight: 500,
    color: 'textPrimary',
  },
  heading5: {
    fontSize: 14,
    lineHeight: 1.375,
    fontWeight: 500,
    color: 'textSecondary',
  },
  heading6: {
    fontSize: 14,
    lineHeight: 1.375,
    fontWeight: 600,
    color: 'textSecondary',
  },
  emphasized: {
    fontWeight: 600,
  },
  interactive: {
    fontSize: 14,
    lineHeight: 1.375,
    fontWeight: 500,
    color: 'textPrimary',
  },
  interactive2: {
    fontSize: 14,
    lineHeight: 1.375,
    fontWeight: 500,
    color: 'textSecondary',
  },
  body1: {
    fontSize: 16,
    lineHeight: 1.25,
    fontWeight: 400,
    color: 'textPrimary',
  },
  body2: {
    fontSize: 14,
    lineHeight: 1.25,
    fontWeight: 400,
    color: 'textPrimary',
  },
  label1: {
    fontSize: 12,
    lineHeight: 1.375,
    fontWeight: 500,
    color: 'textSecondary',
  },
  label2: {
    fontSize: 10,
    lineHeight: 1.25,
    fontWeight: 500,
    color: 'textSecondary',
  },
}

export { typography }
