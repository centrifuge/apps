import { Button, TextInput } from 'grommet'
import * as React from 'react'

interface Props {
  onUpdate: (addr: string) => void
}

const UpdateCentAddr: React.FC<Props> = (props: Props) => {
  const [addr, setAddr] = React.useState('')

  const onCentAddrChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = event.currentTarget.value
    setAddr(val)
    // await getNFT(registry, currentTokenId)

    // TODO validate address

    // TODO load additional data for address
  }

  const onSubmit = () => {
    props.onUpdate(addr)
  }

  return (
    <div>
      Set your Cetrifuge Chain Address:
      <TextInput value={addr} onChange={onCentAddrChange} />
      <Button
        onClick={onSubmit}
        primary
        label="Set address"
        // disabled={!nft || status === 'unconfirmed' || status === 'pending'}
      />
    </div>
  )
}

export default UpdateCentAddr
