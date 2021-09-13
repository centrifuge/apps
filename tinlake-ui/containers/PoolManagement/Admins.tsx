import { ITinlake } from '@centrifuge/tinlake-js'
import { Box, Button, FormField, Heading, TextInput } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import { Card } from '../../components/Card'
import { createTransaction, TransactionProps, useTransactionState } from '../../ducks/transactions'
import { usePool } from '../../utils/usePool'
const web3 = require('web3-utils')

interface Props extends TransactionProps {
  tinlake: ITinlake
}

const Admins: React.FC<Props> = (props: Props) => {
  const { data: poolData } = usePool(props.tinlake.contractAddresses.ROOT_CONTRACT)

  const [level1Address, setLevel1Address] = React.useState('')
  const [level2Address, setLevel2Address] = React.useState('')

  const [juniorStatus, ,] = useTransactionState()
  const [seniorStatus, ,] = useTransactionState()

  const add = async (level: number) => {
    console.log(level)
  }

  React.useEffect(() => {
    if (juniorStatus === 'succeeded') {
      setLevel1Address('')
    }
  }, [juniorStatus])

  React.useEffect(() => {
    if (seniorStatus === 'succeeded') {
      setLevel2Address('')
    }
  }, [seniorStatus])

  return (
    <>
      {poolData && (
        <Box direction="row" gap="medium">
          <Card width="400px" p="medium" mb="medium">
            <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
              <Heading level="5" margin={'0'}>
                Add level 1 admin
              </Heading>
            </Box>

            <FormField label="Address">
              <TextInput
                value={level1Address}
                placeholder="0x..."
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setLevel1Address(event.currentTarget.value)
                }}
                disabled={!poolData?.adminLevel || poolData.adminLevel < 3}
              />
            </FormField>

            <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
              <Button
                primary
                label="Add"
                onClick={() => {
                  add(1)
                }}
                disabled={!level1Address || !web3.isAddress(level1Address)}
              />
            </Box>
          </Card>
          <Card width="400px" p="medium" mb="medium">
            <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
              <Heading level="5" margin={'0'}>
                Add level 2 admin
              </Heading>
            </Box>

            <FormField label="Address">
              <TextInput
                value={level2Address}
                placeholder="0x..."
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setLevel2Address(event.currentTarget.value)
                }}
                disabled={!poolData?.adminLevel || poolData.adminLevel < 3}
              />
            </FormField>

            <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
              <Button
                primary
                label="Add"
                onClick={() => {
                  add(2)
                }}
                disabled={!level2Address || !web3.isAddress(level2Address)}
              />
            </Box>
          </Card>
        </Box>
      )}
    </>
  )
}

export default connect((state) => state, { createTransaction })(Admins)
