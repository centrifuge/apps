const grayScale = {
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',
}

const defaultLight = grayScale.gray100
const defaultPrimary = grayScale.gray500
const defaultDark = grayScale.gray700

const infoLight = '#CDE5FF'
const infoPrimary = '#1486FF'
const infoDark = '#005ACB'

const okLight = '#ECFFD6'
const okPrimary = '#7ED321'
const okDark = '#598232'

const warningLight = '#FFF0D6'
const warningPrimary = '#FFAA16'
const warningDark = '#9B6F2B'

const criticalLight = '#FFE8ED'
const criticalPrimary = '#F44E72'
const criticalDark = '#CA4A63'

const darkColors = {
  textPrimary: 'white',
  textSecondary: grayScale.gray500,
  textDisabled: grayScale.gray600,

  backgroundPrimary: grayScale.gray900,
  backgroundSecondary: grayScale.gray800,
  backgroundPage: 'black',

  borderPrimary: grayScale.gray700,
  borderSecondary: grayScale.gray800,

  defaultBackground: defaultDark,
  defaultPrimary,
  defaultForeground: defaultLight,
  infoBackground: infoDark,
  infoPrimary,
  infoForeground: infoLight,
  okBackground: okDark,
  okPrimary,
  okForeground: okLight,
  warningBackground: warningDark,
  warningPrimary,
  warningForeground: warningLight,
  criticalBackground: criticalDark,
  criticalPrimary,
  criticalForeground: criticalLight,
}

export const modeDark = {
  colors: darkColors,
}
