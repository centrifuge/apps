import { useWallet } from '@centrifuge/centrifuge-react'
import { useGetExplorerUrl } from '@centrifuge/centrifuge-react/dist/components/WalletProvider/utils'
import { AnchorButton, Box, IconArrowUpRight } from '@centrifuge/fabric'
import * as React from 'react'
import { useAddress } from '../../utils/useAddress'

export const TransactionsLink: React.FC = () => {
  const address = useAddress()
  const explorer = useGetExplorerUrl(useWallet().connectedNetwork!)
  const url = explorer.address(address!)
  return url ? (
    <Box alignSelf="flex-end">
      <AnchorButton
        variant="tertiary"
        iconRight={IconArrowUpRight}
        href={explorer.address(address!)}
        target="_blank"
        small
      >
        Transactions
      </AnchorButton>
    </Box>
  ) : null
}
