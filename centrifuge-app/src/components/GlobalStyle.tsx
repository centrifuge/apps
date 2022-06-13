import { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
	html, body, #root, #root>div[data-overlay-container] {
		height: 100vh;
		font-family: Inter, sans-serif;
	}
	* {
		margin: 0;
		padding: 0;
	}
	
	img {
		max-width: 100%;
	}
	button {
		text-align: left;
	}
`
