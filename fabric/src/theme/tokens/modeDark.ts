const grayScale = {
  gray50: '#FAFAFA',
  gray80: '#F8F8F8',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',
  gray950: '#171717',
}

const statusDefault = grayScale.gray600
const statusInfo = '#006EF5'
const statusOk = '#598232'
const statusWarning = '#A86500'
const statusCritical = '#D43F2B'

const darkColors = {
  textPrimary: 'white',
  textSecondary: grayScale.gray500,
  textDisabled: grayScale.gray600,

  backgroundPrimary: grayScale.gray900,
  backgroundSecondary: grayScale.gray800,
  backgroundPage: 'black',
  backgroundInput: grayScale.gray950,

  borderPrimary: grayScale.gray700,
  borderSecondary: grayScale.gray800,

  statusDefault,
  statusInfo,
  statusOk,
  statusWarning,
  statusCritical,
}

export const modeDark = {
  colors: darkColors,
}
