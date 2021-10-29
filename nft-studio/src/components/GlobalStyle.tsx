import { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
	html,
	body {
		min-height: 100vh;
	}
	body {
		display: flex;
  	flex-direction: column;
	}
	#root {
		flex: 1;
		display: flex;
		flex-direction: column;

		& > :last-child {
			flex: 1
		}
	}
	img {
		max-width: 100%;
	}
`
