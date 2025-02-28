import { black, blueScale, gold, grayScale, yellowScale } from './colors'

const statusDefault = grayScale[800]
const statusInfo = yellowScale[800]
const statusOk = '#277917'
const statusWarning = yellowScale[800]
const statusCritical = '#d43f2b'
const statusPromote = '#f81071'

const statusDefaultBg = grayScale[100]
const statusInfoBg = yellowScale[100]
const statusOkBg = '#DCEBCF'
const statusWarningBg = yellowScale[50]
const statusCriticalBg = '#fcf0ee'
const statusPromoteBg = '#f8107114'

const colors = {
  textPrimary: grayScale[800],
  textSecondary: grayScale[500],
  textDisabled: grayScale[900],
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
  borderSecondary: 'rgba(207, 207, 207, 0.50)',
  borderTertiary: grayScale[10],

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
  backgroundButtonPrimaryDisabled: yellowScale[50],
  textButtonPrimary: black,
  textButtonPrimaryFocus: black,
  textButtonPrimaryHover: black,
  textButtonPrimaryPressed: black,
  textButtonPrimaryDisabled: grayScale[300],
  borderButtonPrimary: gold,
  borderButtonPrimaryFocus: yellowScale[100],
  borderButtonPrimaryHover: yellowScale[100],
  borderButtonPrimaryPressed: yellowScale[100],
  borderButtonPrimaryDisabled: 'transparent',
  shadowButtonPrimary: yellowScale[100],

  backgroundButtonSecondary: black,
  backgroundButtonSecondaryFocus: black,
  backgroundButtonSecondaryHover: black,
  backgroundButtonSecondaryPressed: black,
  backgroundButtonSecondaryDisabled: grayScale[300],
  textButtonSecondary: 'white',
  textButtonSecondaryFocus: 'white',
  textButtonSecondaryHover: 'white',
  textButtonSecondaryPressed: 'white',
  textButtonSecondaryDisabled: grayScale[500],
  borderButtonSecondary: black,
  borderButtonSecondaryFocus: black,
  borderButtonSecondaryHover: black,
  borderButtonSecondaryPressed: black,
  borderButtonSecondaryDisabled: 'transparent',
  shadowButtonSecondary: grayScale[100],

  backgroundButtonTertiary: 'transparent',
  backgroundButtonTertiaryFocus: 'transparent',
  backgroundButtonTertiaryHover: 'tranparent',
  backgroundButtonTertiaryPressed: 'transparent',
  backgroundButtonTertiaryDisabled: 'transparent',
  textButtonTertiary: grayScale[800],
  textButtonTertiaryFocus: gold,
  textButtonTertiaryHover: gold,
  textButtonTertiaryPressed: gold,
  textButtonTertiaryDisabled: grayScale[300],
  borderButtonTertiary: 'transparent',
  borderButtonTertiaryFocus: 'transparent',
  borderButtonTertiaryHover: 'transparent',
  borderButtonTertiaryPressed: 'transparent',
  borderButtonTertiaryDisabled: 'transparent',

  backgroundButtonInverted: grayScale[100],
  backgroundButtonInvertedFocus: grayScale[100],
  backgroundButtonInvertedHover: grayScale[100],
  backgroundButtonInvertedPressed: grayScale[100],
  backgroundButtonInvertedDisabled: grayScale[50],
  textButtonInverted: black,
  textButtonInvertedFocus: black,
  textButtonInvertedHover: black,
  textButtonInvertedPressed: black,
  textButtonInvertedDisabled: grayScale[500],
  borderButtonInverted: grayScale[100],
  borderButtonInvertedFocus: grayScale[50],
  borderButtonInvertedHover: grayScale[50],
  borderButtonInvertedPressed: grayScale[50],
  borderButtonInvertedDisabled: 'transparent',
  shadowButtonInverted: grayScale[50],
}

export const colorTheme = {
  colors,
}
