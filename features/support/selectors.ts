// Use Xpaths to select elements with a specific text/content
// Cheatsheet: https://devhints.io/xpath
export const selectors = {
  gateway: {},
  tinlake: {
    // header
    connectButton: `//button[contains(., 'Connect')]`,

    // onboard modal
    onboardMetamaskButton: `//aside[contains(concat(' ',normalize-space(@class),' '),' bn-onboard-modal ')]//button[span[contains(text(), 'MetaMask')]]`,

    // investor page
    minTINRatioDisplay: `//div[span[contains(., "Minimum TIN ratio")]]//span`,
    minTINRatioInput: `//div[label[contains(., "Min TIN ratio")]]//input`,
    setMinTINRatioButton: `//button[contains(., "Set min TIN ratio")]`,

    // mint nft page
    mintNFTReferenceInput: `//div[label[contains(., "NFT Reference")]]//input`,
    mintNFTSuccessAlert: `//div[contains(text(), "Successfully minted NFT for Token ID")]`,
    mintNFTButton: `//body[1]/div[1]/div[1]/div[1]/div[2]/div[1]/div[1]/div[1]/div[2]/div[3]/button[1]`, // //button[contains(., "Mint NFT")]
  },
};
