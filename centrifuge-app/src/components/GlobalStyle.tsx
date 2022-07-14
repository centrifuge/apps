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

	input[type='search']::-webkit-search-decoration,
	input[type='search']::-webkit-search-cancel-button,
	input[type='search']::-webkit-search-results-button,
	input[type='search']::-webkit-search-results-decoration {
	  -webkit-appearance: none;
	}
`
