import { blackScale, blueScale, centrifugeBlue, grayScale, yellowScale } from './colors'

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

const black = '#252B34'
const gold = '#FFC500'

const colors = {
  textPrimary: grayScale[900],
  textSecondary: grayScale[800],
  textDisabled: grayScale[500],
  textInverted: 'white',
  textGold: gold,
  textBlack: black,

  backgroundPrimary: 'white',
  backgroundSecondary: grayScale[100],
  backgroundTertiary: grayScale[50],
  backgroundAccentPrimary: blueScale[100],
  backgroundAccentSecondary: '#e9eff2',
  backgroundPage: 'white',
  backgroundInput: 'white',
  backgroundThumbnail: grayScale[500],
  backgroundInverted: grayScale[900],
  backgroundBlack: black,

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

  backgroundButtonPrimary: gold,
  backgroundButtonPrimaryFocus: gold,
  backgroundButtonPrimaryHover: gold,
  backgroundButtonPrimaryPressed: yellowScale[500],
  backgroundButtonPrimaryDisabled: yellowScale[500],
  textButtonPrimary: black,
  textButtonPrimaryFocus: black,
  textButtonPrimaryHover: black,
  textButtonPrimaryPressed: black,
  textButtonPrimaryDisabled: grayScale[500],
  borderButtonPrimary: gold,
  borderButtonPrimaryFocus: yellowScale[800],
  borderButtonPrimaryHover: yellowScale[800],
  borderButtonPrimaryPressed: yellowScale[800],
  borderButtonPrimaryDisabled: 'transparent',
  shadowButtonPrimary: 'transparent',

  backgroundButtonSecondary: black,
  backgroundButtonSecondaryFocus: blackScale[500],
  backgroundButtonSecondaryHover: blackScale[500],
  backgroundButtonSecondaryPressed: blackScale[500],
  backgroundButtonSecondaryDisabled: grayScale[300],
  textButtonSecondary: 'white',
  textButtonSecondaryFocus: gold,
  textButtonSecondaryHover: gold,
  textButtonSecondaryPressed: gold,
  textButtonSecondaryDisabled: grayScale[500],
  borderButtonSecondary: grayScale[300],
  borderButtonSecondaryFocus: gold,
  borderButtonSecondaryHover: gold,
  borderButtonSecondaryPressed: gold,
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

export const colorTheme = {
  colors,
}
