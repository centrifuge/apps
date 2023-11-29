import { useBalances } from '@centrifuge/centrifuge-react'
import { Shelf, Stack, Text } from '@centrifuge/fabric'
import { formatBalance } from '../../utils/formatting'
import { LabelValueStack } from '../LabelValueStack'
import { Tooltips } from '../Tooltips'

type CFGHoldingsProps = {
  address: string
}

export const CFGTransfer = ({ address }: CFGHoldingsProps) => {
  const centBalances = useBalances(address)

  return (
    <Stack gap={2}>
      <Text textAlign="center" variant="heading2">
        CFG Holdings
      </Text>
      <Shelf gap={3} alignItems="flex-start" justifyContent="flex-start">
        <LabelValueStack
          label="Position"
          value={formatBalance(centBalances?.native.balance || 0, centBalances?.native.currency.symbol, 2)}
        />
        <LabelValueStack
          label="Value"
          // TODO: multiply value with toke price
          value={formatBalance(centBalances?.native.balance.toDecimal().mul(0.45) || 0, 'USD', 2)}
        />
        <LabelValueStack label={<Tooltips type="cfgPrice" />} value={formatBalance(0.45 || 0, 'USD', 2)} />
      </Shelf>
    </Stack>
  )
}
