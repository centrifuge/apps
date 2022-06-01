import { altairYellow, grayScale, yellowScale } from './colors'

const statusDefault = grayScale[600]
const statusInfo = '#006ef5'
const statusOk = '#598232'
const statusWarning = '#a86500'
const statusCritical = '#d43F2b'

const darkColors = {
  textPrimary: 'white',
  textSecondary: grayScale[500],
  textDisabled: grayScale[600],
  textInverted: 'black',

  backgroundPrimary: grayScale[900],
  backgroundSecondary: grayScale[800],
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
  shadowButtonPrimaryPressed: altairYellow,

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
  shadowButtonSecondaryPressed: 'white',

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
