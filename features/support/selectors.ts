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
    minTINRatioDisplay: `//div[div[h5[contains(., "Min TIN risk buffer")]]]//h4`,
    minTINRatioInput: `//div[label[contains(., "Set minimum TIN risk buffer")]]//input`,
    setMinTINRatioButton: `//div[div[h5[contains(., "Min TIN risk buffer")]]]//button[contains(., "Apply")]`,

    // mint nft page
    mintNFTReferenceInput: `//div[label[contains(., "NFT Reference")]]//input`,
    mintNFTSuccessAlert: `//div[contains(text(), "Successfully minted NFT for Token ID")]`,
    mintNFTButton: `//body[1]/div[1]/div[1]/div[1]/div[2]/div[1]/div[1]/div[1]/div[2]/div[3]/button[1]`, // //button[contains(., "Mint NFT")]
  },
}
