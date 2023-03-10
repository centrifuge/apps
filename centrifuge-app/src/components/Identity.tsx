import { isSameAddress } from '@centrifuge/centrifuge-js'
import { useCentrifuge, useWallet } from '@centrifuge/centrifuge-react'
import { Text, TextProps } from '@centrifuge/fabric'
import * as React from 'react'
import { copyToClipboard } from '../utils/copyToClipboard'
import { useAddress } from '../utils/useAddress'
import { useIdentity } from '../utils/useIdentity'
import { truncate } from '../utils/web3'

type Props = TextProps & {
  address: string
  clickToCopy?: boolean
  labelForConnectedAddress?: boolean | string
}

// TODO: Fix for when connected with a proxy
export const Identity: React.FC<Props> = ({ address, clickToCopy, labelForConnectedAddress = true, ...textProps }) => {
  const identity = useIdentity(address)
  const myAddress = useAddress('substrate')
  const cent = useCentrifuge()
  const { selectedAccount } = useWallet().substrate

  const addr = cent.utils.formatAddress(address)
  const isMe = React.useMemo(() => isSameAddress(addr, myAddress), [addr, myAddress])
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
