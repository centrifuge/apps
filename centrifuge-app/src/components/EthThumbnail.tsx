import { Box, Flex, Shelf, Tooltip } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'
import ethereumLogo from '../assets/images/ethereum.svg'

type Props = {
  children: React.ReactNode
  size?: 'small' | 'large'
  show?: boolean
}

const Container = styled(Shelf)`
  transform: translate(-50%, 50%);
  filter: ${({ theme }) => (theme.scheme === 'dark' ? 'invert()' : undefined)};

  > button {
    width: 100%;
    height: 100%;
  }

  img {
    object-fit: contain;
  }
`

export function Eththumbnail({ children, size = 'large', show }: Props) {
  const width = size === 'large' ? 18 : 12

  return (
    <Flex position="relative">
      {children}
      {show && (
        <Container
          position="absolute"
          bottom={0}
          left={0}
          width={width + 4}
          height={width + 4}
          p="2px"
          borderRadius="50%"
          background="white"
        >
          <Tooltip body="This pool is on Ethereum Mainnet. Use an Ethereum compatible wallet to invest into this pool.">
            <Box as="img" src={ethereumLogo} width="100%" height="100%" alt="" />
          </Tooltip>
        </Container>
      )}
    </Flex>
  )
}
