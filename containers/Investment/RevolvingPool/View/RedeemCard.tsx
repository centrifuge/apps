import * as React from 'react'
import { Box, Button } from 'grommet'
import { TokenInput } from '@centrifuge/axis-token-input'
import { Pool } from '../../../../config'

import { Description } from './styles'
import { Card } from './TrancheOverview'

interface Props {
  pool: Pool
  tranche: 'senior' | 'junior'
  setCard: (card: Card) => void
}

const RedeemCard: React.FC<Props> = (props: Props) => {
  const token = props.tranche === 'senior' ? 'DROP' : 'TIN'
  const [daiValue, setDaiValue] = React.useState('234000000000000000')

  return (
    <Box>
      <Description margin={{ top: 'medium' }}>
        Please set the amount of DAI you want to invest into {token} on Tinlake. Your DAI will be locked until the end
        of the epoch, at which point your order will be executed. You can collect your {token} in the next epoch.
      </Description>

      <TokenInput
        token="DAI"
        value={daiValue}
        maxValue="1230000000000000000"
        onChange={(newValue: string) => setDaiValue(newValue)}
      />

      <Box gap="small" justify="end" direction="row" margin={{ top: 'medium' }}>
        <Button label="Cancel" onClick={() => props.setCard('home')} />
        <Button primary label={`Lock ${token}`} />
      </Box>
    </Box>
  )
}

export default RedeemCard
