import { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
	* {
		margin: 0;
		padding: 0;
	}
	
	button {
		border: none;
		appearance: none;
		background: transparent;
		outline: 0;
	}

	img {
		max-width: 100%;
	}
`
