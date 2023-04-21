import { WalletMenu } from '@centrifuge/centrifuge-react'
import { Box, Shelf } from '@centrifuge/fabric'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { config } from '../../config'
import { OnboardingStatus } from '../OnboardingStatus'

type HeaderProps = {
  children?: React.ReactNode
  walletMenu?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const [_, WordMark] = config.logo

export function Header({ children, walletMenu = true }: HeaderProps) {
  return (
    <Shelf as="header" justifyContent="space-between" gap={2} p={3}>
      <Shelf alignItems="center" gap={3}>
        <Box as={Link} to="/" width={110}>
          <WordMark />
        </Box>

        {children}
      </Shelf>

      {walletMenu && (
        <Box width="300px">
          <WalletMenu menuItems={[<OnboardingStatus />]} />
        </Box>
      )}
    </Shelf>
  )
}
