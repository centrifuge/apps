import getConfig from 'next/config'
const { publicRuntimeConfig } = getConfig()

const config = {
  rpcUrl: publicRuntimeConfig.RPC_URL,
  contractAddresses: publicRuntimeConfig.TINLAKE_ADDRESSES && JSON.parse(publicRuntimeConfig.TINLAKE_ADDRESSES),
  nftDataDefinition: publicRuntimeConfig.NFT_DATA_DEFINITION && JSON.parse(publicRuntimeConfig.NFT_DATA_DEFINITION),
  tinlakeDataBackendUrl: publicRuntimeConfig.TINLAKE_DATA_BACKEND_URL
};

if (!config.nftDataDefinition) {
  throw new Error(`Missing env NFT_DATA_DEFINITION`);
}

if (!config.contractAddresses) {
  throw new Error(`Missing env TINLAKE_ADDRESSES`);
}

export default config
