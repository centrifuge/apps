import * as React from 'react'
import { Box, Button, TextInput, Select, Heading, FormField } from 'grommet'
import { ITinlake as ITinlakeV3 } from '@centrifuge/tinlake-js-v3'
import { connect, useSelector } from 'react-redux'
const web3 = require('web3-utils')

import { loadPool, PoolState } from '../../../../ducks/pool'
import { createTransaction, useTransactionState, TransactionProps } from '../../../../ducks/transactions'

interface Props extends TransactionProps {
  tinlake: ITinlakeV3
  loadPool?: (tinlake: any) => Promise<void>
}

const ManageMemberlist: React.FC<Props> = (props: Props) => {
  const pool = useSelector<any, PoolState>((state) => state.pool)

  const [juniorAddress, setJuniorAddress] = React.useState('')
  const [juniorValidFor, setJuniorValidFor] = React.useState('1 year')

  const [seniorAddress, setSeniorAddress] = React.useState('')
  const [seniorValidFor, setSeniorValidFor] = React.useState('1 year')

  const [juniorStatus, , setJuniorTxId] = useTransactionState()
  const [seniorStatus, , setSeniorTxId] = useTransactionState()

  const save = async (tranche: 'senior' | 'junior') => {
    const address = tranche === 'senior' ? seniorAddress : juniorAddress
    const validFor = tranche === 'senior' ? seniorValidFor : juniorValidFor

    let validUntil = new Date()
    if (validFor === '1 month') validUntil.setMonth(validUntil.getMonth() + 1)
    if (validFor === '3 months') validUntil.setMonth(validUntil.getMonth() + 3)
    if (validFor === '1 year') validUntil.setFullYear(validUntil.getFullYear() + 1)
    if (validFor === 'Disabled') validUntil.setFullYear(validUntil.getFullYear() - 1)

    const txId = await props.createTransaction(
      `Update ${tranche === 'senior' ? 'DROP' : 'TIN'} member  ${juniorAddress.substring(0, 8)}...`,
      tranche === 'senior' ? 'updateSeniorMemberList' : 'updateJuniorMemberList',
      [props.tinlake, address, validUntil.getTime() / 1000]
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
                Update TIN member
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
              <Box>
                <Select
                  placeholder="Valid for ..."
                  options={['1 month', '3 months', '1 year', 'Disabled']}
                  onChange={(event: any) => {
                    setJuniorValidFor(event.target.value)
                  }}
                  plain
                />
              </Box>
              <Button
                primary
                label="Update"
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
                Update DROP member
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
              <Box>
                <Select
                  placeholder="Valid for ..."
                  options={['1 month', '3 months', '1 year', 'Disabled']}
                  value={seniorValidFor}
                  onChange={(event: any) => {
                    setSeniorValidFor(event.target.value)
                  }}
                  plain
                />
              </Box>
              <Button
                primary
                label="Update"
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
