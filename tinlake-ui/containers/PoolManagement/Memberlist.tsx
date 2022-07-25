import { AgreementsStatus } from '@centrifuge/onboarding-api/src/controllers/types'
import { Box, Button, FormField, Heading, Table, TableBody, TableCell, TableRow, TextInput } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import { Card } from '../../components/Card'
import { useTinlake } from '../../components/TinlakeProvider'
import { Pool } from '../../config'
import { createTransaction, TransactionProps, useTransactionState } from '../../ducks/transactions'
import { useOnboardingState } from '../../utils/useOnboardingState'
import { usePool } from '../../utils/usePool'
const web3 = require('web3-utils')

interface Props extends TransactionProps {
  activePool: Pool
}

type Tranche = 'junior' | 'senior'

const getActionName = (tranche: Tranche) => (tranche === 'senior' ? 'updateSeniorMemberList' : 'updateJuniorMemberList')

const ManageMemberlist: React.FC<Props> = (props: Props) => {
  const tinlake = useTinlake()
  const { data: poolData } = usePool(tinlake.contractAddresses.ROOT_CONTRACT)

  const [onboardingAddress, setOnboardingAddress] = React.useState(undefined as string | undefined)
  const { data: onboardingData, isError: onboardingError } = useOnboardingState(
    props.activePool,
    undefined,
    onboardingAddress && web3.isAddress(onboardingAddress) ? onboardingAddress : undefined
  )

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
      {poolData && (
        <Box>
          <Box direction="row" gap="medium">
            <Card width="400px" p="medium" mb="medium">
              <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
                <Heading level="5" margin={'0'}>
                  Add/Remove DROP investor
                </Heading>
              </Box>

              <FormField label="Address">
                <TextInput
                  value={seniorAddress}
                  placeholder="0x..."
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setSeniorAddress(event.currentTarget.value)
                  }}
                />
              </FormField>

              <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
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
              </Box>
            </Card>
            <Card width="400px" p="medium" mb="medium">
              <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
                <Heading level="5" margin={'0'}>
                  Add/Remove TIN investor
                </Heading>
              </Box>

              <FormField label="Address">
                <TextInput
                  value={juniorAddress}
                  placeholder="0x..."
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setJuniorAddress(event.currentTarget.value)
                  }}
                />
              </FormField>

              <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
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
              </Box>
            </Card>
          </Box>
          <Card width="400px" p="medium" mb="medium">
            <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
              <Heading level="5" margin={'0'}>
                Check investor onboarding status
              </Heading>
            </Box>

            <FormField label="Address">
              <TextInput
                value={onboardingAddress}
                placeholder="0x..."
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setOnboardingAddress(event.currentTarget.value)
                }}
              />
            </FormField>

            {onboardingAddress && web3.isAddress(onboardingAddress) && onboardingData && onboardingData?.kyc && (
              <Table margin={{ top: 'small' }}>
                <TableBody>
                  <TableRow>
                    <TableCell>KYC status</TableCell>
                    <TableCell>{onboardingData.kyc.status}</TableCell>
                  </TableRow>
                  {onboardingData.kyc.isUsaTaxResident && (
                    <TableRow>
                      <TableCell>Accreditation passed</TableCell>
                      <TableCell>{onboardingData.kyc.accredited ? 'yes' : 'no'}</TableCell>
                    </TableRow>
                  )}
                  {onboardingData.agreements.map((agreement: AgreementsStatus, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{agreement.name}</TableCell>
                      <TableCell>
                        {agreement.counterSigned
                          ? 'completed'
                          : agreement.signed
                          ? 'awaiting issuer signature'
                          : agreement.declined
                          ? 'declined'
                          : agreement.voided
                          ? 'voided'
                          : 'awaiting investor signature'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {onboardingError && 'Not found'}
          </Card>
        </Box>
      )}
    </>
  )
}

export default connect((state) => state, { createTransaction })(ManageMemberlist)
