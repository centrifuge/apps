export const toIpfsUrl = (ipfsHash: string) => `${process.env.REACT_APP_IPFS_GATEWAY}ipfs/${ipfsHash}`
