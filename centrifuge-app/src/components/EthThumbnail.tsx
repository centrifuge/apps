import { Box, Flex, Shelf } from '@centrifuge/fabric'
import * as React from 'react'
import ethereumLogo from '../assets/images/ethereum.svg'

type Props = {
  children: React.ReactNode
  size?: 'small' | 'large'
  show?: boolean
}

export function Eththumbnail({ children, size = 'large', show }: Props) {
  const width = size === 'large' ? 18 : 12
  return (
    <Flex position="relative">
      {children}
      {show && (
        <Shelf
          position="absolute"
          bottom={0}
          left={0}
          width={width + 4}
          height={width + 4}
          borderRadius="50%"
          background="white"
          style={{ transform: 'translate(-50%, 50%)' }}
        >
          <Box as="img" src={ethereumLogo} height={width} mx="auto" />
        </Shelf>
      )}
    </Flex>
  )
}
