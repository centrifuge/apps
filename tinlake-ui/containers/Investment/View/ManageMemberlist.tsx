import * as React from 'react'
import { Box, Button, TextInput, Heading, FormField } from 'grommet'
import { ITinlake } from '@centrifuge/tinlake-js'
import { connect, useSelector } from 'react-redux'
const web3 = require('web3-utils')

import { loadPool, PoolState } from '../../../ducks/pool'
import { createTransaction, useTransactionState, TransactionProps } from '../../../ducks/transactions'

interface Props extends TransactionProps {
  tinlake: ITinlake
  loadPool?: (tinlake: any) => Promise<void>
}

const ManageMemberlist: React.FC<Props> = (props: Props) => {
  const pool = useSelector<any, PoolState>((state) => state.pool)

  const [juniorAddress, setJuniorAddress] = React.useState('')
  const [seniorAddress, setSeniorAddress] = React.useState('')

  const [juniorStatus, , setJuniorTxId] = useTransactionState()
  const [seniorStatus, , setSeniorTxId] = useTransactionState()

  const save = async (tranche: 'senior' | 'junior') => {
    const address = tranche === 'senior' ? seniorAddress : juniorAddress

    const validUntilDate = new Date()
    validUntilDate.setFullYear(validUntilDate.getFullYear() + 100)

    const validUntil = Math.round(validUntilDate.getTime() / 1000)

    const txId = await props.createTransaction(
      `Add ${address.substring(0, 8)}... to ${tranche === 'senior' ? 'DROP' : 'TIN'}`,
      tranche === 'senior' ? 'updateSeniorMemberList' : 'updateJuniorMemberList',
      [props.tinlake, address, validUntil]
    )

    if (tranche === 'senior') setSeniorTxId(txId)
    else setJuniorTxId(txId)
  }

  React.useEffect(() => {
    if (juniorStatus === 'succeeded') {
      setJuniorAddress('')
    }
  }, [juniorStatus])

  React.useEffect(() => {
    if (seniorStatus === 'succeeded') {
      setSeniorAddress('')
    }
  }, [seniorStatus])

  return (
    <>
      {pool && pool.data && (
        <Box direction="row" gap="medium">
          <Box width="medium" pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'medium' }}>
            <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
              <Heading level="5" margin={'0'}>
                Add TIN member
              </Heading>
            </Box>

            <FormField label="Address">
              <TextInput
                value={juniorAddress}
                placeholder="0x..."
                onChange={(event: any) => {
                  setJuniorAddress(event.currentTarget.value)
                }}
              />
            </FormField>

            <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
              <Button
                primary
                label="Add"
                onClick={() => {
                  save('junior')
                }}
                disabled={!juniorAddress || !web3.isAddress(juniorAddress)}
              />
            </Box>
          </Box>

          <Box width="medium" pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'medium' }}>
            <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
              <Heading level="5" margin={'0'}>
                Add DROP member
              </Heading>
            </Box>

            <FormField label="Address">
              <TextInput
                value={seniorAddress}
                placeholder="0x..."
                onChange={(event: any) => {
                  setSeniorAddress(event.currentTarget.value)
                }}
              />
            </FormField>

            <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
              <Button
                primary
                label="Add"
                onClick={() => {
                  save('senior')
                }}
                disabled={!seniorAddress || !web3.isAddress(seniorAddress)}
              />
            </Box>
          </Box>
        </Box>
      )}
    </>
  )
}

export default connect((state) => state, { loadPool, createTransaction })(ManageMemberlist)
