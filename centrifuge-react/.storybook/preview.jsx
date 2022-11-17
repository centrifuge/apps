import { Box, centrifugeLight, FabricProvider, GlobalStyle } from '@centrifuge/fabric'
import { Provider } from '../src/components/Provider'

export const decorators = [
  (Story, context) => (
    <FabricProvider theme={centrifugeLight}>
      <GlobalStyle />
      <Provider>
        <Box p={3} bg="backgroundPage" minHeight="100vh">
          <Story />
        </Box>
      </Provider>
    </FabricProvider>
  ),
]
