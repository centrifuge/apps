export const selectors = {
	gateway: {

	},
	tinlake: {
		connectButton: `//button[contains(., 'Connect')]`,
		web3modalMetamaskButton: `//*[@id="WEB3_CONNECT_MODAL_ID"]//div[contains(text(), 'Connect to your MetaMask Wallet')]`,

		minTINRatioDisplay: `//div[span[contains(., "Minimum TIN ratio")]]//span`,
		minTINRatioInput: `//div[label[contains(., "Min TIN ratio")]]//input`,
		setMinTINRatioButton: `//button[contains(., "Set min TIN ratio")]`,
	}
}
