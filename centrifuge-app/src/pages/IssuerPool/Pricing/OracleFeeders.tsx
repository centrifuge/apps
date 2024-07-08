import { addressToHex } from '@centrifuge/centrifuge-js'
import { useCentrifugeApi, useCentrifugeQuery, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Box, Button, IconMinusCircle, Stack, Text } from '@centrifuge/fabric'
import { blake2AsHex } from '@polkadot/util-crypto'
import { FieldArray, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { map } from 'rxjs'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { DataTable } from '../../../components/DataTable'
import { Identity } from '../../../components/Identity'
import { PageSection } from '../../../components/PageSection'
import { usePoolAdmin } from '../../../utils/usePermissions'
import { positiveNumber } from '../../../utils/validation'
import { ChangeThreshold } from '../Access/ChangeTreshold'
import { AddAddressInput } from '../Configuration/AddAddressInput'
import { WriteOffGroups } from '../Configuration/WriteOffGroups'

type FormValues = {
  feeders: string[]
  minFeeders: number
}

type Row = {
  address: string
  index: number
}

export function OracleFeeders({ poolId }: { poolId: string }) {
  const admin = usePoolAdmin(poolId)
  const [isEditing, setIsEditing] = React.useState(false)

  const api = useCentrifugeApi()
  const { execute, isLoading } = useCentrifugeTransaction(
    'Set oracle providers',
    (cent) => (args: [values: FormValues], options) => {
      const [values] = args
      const info = {
        minFeeders: values.minFeeders,
        feeders: values.feeders.map((addr) => ({ system: { Signed: addr } })),
      }
      const change = api.createType('RuntimeCommonChangesRuntimeChange', {
        OracleCollection: { CollectionInfo: info },
      })
      const tx = api.tx.utility.batchAll([
        api.tx.oraclePriceCollection.proposeUpdateCollectionInfo(poolId, info),
        api.tx.oraclePriceCollection.applyUpdateCollectionInfo(poolId, blake2AsHex(change.toU8a(), 256)),
      ])
      return cent.wrapSignAndSend(api, tx, options)
    }
  )

  const [storedInfo] = useCentrifugeQuery(['oracleCollectionInfo', poolId], () =>
    api.query.oraclePriceCollection.collectionInfo(poolId).pipe(
      map((data) => {
        const info = data.toPrimitive() as any
        return {
          valueLifetime: info.valueLifetime as number,
          minFeeders: info.minFeeders as number,
          feeders: info.feeders.filter((f: any) => !!f.system.signed).map((f: any) => addressToHex(f.system.signed)),
        }
      })
    )
  )

  const initialValues = React.useMemo(
    () =>
      storedInfo ?? {
        feeders: [],
        minFeeders: 1,
      },
    [storedInfo]
  )

  const form = useFormik<FormValues>({
    initialValues,
    onSubmit(values, actions) {
      execute([values], { account: admin })
      actions.setSubmitting(false)
    },
  })

  React.useEffect(() => {
    if (isEditing && !isLoading) return
    form.resetForm()
    form.setValues(initialValues, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues, isEditing])

  // Use useEffect to update threshold value when signers array changes
  React.useEffect(() => {
    if (form.values.feeders.length > 0 && form.values.minFeeders === 0) {
      form.setFieldValue('minFeeders', 1)
    }
  }, [form.values.feeders, form.values.minFeeders, form.setFieldValue])

  const rows = React.useMemo(() => form.values.feeders.map((a, i) => ({ address: a, index: i })), [form.values.feeders])

  return (
    <Box>
      <FormikProvider value={form}>
        <Form>
          <PageSection
            title="Oracle providers"
            headerRight={
              isEditing ? (
                <ButtonGroup variant="small">
                  <Button variant="secondary" onClick={() => setIsEditing(false)} small>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    small
                    loading={isLoading}
                    loadingMessage={isLoading ? 'Pending...' : undefined}
                    key="done"
                    disabled={!admin}
                  >
                    Done
                  </Button>
                </ButtonGroup>
              ) : (
                <Button variant="secondary" onClick={() => setIsEditing(true)} small key="edit">
                  Edit
                </Button>
              )
            }
          >
            <Stack gap={2}>
              <Text as="p" variant="body2" color="textSecondary">
                Add or remove addresses that can provide oracle updates for the onchain NAV.
              </Text>
              <FieldArray name="feeders">
                {(fldArr) => (
                  <Stack gap={3}>
                    <DataTable
                      data={rows}
                      columns={[
                        {
                          align: 'left',
                          header: 'Address(es)',
                          cell: (row: Row) => (
                            <Text variant="body2">
                              <Identity address={row.address} clickToCopy showIcon labelForConnectedAddress={false} />
                            </Text>
                          ),
                        },
                        {
                          header: '',
                          cell: (row: Row) =>
                            isEditing && (
                              <Button
                                variant="tertiary"
                                icon={IconMinusCircle}
                                onClick={() => fldArr.remove(row.index)}
                                disabled={isLoading}
                              />
                            ),
                          width: '72px',
                        },
                      ]}
                    />
                    {isEditing && !isLoading && (
                      <AddAddressInput
                        existingAddresses={form.values.feeders}
                        onAdd={(address) => {
                          fldArr.push(addressToHex(address))
                        }}
                      />
                    )}
                  </Stack>
                )}
              </FieldArray>
              <Box>
                <ChangeThreshold
                  primaryText="Oracle update threshold"
                  secondaryText="Determine how many oracle providers are required before a pricing update is finalized and will become reflected in the NAV."
                  isEditing={isEditing}
                  fieldName="minFeeders"
                  signersFieldName="feeders"
                  validate={positiveNumber()}
                  disabled={!isEditing}
                  minThreshold={1}
                  type="providers"
                />
              </Box>
            </Stack>
          </PageSection>
        </Form>
      </FormikProvider>
      <WriteOffGroups />
    </Box>
  )
}
