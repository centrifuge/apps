import { altairYellow, grayScale, yellowScale } from './colors'

const statusDefault = grayScale[500]
const statusInfo = '#006ef5'
const statusOk = '#74B634'
const statusWarning = '#a86500'
const statusCritical = '#d43F2b'
const statusPromote = '#f81071'

const darkColors = {
  textPrimary: 'white',
  textSecondary: grayScale[500],
  textDisabled: grayScale[600],
  textInverted: 'black',

  backgroundPrimary: 'black',
  backgroundSecondary: grayScale[900],
  backgroundTertiary: grayScale[950],
  backgroundPage: 'black',
  backgroundInput: grayScale[950],
  backgroundThumbnail: grayScale[400],
  backgroundInverted: grayScale[50],

  borderPrimary: grayScale[700],
  borderSecondary: grayScale[800],

  statusDefault,
  statusInfo,
  statusOk,
  statusWarning,
  statusCritical,
  statusPromote,
  statusDefaultBg: 'transparent',
  statusInfoBg: 'transparent',
  statusOkBg: 'transparent',
  statusWarningBg: 'transparent',
  statusCriticalBg: 'transparent',
  statusPromoteBg: 'transparent',

  backgroundButtonPrimary: altairYellow,
  backgroundButtonPrimaryFocus: altairYellow,
  backgroundButtonPrimaryHover: 'white',
  backgroundButtonPrimaryPressed: 'white',
  backgroundButtonPrimaryDisabled: grayScale[600],
  textButtonPrimary: 'black',
  textButtonPrimaryFocus: 'black',
  textButtonPrimaryHover: 'black',
  textButtonPrimaryPressed: 'black',
  textButtonPrimaryDisabled: 'white',
  borderButtonPrimary: altairYellow,
  borderButtonPrimaryFocus: 'white',
  borderButtonPrimaryHover: 'white',
  borderButtonPrimaryPressed: 'white',
  borderButtonPrimaryDisabled: grayScale[600],
  shadowButtonPrimary: altairYellow,

  backgroundButtonSecondary: 'transparent',
  backgroundButtonSecondaryFocus: 'transparent',
  backgroundButtonSecondaryHover: 'black',
  backgroundButtonSecondaryPressed: 'black',
  backgroundButtonSecondaryDisabled: 'transparent',
  textButtonSecondary: 'white',
  textButtonSecondaryFocus: 'white',
  textButtonSecondaryHover: 'white',
  textButtonSecondaryPressed: 'white',
  textButtonSecondaryDisabled: grayScale[600],

  borderButtonSecondary: grayScale[600],
  borderButtonSecondaryFocus: 'white',
  borderButtonSecondaryHover: grayScale[600],
  borderButtonSecondaryPressed: 'white',
  borderButtonSecondaryDisabled: grayScale[600],
  shadowButtonSecondary: 'white',

  backgroundButtonTertiary: 'transparent',
  backgroundButtonTertiaryFocus: 'transparent',
  backgroundButtonTertiaryHover: yellowScale[700],
  backgroundButtonTertiaryPressed: yellowScale[700],
  backgroundButtonTertiaryDisabled: 'transparent',
  textButtonTertiary: 'white',
  textButtonTertiaryFocus: yellowScale[500],
  textButtonTertiaryHover: yellowScale[500],
  textButtonTertiaryPressed: yellowScale[500],
  textButtonTertiaryDisabled: grayScale[600],
  borderButtonTertiary: 'transparent',
  borderButtonTertiaryFocus: 'transparent',
  borderButtonTertiaryHover: 'transparent',
  borderButtonTertiaryPressed: yellowScale[500],
  borderButtonTertiaryDisabled: 'transparent',
}

export const modeDark = {
  colors: darkColors,
}
