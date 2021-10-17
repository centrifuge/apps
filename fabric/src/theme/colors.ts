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

const foregroundColors = {
  textPrimary: 'black',
  textSecondary: grayScale.gray600,
  textDisabled: grayScale.gray500,
}

const backgroundColors = {
  backgroundLight: 'white',
  backgroundPrimary: grayScale.gray50,
  backgroundDark: grayScale.gray100,

  borderLight: grayScale.gray200,
  borderDark: grayScale.gray300,
}

const statusColors = {
  defaultLight: grayScale.gray100,
  defaultPrimary: grayScale.gray500,
  defaultDark: grayScale.gray700,

  pendingLight: '#CDE5FF',
  pendingPrimary: '#1486FF',
  pendingDark: '#005ACB',

  okLight: '#ECFFD6',
  okPrimary: '#7ED321',
  okDark: '#598232',

  warningLight: '#FFF0D6',
  warningPrimary: '#FFAA16',
  warningDark: '#9B6F2B',

  criticalLight: '#FFE8ED',
  criticalPrimary: '#F44E72',
  criticalDark: '#CA4A63',
}

export default {
  ...foregroundColors,
  ...backgroundColors,
  ...statusColors,

  black: 'black',
  white: 'white',

  altairYellow: '#FAB961',
  centrifugeBlue: '#2762FF',
  centrifugeOrange: '#FCBA59',
  statusCritical: '#F44E72',
  statusOk: '#7ED321',
  statusUnknown: '#D8D8D8',
  statusWarning: '#FCBA59',
}
