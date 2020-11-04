// Use Xpaths to select elements with a specific text/content
// Cheatsheet: https://devhints.io/xpath

const trancheOverviewSelectors = {
  investButton: `//button[contains(., "Invest")]`,
  amountInput: `//input`,
  lockDAIButton: `//button[contains(., "Lock DAI")]`,
  cancelOrderButton: `//button[contains(., "Cancel Order")]`,
  collectButton: `//button[contains(., "Collect")]`,
}

export const selectors = {
  // header
  connectButton: `//button[contains(., "Connect")]`,

  // onboard modal
  onboardMetamaskButton: `//aside[contains(concat(" ",normalize-space(@class)," ")," bn-onboard-modal ")]//button[span[contains(text(), 'MetaMask')]]`,

  // investments page

  investmentsPage: {
    _path: `//div[h4[contains(., "Invest/Redeem")]]`,
    dropCard: { ...trancheOverviewSelectors, _path: `//div[contains(., "DROP Balance")]` },
    tinCard: { ...trancheOverviewSelectors, _path: `//div[contains(., "TIN Balance")]` },
    minTinRatio: {
      _path: `//div[div[h5[contains(., "Min TIN risk buffer")]]]`,
      value: `//h5[2]`,
      input: `//input`,
      updateButton: `//button[contains(., "Apply")]`,
    },
  },

  mintNFTPage: {
    _path: `//div[div[contains(b, "Please specify metadata of NFT")]]`,
    referenceInput: `//div[label[contains(., "NFT Reference")]]//input`,
    successAlert: `//div[contains(text(), "Successfully minted NFT for Token ID")]`,
    mintButton: `//button[contains(text(), "Mint NFT")]`,
  },
}

export default selectors
