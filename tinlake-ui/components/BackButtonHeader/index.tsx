import { Button } from 'grommet'
import { LinkPrevious } from 'grommet-icons'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { clear, ensureAuthed, useAuth } from '../../ducks/auth'
import { selectWalletTransactions, TransactionState } from '../../ducks/transactions'
import { getAddressLink } from '../../utils/etherscanLinkGenerator'
import { useAddress } from '../../utils/useAddress'
import { Box, Shelf } from '../Layout'
import { Web3Wallet } from '../Web3Wallet'

export const BackButtonHeader: React.FC = () => {
  const router = useRouter()
  const address = useAddress()
  const dispatch = useDispatch()
  const auth = useAuth()
  const transactions = useSelector<any, TransactionState>((state) => state.transactions)

  const connectAccount = async () => {
    try {
      await dispatch(ensureAuthed())
    } catch (e) {
      console.error(`authentication failed with Error ${e}`)
    }
  }

  const { network, providerName } = auth!

  return (
    <Shelf position="sticky" top={0} height={56} zIndex={6} justifyContent="space-between" px={[12, 24]}>
      <BackLink onClick={() => router.back()} gap="xsmall">
        <LinkPrevious style={{ cursor: 'pointer' }} />
        <span>Back</span>
      </BackLink>
      <Box>
        {address ? (
          <Web3Wallet
            address={address}
            providerName={providerName!}
            networkName={network}
            onDisconnect={() => dispatch(clear())}
            transactions={selectWalletTransactions(transactions)}
            getAddressLink={getAddressLink}
          />
        ) : (
          <Button onClick={connectAccount} label="Connect" />
        )}
      </Box>
    </Shelf>
  )
}

const BackLink = styled(Shelf)`
  font-size: 16px;
  font-weight: 500;

  > svg {
    width: 18px;
    height: 18px;
  }
`
