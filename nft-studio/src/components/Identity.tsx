import { isSameAddress } from '@centrifuge/centrifuge-js'
import { Text, TextProps } from '@centrifuge/fabric'
import { encodeAddress } from '@polkadot/keyring'
import React, { useMemo } from 'react'
import { copyToClipboard } from '../utils/copyToClipboard'
import { useAddress } from '../utils/useAddress'
import { useIdentity } from '../utils/useIdentity'
import { truncateAddress } from '../utils/web3'

type Props = TextProps & {
  address: string
  clickToCopy?: boolean
}

export const Identity: React.FC<Props> = ({ address, clickToCopy, ...textProps }) => {
  const { data: identity } = useIdentity(address)
  const myAddress = useAddress()
  const addr = encodeAddress(address, 2)
  const isMe = useMemo(() => isSameAddress(addr, myAddress), [addr, myAddress])

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
      {isMe ? 'me' : identity?.display || truncateAddress(address)}
    </Text>
  )
}
