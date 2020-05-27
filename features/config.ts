require('dotenv').config()

export const config = {
  gatewayUrl: process.env.GATEWAY_URL,
  tinlakeUrl: process.env.TINLAKE_URL,
  ethNetwork: process.env.ETH_NETWORK,
  ethAdminPrivateKey: process.env.ETH_ADMIN_PRIVATE_KEY,
}
