import { black, blackScale, blueScale, centrifugeBlue, gold, grayScale, yellowScale } from './colors'

const statusDefault = grayScale[800]
const statusInfo = blueScale[500]
const statusOk = '#519b10'
const statusWarning = yellowScale[800]
const statusCritical = '#d43f2b'
const statusPromote = '#f81071'

const statusDefaultBg = grayScale[300]
const statusInfoBg = blueScale[50]
const statusOkBg = '#f1f7ec'
const statusWarningBg = yellowScale[50]
const statusCriticalBg = '#fcf0ee'
const statusPromoteBg = '#f8107114'

const colors = {
  textPrimary: grayScale[800],
  textSecondary: grayScale[500],
  textDisabled: grayScale[300],
  textInverted: 'white',
  textGold: gold,

  backgroundPrimary: 'white',
  backgroundSecondary: grayScale[50],
  backgroundTertiary: grayScale[100],
  backgroundAccentPrimary: blueScale[50],
  backgroundAccentSecondary: blueScale[100],
  backgroundPage: 'white',
  backgroundInput: 'white',
  backgroundThumbnail: grayScale[500],
  backgroundInverted: grayScale[800],

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
  backgroundButtonPrimaryPressed: yellowScale[800],
  backgroundButtonPrimaryDisabled: grayScale[300],
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
  shadowButtonSecondary: 'transparent',

  backgroundButtonTertiary: 'transparent',
  backgroundButtonTertiaryFocus: 'transparent',
  backgroundButtonTertiaryHover: 'tranparent',
  backgroundButtonTertiaryPressed: 'transparent',
  backgroundButtonTertiaryDisabled: 'transparent',
  textButtonTertiary: centrifugeBlue,
  textButtonTertiaryFocus: centrifugeBlue,
  textButtonTertiaryHover: grayScale[800],
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
  textButtonInverted: black,
  textButtonInvertedFocus: black,
  textButtonInvertedHover: black,
  textButtonInvertedPressed: black,
  textButtonInvertedDisabled: grayScale[500],
  borderButtonInverted: grayScale[100],
  borderButtonInvertedFocus: black,
  borderButtonInvertedHover: black,
  borderButtonInvertedPressed: black,
  borderButtonInvertedDisabled: 'transparent',
  shadowButtonInverted: 'transparent',
}

export const colorTheme = {
  colors,
}
