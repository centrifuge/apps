import * as React from 'react'
import { ExplainerCard } from '../styles'

interface Props {
  linkedAddresses: string[]
  connectedAddress: string
}

export const MultipleAddressesNotice: React.FC<Props> = ({ linkedAddresses, connectedAddress }) => {
  return (
    <ExplainerCard gap="xsmall">
      <strong>Multiple Ethereum addresses linked to Securitize account</strong>
      {linkedAddresses.map((addr) => (
        <React.Fragment key={addr}>
          {addr}
          <br />
        </React.Fragment>
      ))}
      {connectedAddress} (connected)
    </ExplainerCard>
  )
}
