/**
 * Tree structure for selectors. Any leaf is prepended with the _path values in its parent nodes.
 * E.g. investmentsPage.minTinRatio.value = investmentsPage._path + minTinRatio._path + value
 *
 * Cheatsheet: https://devhints.io/xpath
 */

const trancheOverviewSelectors = {
  investButton: `//button[contains(., "Invest")]`,
  redeemButton: `//button[contains(., "Redeem")]`,
  amountInput: `//input`,
  lockDAIButton: `//button[contains(., "Lock DAI")]`,
  lockTINButton: `//button[contains(., "Lock TIN")]`,
  lockDROPButton: `//button[contains(., "Lock DROP")]`,
  cancelOrderButton: `//button[contains(., "Cancel Order")]`,
  confirmCancellationButton: `//button[contains(., "Confirm Cancellation")]`,
  collectButton: `//button[contains(., "Collect")]`,
}

export const selectors = {
  connectButton: `//button[contains(., "Connect")]`,

  onboardMetamaskButton: `//aside[contains(concat(" ",normalize-space(@class)," ")," bn-onboard-modal ")]//button[span[contains(text(), 'MetaMask')]]`,

  pendingTransaction: `//div[contains(text(), "Transaction pending")]`,
  successfulTransaction: `//div[contains(text(), "Transaction successful")]`,

  investmentsPage: {
    _path: `//div[h4[contains(., "Invest/Redeem")]]`,
    dropCard: { ...trancheOverviewSelectors, _path: `//div[div[h5[contains(., "DROP Balance")]]]` },
    tinCard: { ...trancheOverviewSelectors, _path: `//div[div[h5[contains(., "TIN Balance")]]]` },
    minTinRatio: {
      _path: `//div[div[h5[contains(., "Min TIN risk buffer")]]]`,
      value: `//h5[2]`,
      input: `//input`,
      updateButton: `//button[contains(., "Apply")]`,
    },
  },

  assetsPage: {
    setMaxReserveButton: `//button[contains(., "Set max reserve")][not(@disabled)]`,
    maxReserveValue: `//tr[th[contains(., "Pool reserve")]]//div[contains(string(), "Max: ")]//div`,
    setMaxReserve: {
      _path: `//div[div[h5[contains(., "Set maximum reserve amount")]]]`,
      input: `//input`,
      saveButton: `//button[contains(., "Save")]`,
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
