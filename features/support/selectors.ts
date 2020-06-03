// Use Xpaths to select elements with a specific text/content
// Cheatsheet: https://devhints.io/xpath
export const selectors = {
	gateway: {

	},
	tinlake: {
		connectButton: `//button[contains(., 'Connect')]`,
		onboardMetamaskButton: `//aside[contains(concat(' ',normalize-space(@class),' '),' bn-onboard-modal ')]//button[span[contains(text(), 'MetaMask')]]`,

		minTINRatioDisplay: `//div[span[contains(., "Minimum TIN ratio")]]//span`,
		minTINRatioInput: `//div[label[contains(., "Min TIN ratio")]]//input`,
		setMinTINRatioButton: `//button[contains(., "Set min TIN ratio")]`,
	}
}
