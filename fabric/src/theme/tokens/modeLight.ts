import { altairYellow, blueScale, centrifugeBlue, grayScale } from './colors'

const statusDefault = grayScale[600]
const statusInfo = '#006ef5'
const statusOk = '#5da01d'
const statusWarning = '#a86500'
const statusCritical = '#d43f2b'

const lightColors = {
  textPrimary: 'black',
  textSecondary: grayScale[700],
  textDisabled: grayScale[500],
  textInverted: 'white',

  backgroundPrimary: 'white',
  backgroundSecondary: grayScale[100],
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

  backgroundButtonPrimary: centrifugeBlue,
  backgroundButtonPrimaryFocus: altairYellow,
  backgroundButtonPrimaryHover: 'black',
  backgroundButtonPrimaryPressed: 'black',
  backgroundButtonPrimaryDisabled: grayScale[600],
  textButtonPrimary: 'white',
  textButtonPrimaryFocus: 'whites',
  textButtonPrimaryHover: 'white',
  textButtonPrimaryPressed: 'white',
  textButtonPrimaryDisabled: 'white',
  borderButtonPrimary: centrifugeBlue,
  borderButtonPrimaryFocus: 'black',
  borderButtonPrimaryHover: 'black',
  borderButtonPrimaryPressed: 'black',
  borderButtonPrimaryDisabled: grayScale[600],
  shadowButtonPrimaryPressed: centrifugeBlue,

  backgroundButtonSecondary: 'transparent',
  backgroundButtonSecondaryFocus: 'transparent',
  backgroundButtonSecondaryHover: 'white',
  backgroundButtonSecondaryPressed: 'white',
  backgroundButtonSecondaryDisabled: 'transparent',
  textButtonSecondary: 'black',
  textButtonSecondaryFocus: 'black',
  textButtonSecondaryHover: 'black',
  textButtonSecondaryPressed: 'black',
  textButtonSecondaryDisabled: grayScale[600],

  borderButtonSecondary: grayScale[300],
  borderButtonSecondaryFocus: 'black',
  borderButtonSecondaryHover: grayScale[300],
  borderButtonSecondaryPressed: 'black',
  borderButtonSecondaryDisabled: grayScale[300],
  shadowButtonSecondaryPressed: 'black',

  backgroundButtonTertiary: 'transparent',
  backgroundButtonTertiaryFocus: 'transparent',
  backgroundButtonTertiaryHover: blueScale[50],
  backgroundButtonTertiaryPressed: blueScale[50],
  backgroundButtonTertiaryDisabled: 'transparent',
  textButtonTertiary: 'black',
  textButtonTertiaryFocus: centrifugeBlue,
  textButtonTertiaryHover: centrifugeBlue,
  textButtonTertiaryPressed: centrifugeBlue,
  textButtonTertiaryDisabled: grayScale[500],
  borderButtonTertiary: 'transparent',
  borderButtonTertiaryFocus: 'transparent',
  borderButtonTertiaryHover: 'transparent',
  borderButtonTertiaryPressed: centrifugeBlue,
  borderButtonTertiaryDisabled: 'transparent',

  backgroundButtonWallet: 'white',
  backgroundButtonWalletFocus: grayScale[80],
  backgroundButtonWalletHover: grayScale[80],
  backgroundButtonWalletPressed: 'white',
  backgroundButtonWalletDisabled: 'transparent',
  textButtonWallet: 'black',
  textButtonWalletFocus: 'black',
  textButtonWalletHover: 'black',
  textButtonWalletPressed: 'black',
  textButtonWalletDisabled: grayScale[600],
  borderButtonWallet: grayScale[300],
  borderButtonWalletFocus: 'black',
  borderButtonWalletHover: 'transparent',
  borderButtonWalletPressed: grayScale[80],
  borderButtonWalletDisabled: grayScale[300],
  shadowButtonWalletPressed: 'black',
}

export const modeLight = {
  colors: lightColors,
}
