import { addressToHex, isSameAddress } from '@centrifuge/centrifuge-js'
import { useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import { AddressInput, Button, Grid, Shelf, Text } from '@centrifuge/fabric'
import Identicon from '@polkadot/react-identicon'
import { useState } from 'react'
import { truncate } from '../../../utils/web3'

export function AddAddressInput({
  onAdd,
  existingAddresses,
}: {
  onAdd: (address: string) => void
  existingAddresses: string[]
}) {
  const [address, setAddress] = useState('')

  const utils = useCentrifugeUtils()
  let truncated: string | undefined
  try {
    truncated = truncate(utils.formatAddress(address))
  } catch (e) {
    truncated = undefined
  }

  const exists = !!truncated && existingAddresses.some((addr) => isSameAddress(addr, address))

  return (
    <Grid columns={2} equalColumns gap={4} alignItems="center">
      <AddressInput
        clearIcon
        placeholder="Search to add address..."
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      {address &&
        (truncated ? (
          <Shelf gap={2} alignItems="center">
            <Shelf style={{ pointerEvents: 'none' }} gap="4px">
              <Identicon value={address} size={16} theme="polkadot" />
              <Text variant="label2" color="textPrimary">
                {truncated}
              </Text>
            </Shelf>
            <Button
              variant="secondary"
              onClick={() => {
                onAdd(addressToHex(address))
                setAddress('')
              }}
              small
              disabled={exists}
            >
              Add address
            </Button>
            {exists && (
              <Text variant="label2" color="statusCritical">
                Already added
              </Text>
            )}
          </Shelf>
        ) : (
          <Text variant="label2" color="statusCritical">
            Invalid address
          </Text>
        ))}
    </Grid>
  )
}
