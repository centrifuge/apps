import { Text, TextProps } from '@centrifuge/fabric'
import { encodeAddress } from '@polkadot/keyring'
import * as React from 'react'
import { copyToClipboard } from '../utils/copyToClipboard'
import { useIdentity } from '../utils/useIdentity'
import { truncateAddress } from '../utils/web3'

type Props = TextProps & {
  address: string
  clickToCopy?: boolean
}

export const Identity: React.FC<Props> = ({ address, clickToCopy, ...textProps }) => {
  const identity = useIdentity(address)
  const addr = encodeAddress(address, 2)
  return (
    <Text
      {...textProps}
      title={addr}
      style={{ cursor: clickToCopy ? 'copy' : undefined, wordBreak: 'break-word' }}
      onClick={clickToCopy ? () => copyToClipboard(addr) : undefined}
    >
      {identity?.display || truncateAddress(address)}
    </Text>
  )
}
