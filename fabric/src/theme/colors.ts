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

const lightMode = {
  textPrimary: 'black',
  textSecondary: grayScale.gray600,
  textDisabled: grayScale.gray500,

  backgroundPrimary: 'white',
  backgroundSecondary: grayScale.gray100,
  backgroundPage: grayScale.gray50,

  borderPrimary: grayScale.gray300,
  borderSecondary: grayScale.gray200,

  defaultLight,
  defaultPrimary,
  defaultDark,
  infoLight,
  infoPrimary,
  infoDark,
  okLight,
  okPrimary,
  okDark,
  warningLight,
  warningPrimary,
  warningDark,
  criticalLight,
  criticalPrimary,
  criticalDark,
}

const darkMode = {
  textPrimary: 'white',
  textSecondary: grayScale.gray500,
  textDisabled: grayScale.gray600,

  backgroundPrimary: grayScale.gray900,
  backgroundSecondary: grayScale.gray800,
  backgroundPage: 'black',

  borderPrimary: grayScale.gray700,
  borderSecondary: grayScale.gray800,

  defaultLight: defaultDark,
  defaultPrimary,
  defaultDark: defaultLight,
  infoLight: infoDark,
  infoPrimary,
  infoDark: infoLight,
  okLight: okDark,
  okPrimary,
  okDark: okLight,
  warningLight: warningDark,
  warningPrimary,
  warningDark: warningLight,
  criticalLight: criticalDark,
  criticalPrimary,
  criticalDark: criticalLight,
}

export default {
  ...lightMode,
  modes: {
    light: lightMode,
    dark: darkMode,
  },
  brand: '#2762FF',
  centrifugeBlue: '#2762FF',
  centrifugeOrange: '#FCBA59',
  altairYellow: '#FAB961',
  statusCritical: '#F44E72',
  statusOk: '#7ED321',
  statusUnknown: '#D8D8D8',
  statusWarning: '#FCBA59',
}
