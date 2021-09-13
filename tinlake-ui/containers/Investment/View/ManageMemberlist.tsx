import { FormField, Heading, TextInput } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import { Button } from '../../../components/Button'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { Card } from '../../../components/Card'
import { Stack, Wrap } from '../../../components/Layout'
import { useTinlake } from '../../../components/TinlakeProvider'
import { createTransaction, TransactionProps, useTransactionState } from '../../../ducks/transactions'
import { usePool } from '../../../utils/usePool'

const web3 = require('web3-utils')

interface Props extends TransactionProps {
  loadPool?: (tinlake: any) => Promise<void>
}

type Tranche = 'junior' | 'senior'

const getActionName = (tranche: Tranche) => (tranche === 'senior' ? 'updateSeniorMemberList' : 'updateJuniorMemberList')

const ManageMemberlist: React.FC<Props> = (props: Props) => {
  const tinlake = useTinlake()
  const pool = usePool(tinlake.contractAddresses.ROOT_CONTRACT)

  const [juniorAddress, setJuniorAddress] = React.useState('')
  const [seniorAddress, setSeniorAddress] = React.useState('')

  const [juniorStatus, , setJuniorTxId] = useTransactionState()
  const [seniorStatus, , setSeniorTxId] = useTransactionState()

  const add = async (tranche: Tranche) => {
    const address = tranche === 'senior' ? seniorAddress : juniorAddress

    const validUntilDate = new Date()
    validUntilDate.setFullYear(validUntilDate.getFullYear() + 100)

    const validUntil = Math.round(validUntilDate.getTime() / 1000)

    const description = `Add ${address.substring(0, 8)}... to ${tranche === 'senior' ? 'DROP' : 'TIN'}`

    const txId = await props.createTransaction(description, getActionName(tranche), [tinlake, address, validUntil])

    if (tranche === 'senior') setSeniorTxId(txId)
    else setJuniorTxId(txId)
  }

  const remove = async (tranche: Tranche) => {
    const address = tranche === 'senior' ? seniorAddress : juniorAddress

    const date = new Date()
    /*
     * minimum delay is 7 days: https://github.com/centrifuge/tinlake/blob/v0.3.0/src/lender/token/memberlist.sol#L23
     * so need to add 8 days from today
     */
    date.setDate(date.getDate() + 8)

    const validUntil = Math.round(date.getTime() / 1000)

    const description = `Remove ${address.substring(0, 8)}... from ${tranche === 'senior' ? 'DROP' : 'TIN'}`

    const txId = await props.createTransaction(description, getActionName(tranche), [tinlake, address, validUntil])

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
      {pool.data && (
        <Wrap gap="medium">
          <Card width="400px" p="medium">
            <Stack gap="small">
              <Heading level="5" margin={'0'}>
                Add/Remove TIN member
              </Heading>

              <FormField label="Address">
                <TextInput
                  value={juniorAddress}
                  placeholder="0x..."
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setJuniorAddress(event.currentTarget.value)
                  }}
                />
              </FormField>

              <ButtonGroup>
                <Button
                  secondary
                  label="Remove"
                  onClick={() => {
                    remove('junior')
                  }}
                  disabled={!juniorAddress || !web3.isAddress(juniorAddress)}
                />
                <Button
                  primary
                  label="Add"
                  onClick={() => {
                    add('junior')
                  }}
                  disabled={!juniorAddress || !web3.isAddress(juniorAddress)}
                />
              </ButtonGroup>
            </Stack>
          </Card>

          <Card width="400px" p="medium">
            <Stack gap="small">
              <Heading level="5" margin={'0'}>
                Add/Remove DROP member
              </Heading>

              <FormField label="Address">
                <TextInput
                  value={seniorAddress}
                  placeholder="0x..."
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setSeniorAddress(event.currentTarget.value)
                  }}
                />
              </FormField>

              <ButtonGroup>
                <Button
                  secondary
                  label="Remove"
                  onClick={() => {
                    remove('senior')
                  }}
                  disabled={!seniorAddress || !web3.isAddress(seniorAddress)}
                />
                <Button
                  primary
                  label="Add"
                  onClick={() => {
                    add('senior')
                  }}
                  disabled={!seniorAddress || !web3.isAddress(seniorAddress)}
                />
              </ButtonGroup>
            </Stack>
          </Card>
        </Wrap>
      )}
    </>
  )
}

export default connect((state) => state, { createTransaction })(ManageMemberlist)
