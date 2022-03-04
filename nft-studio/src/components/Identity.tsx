import { Text, TextProps } from '@centrifuge/fabric'
import { encodeAddress } from '@polkadot/keyring'
import * as React from 'react'
import { copyToClipboard } from '../utils/copyToClipboard'
import { useIdentity } from '../utils/useIdentity'
import { truncateAddress } from '../utils/web3'
import { useWeb3 } from './Web3Provider'

type Props = TextProps & {
  address: string
  clickToCopy?: boolean
}

export const Identity: React.FC<Props> = ({ address, clickToCopy, ...textProps }) => {
  const { data: identity } = useIdentity(address)
  const { selectedAccount } = useWeb3()
  const addr = encodeAddress(address, 2)
  const isMe = selectedAccount?.address && encodeAddress(selectedAccount?.address, 2) === addr

  return (
    <Text
      {...textProps}
      title={addr}
      style={{ cursor: clickToCopy ? 'copy' : undefined, wordBreak: 'break-word' }}
      onClick={clickToCopy ? () => copyToClipboard(addr) : undefined}
    >
      {isMe ? 'me' : identity?.display || truncateAddress(address)}
    </Text>
  )
}
