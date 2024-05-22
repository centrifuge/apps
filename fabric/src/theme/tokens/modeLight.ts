import { blueScale, centrifugeBlue, grayScale, yellowScale } from './colors'

const statusDefault = grayScale[800]
const statusInfo = blueScale[500]
const statusOk = '#519b10'
const statusWarning = yellowScale[500]
const statusCritical = '#d43f2b'
const statusPromote = '#f81071'

const statusDefaultBg = grayScale[300]
const statusInfoBg = grayScale[300]
const statusOkBg = '#f1f7ec'
const statusWarningBg = yellowScale[50]
const statusCriticalBg = '#fcf0ee'
const statusPromoteBg = '#f8107114'

const lightColors = {
  textPrimary: grayScale[900],
  textSecondary: grayScale[800],
  textDisabled: grayScale[500],
  textInverted: 'white',

  backgroundPrimary: 'white',
  backgroundSecondary: grayScale[100],
  backgroundTertiary: grayScale[100],
  backgroundAccentPrimary: blueScale[100],
  backgroundAccentSecondary: '#e9eff2',
  backgroundPage: 'white',
  backgroundInput: 'white',
  backgroundThumbnail: grayScale[500],
  backgroundInverted: grayScale[900],

  borderPrimary: grayScale[100],
  borderSecondary: grayScale[300],

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
  backgroundButtonPrimaryPressed: blueScale[500],
  backgroundButtonPrimaryDisabled: grayScale[300],
  textButtonPrimary: 'white',
  textButtonPrimaryFocus: 'white',
  textButtonPrimaryHover: 'white',
  textButtonPrimaryPressed: 'white',
  textButtonPrimaryDisabled: grayScale[500],
  borderButtonPrimary: centrifugeBlue,
  borderButtonPrimaryFocus: blueScale[700],
  borderButtonPrimaryHover: blueScale[700],
  borderButtonPrimaryPressed: blueScale[700],
  borderButtonPrimaryDisabled: 'transparent',
  shadowButtonPrimary: '#0241E945',

  backgroundButtonSecondary: blueScale[100],
  backgroundButtonSecondaryFocus: blueScale[100],
  backgroundButtonSecondaryHover: blueScale[100],
  backgroundButtonSecondaryPressed: blueScale[100],
  backgroundButtonSecondaryDisabled: grayScale[300],
  textButtonSecondary: centrifugeBlue,
  textButtonSecondaryFocus: centrifugeBlue,
  textButtonSecondaryHover: centrifugeBlue,
  textButtonSecondaryPressed: centrifugeBlue,
  textButtonSecondaryDisabled: grayScale[500],
  borderButtonSecondary: grayScale[300],
  borderButtonSecondaryFocus: centrifugeBlue,
  borderButtonSecondaryHover: centrifugeBlue,
  borderButtonSecondaryPressed: centrifugeBlue,
  borderButtonSecondaryDisabled: 'transparent',
  shadowButtonSecondary: '#A8BFFD35',

  backgroundButtonTertiary: 'transparent',
  backgroundButtonTertiaryFocus: 'transparent',
  backgroundButtonTertiaryHover: 'tranparent',
  backgroundButtonTertiaryPressed: 'transparent',
  backgroundButtonTertiaryDisabled: 'transparent',
  textButtonTertiary: centrifugeBlue,
  textButtonTertiaryFocus: centrifugeBlue,
  textButtonTertiaryHover: grayScale[900],
  textButtonTertiaryPressed: centrifugeBlue,
  textButtonTertiaryDisabled: grayScale[500],
  borderButtonTertiary: 'transparent',
  borderButtonTertiaryFocus: 'transparent',
  borderButtonTertiaryHover: 'transparent',
  borderButtonTertiaryPressed: 'transparent',
  borderButtonTertiaryDisabled: 'transparent',

  backgroundButtonInverted: grayScale[100],
  backgroundButtonInvertedFocus: grayScale[100],
  backgroundButtonInvertedHover: grayScale[100],
  backgroundButtonInvertedPressed: grayScale[100],
  backgroundButtonInvertedDisabled: grayScale[100],
  textButtonInverted: centrifugeBlue,
  textButtonInvertedFocus: centrifugeBlue,
  textButtonInvertedHover: centrifugeBlue,
  textButtonInvertedPressed: centrifugeBlue,
  textButtonInvertedDisabled: grayScale[500],
  borderButtonInverted: grayScale[100],
  borderButtonInvertedFocus: centrifugeBlue,
  borderButtonInvertedHover: centrifugeBlue,
  borderButtonInvertedPressed: centrifugeBlue,
  borderButtonInvertedDisabled: 'transparent',
  shadowButtonInverted: '#E0E7FF',
}

export const modeLight = {
  colors: lightColors,
}
