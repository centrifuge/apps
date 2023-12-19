import { blueScale, centrifugeBlue, grayScale } from './colors'

const statusDefault = grayScale[800]
const statusInfo = '#1253ff'
const statusOk = '#519b10'
const statusWarning = '#ffc012'
const statusCritical = '#d43f2b'
const statusPromote = '#f81071'

const statusDefaultBg = `${grayScale[800]}14`
const statusInfoBg = '#1253ff14'
const statusOkBg = '#519b1014'
const statusWarningBg = '#ffc01214'
const statusCriticalBg = '#d43f2b14'
const statusPromoteBg = '#f8107114'

const lightColors = {
  textPrimary: 'black',
  textSecondary: grayScale[800],
  textDisabled: grayScale[400],
  textInverted: 'white',

  backgroundPrimary: 'white',
  backgroundSecondary: grayScale[100],
  backgroundTertiary: grayScale[50],
  backgroundPage: 'white',
  backgroundInput: 'white',
  backgroundThumbnail: grayScale[600],
  backgroundInverted: grayScale[900],

  borderPrimary: grayScale[300],
  borderSecondary: grayScale[200],

  statusDefault,
  statusInfo,
  statusOk,
  statusWarning,
  statusCritical,
  statusPromote,
  statusDefaultBg,
  statusInfoBg,
  statusOkBg,
  statusWarningBg,
  statusCriticalBg,
  statusPromoteBg,

  backgroundButtonPrimary: centrifugeBlue,
  backgroundButtonPrimaryFocus: centrifugeBlue,
  backgroundButtonPrimaryHover: centrifugeBlue,
  backgroundButtonPrimaryPressed: blueScale[600],
  backgroundButtonPrimaryDisabled: grayScale[300],
  textButtonPrimary: 'white',
  textButtonPrimaryFocus: 'white',
  textButtonPrimaryHover: 'white',
  textButtonPrimaryPressed: 'white',
  textButtonPrimaryDisabled: grayScale[600],
  borderButtonPrimary: centrifugeBlue,
  borderButtonPrimaryFocus: blueScale[700],
  borderButtonPrimaryHover: blueScale[700],
  borderButtonPrimaryPressed: blueScale[700],
  borderButtonPrimaryDisabled: 'transparent',
  shadowButtonPrimary: '#0241E945',

  backgroundButtonSecondary: grayScale[100],
  backgroundButtonSecondaryFocus: grayScale[100],
  backgroundButtonSecondaryHover: grayScale[100],
  backgroundButtonSecondaryPressed: grayScale[200],
  backgroundButtonSecondaryDisabled: grayScale[300],
  textButtonSecondary: centrifugeBlue,
  textButtonSecondaryFocus: centrifugeBlue,
  textButtonSecondaryHover: centrifugeBlue,
  textButtonSecondaryPressed: centrifugeBlue,
  textButtonSecondaryDisabled: grayScale[600],

  borderButtonSecondary: grayScale[200],
  borderButtonSecondaryFocus: centrifugeBlue,
  borderButtonSecondaryHover: centrifugeBlue,
  borderButtonSecondaryPressed: centrifugeBlue,
  borderButtonSecondaryDisabled: 'transparent',
  shadowButtonSecondary: '#d8d8d866',

  backgroundButtonTertiary: 'transparent',
  backgroundButtonTertiaryFocus: 'transparent',
  backgroundButtonTertiaryHover: 'tranparent',
  backgroundButtonTertiaryPressed: 'transparent',
  backgroundButtonTertiaryDisabled: 'transparent',
  textButtonTertiary: grayScale[900],
  textButtonTertiaryFocus: centrifugeBlue,
  textButtonTertiaryHover: centrifugeBlue,
  textButtonTertiaryPressed: centrifugeBlue,
  textButtonTertiaryDisabled: grayScale[500],
  borderButtonTertiary: 'transparent',
  borderButtonTertiaryFocus: 'transparent',
  borderButtonTertiaryHover: 'transparent',
  borderButtonTertiaryPressed: 'transparent',
  borderButtonTertiaryDisabled: 'transparent',
}

export const modeLight = {
  colors: lightColors,
}
