import { isSameAddress } from '@centrifuge/centrifuge-js'
import { useCentrifugeUtils, useWallet } from '@centrifuge/centrifuge-react'
import { Flex, Shelf, Text, TextProps } from '@centrifuge/fabric'
import Identicon from '@polkadot/react-identicon'
import * as React from 'react'
import styled from 'styled-components'
import { copyToClipboard } from '../utils/copyToClipboard'
import { useAddress } from '../utils/useAddress'
import { useIdentity } from '../utils/useIdentity'
import { truncate } from '../utils/web3'

type Props = TextProps & {
  address: string
  showIcon?: boolean
  clickToCopy?: boolean
  labelForConnectedAddress?: boolean | string
}

const IdenticonWrapper = styled(Flex)({
  borderRadius: '50%',
  overflow: 'hidden',
  pointerEvents: 'none',
})

// TODO: Fix for when connected with a proxy
export const Identity: React.FC<Props> = ({
  showIcon,
  address,
  clickToCopy,
  labelForConnectedAddress = true,
  ...textProps
}) => {
  const identity = useIdentity(address)
  const myAddress = useAddress('substrate')
  const utils = useCentrifugeUtils()
  const { selectedAccount } = useWallet().substrate

  const addr = utils.formatAddress(address)
  const isMe = React.useMemo(() => isSameAddress(addr, myAddress), [addr, myAddress])
  const truncated = truncate(utils.formatAddress(address))
  const display = identity?.display || truncated
  const meLabel =
    !isMe || !labelForConnectedAddress
      ? display
      : labelForConnectedAddress === true && isSameAddress(selectedAccount?.address, address)
      ? selectedAccount?.name || display
      : labelForConnectedAddress

  const label = (
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

  if (showIcon) {
    return (
      <Shelf gap={2}>
        <IdenticonWrapper>
          <Identicon value={address} size={24} theme="polkadot" />
        </IdenticonWrapper>
        {label}
      </Shelf>
    )
  }
  return label
}
