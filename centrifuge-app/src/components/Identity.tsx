import { isSameAddress } from '@centrifuge/centrifuge-js'
import { Text, TextProps } from '@centrifuge/fabric'
import React, { useMemo } from 'react'
import { copyToClipboard } from '../utils/copyToClipboard'
import { useAddress } from '../utils/useAddress'
import { useIdentity } from '../utils/useIdentity'
import { truncate } from '../utils/web3'
import { useCentrifuge } from './CentrifugeProvider'
import { useWeb3 } from './Web3Provider'

type Props = TextProps & {
  address: string
  clickToCopy?: boolean
  labelForConnectedAddress?: boolean | string
}

export const Identity: React.FC<Props> = ({ address, clickToCopy, labelForConnectedAddress = true, ...textProps }) => {
  const identity = useIdentity(address)
  const myAddress = useAddress()
  const cent = useCentrifuge()
  const { selectedAccount } = useWeb3()

  const addr = cent.utils.formatAddress(address)
  const isMe = useMemo(() => isSameAddress(addr, myAddress), [addr, myAddress])
  const truncated = truncate(cent.utils.formatAddress(address))
  const display = identity?.display || truncated
  const meLabel =
    !isMe || !labelForConnectedAddress
      ? display
      : labelForConnectedAddress === true && isSameAddress(selectedAccount?.address, address)
      ? selectedAccount?.name || display
      : labelForConnectedAddress

  return (
    <Text
      {...textProps}
      title={addr}
      style={{
        cursor: clickToCopy ? 'copy' : undefined,
        wordBreak: 'break-word',
        whiteSpace: 'normal',
      }}
      onClick={clickToCopy ? () => copyToClipboard(addr) : undefined}
    >
      {isMe ? meLabel : display}
    </Text>
  )
}
