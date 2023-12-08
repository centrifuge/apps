import { blueScale, centrifugeBlue, grayScale } from './colors'

const statusDefault = grayScale[800]
const statusInfo = '#1253ff'
const statusOk = '#519b10'
const statusWarning = '#ffc012'
const statusCritical = '#d43f2b'

const statusDefaultBg = `${grayScale[800]}14`
const statusInfoBg = '#1253ff14'
const statusOkBg = '#519b1014'
const statusWarningBg = '#ffc01214'
const statusCriticalBg = '#d43f2b14'

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
  statusDefaultBg,
  statusInfoBg,
  statusOkBg,
  statusWarningBg,
  statusCriticalBg,

  backgroundButtonPrimary: centrifugeBlue,
  backgroundButtonPrimaryFocus: centrifugeBlue,
  backgroundButtonPrimaryHover: 'black',
  backgroundButtonPrimaryPressed: 'black',
  backgroundButtonPrimaryDisabled: grayScale[600],
  textButtonPrimary: 'white',
  textButtonPrimaryFocus: 'white',
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
  backgroundButtonSecondaryHover: 'transparent',
  backgroundButtonSecondaryPressed: 'transparent',
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
