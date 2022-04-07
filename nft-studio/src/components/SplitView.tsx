import { Box } from '@centrifuge/fabric'
import * as React from 'react'

type Props = {
  left: React.ReactNode
  right: React.ReactNode
}

export const SplitView: React.FC<Props> = ({ left, right }) => {
  return (
    <Box
      flex="1"
      display="grid"
      gridTemplateColumns={['1fr', '1fr', '2fr 1fr']}
      gridAutoRows={['max-content', 'max-content', 'initial']}
      position="relative"
    >
      <Box borderRightWidth={[0, 0, '1px']} borderRightStyle="solid" borderRightColor="borderPrimary">
        {left}
      </Box>
      <Box>{right}</Box>
    </Box>
  )
}
