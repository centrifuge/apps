import { Shelf, Text } from '@centrifuge/fabric'
import * as React from 'react'

export const Footer: React.FC = () => {
  return (
    <Shelf as="footer" justifySelf="flex-end" alignSelf="center" p={3} mt="auto" justifyContent="center">
      <Text as="a" href="https://centrifuge.io/imprint" target="_blank" rel="noopener" variant="interactive2">
        Imprint
      </Text>
    </Shelf>
  )
}
