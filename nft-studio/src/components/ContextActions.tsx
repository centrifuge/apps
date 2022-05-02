import { Box, Shelf } from '@centrifuge/fabric'
import * as React from 'react'
import { AccountsMenu } from './AccountsMenu'

type Props = {
  actions?: React.ReactNode
  walletShown?: boolean
}

export const ContextActions: React.FC<Props> = ({ actions, walletShown }) => {
  return (
    <Shelf gap={2}>
      {actions && (
        <Box display={['none', 'block']}>
          <Shelf gap={1}>{actions}</Shelf>
        </Box>
      )}
      {walletShown && <AccountsMenu />}
    </Shelf>
  )
}
