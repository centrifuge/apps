import { addressToHex } from '@centrifuge/centrifuge-js'
import { useCentrifugeApi, useCentrifugeQuery, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Box, Button, IconMinusCircle, NumberInput, Stack, Text } from '@centrifuge/fabric'
import { blake2AsHex } from '@polkadot/util-crypto'
import { FieldArray, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { map } from 'rxjs'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { DataTable } from '../../../components/DataTable'
import { FieldWithErrorMessage } from '../../../components/FieldWithErrorMessage'
import { Identity } from '../../../components/Identity'
import { PageSection } from '../../../components/PageSection'
import { usePoolAdmin } from '../../../utils/usePermissions'
import { positiveNumber } from '../../../utils/validation'
import { AddAddressInput } from '../Configuration/AddAddressInput'

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
    'Set oracle prices',
    (cent) => (args: [values: FormValues], options) => {
      const [values] = args
      const info = {
        valueLifetime: 60 * 60 * 24,
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
    validate(values) {
      const errors: any = {}
      if (values.feeders.length < values.minFeeders) {
        errors.feeders = 'Not enough feeders'
      }
    },
  })

  React.useEffect(() => {
    if (isEditing && !isLoading) return
    form.resetForm()
    form.setValues(initialValues, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues, isEditing])

  const rows = React.useMemo(() => form.values.feeders.map((a, i) => ({ address: a, index: i })), [form.values.feeders])

  return (
    <FormikProvider value={form}>
      <Form>
        <PageSection
          title="Oracle feeders"
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
            <Box width={200}>
              <FieldWithErrorMessage
                as={NumberInput}
                label="Minimum feeders"
                name="minFeeders"
                validate={positiveNumber()}
                disabled={!isEditing}
              />
            </Box>
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
          </Stack>
        </PageSection>
      </Form>
    </FormikProvider>
  )
}
