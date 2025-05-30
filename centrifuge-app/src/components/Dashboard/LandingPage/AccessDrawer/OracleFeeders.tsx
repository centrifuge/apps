import Centrifuge, { addressToHex, PoolMetadata } from '@centrifuge/centrifuge-js'
import {
  CombinedSubstrateAccount,
  useCentEvmChainId,
  useCentrifugeApi,
  useCentrifugeQuery,
  wrapProxyCallsForAccount,
} from '@centrifuge/centrifuge-react'
import { Box, Card, IconButton, IconTrash, Select, Stack, Text } from '@centrifuge/fabric'
import { blake2AsHex } from '@polkadot/util-crypto'
import { Field, FieldArray, FieldProps, useFormikContext } from 'formik'
import * as React from 'react'
import { map } from 'rxjs'
import type { FormHandle } from '.'
import { FormAddressInput } from '../../../../pages/IssuerCreatePool/FormAddressInput'
import { AddButton } from '../../../../pages/IssuerCreatePool/PoolDetailsSection'
import { address, combine, min, positiveNumber, required } from '../../../../utils/validation'

export type FeedersFormValues = {
  feeders: string[]
  minFeeders: number
}

export function OracleFeeders({
  poolId,
  handle,
  account,
}: {
  poolId: string
  handle: React.RefObject<FormHandle>
  account: CombinedSubstrateAccount
}) {
  const chainId = useCentEvmChainId()
  const form = useFormikContext<FeedersFormValues>()

  const api = useCentrifugeApi()
  const [storedInfo] = useCentrifugeQuery(['oracleCollectionInfo', poolId], () =>
    api.query.oraclePriceCollection.collectionInfo(poolId).pipe(
      map((data) => {
        const info = data.toPrimitive() as any
        const feeders = info.feeders
          .filter((f: any) => !!f.system.signed)
          .map((f: any) => addressToHex(f.system.signed))
        return {
          minFeeders: info.minFeeders as number,
          feeders,
        }
      })
    )
  )

  const initialValues = React.useMemo(
    () => ({
      feeders: storedInfo?.feeders.length ? storedInfo.feeders : [''],
      minFeeders: storedInfo?.minFeeders || 1,
    }),
    [storedInfo]
  )

  function checkHasChanges(values: FeedersFormValues) {
    const oldFeeders = new Set(initialValues.feeders)
    return (
      values.minFeeders !== initialValues.minFeeders ||
      values.feeders.some((addr) => !oldFeeders.has(addr)) ||
      oldFeeders.size !== values.feeders.length
    )
  }

  async function getBatch(_: Centrifuge, values: FeedersFormValues, metadata: PoolMetadata) {
    const hasChanges = checkHasChanges(values)

    if (!hasChanges) return { batch: [], metadata }

    const info = {
      minFeeders: values.minFeeders,
      feeders: values.feeders.map((address) => ({ system: { Signed: address } })),
    }
    const change = api.createType('RuntimeCommonChangesRuntimeChange', {
      OracleCollection: { CollectionInfo: info },
    })
    return {
      batch: [
        wrapProxyCallsForAccount(
          api,
          api.tx.utility.batchAll([
            api.tx.oraclePriceCollection.proposeUpdateCollectionInfo(poolId, info),
            api.tx.oraclePriceCollection.applyUpdateCollectionInfo(poolId, blake2AsHex(change.toU8a(), 256)),
            api.tx.oraclePriceCollection.updateCollection(poolId),
          ]),
          account,
          undefined
        ),
      ],
      metadata,
    }
  }

  React.useImperativeHandle(handle, () => ({
    getBatch,
    hasChanges: checkHasChanges,
  }))

  React.useEffect(() => {
    form.setFieldValue('feeders', initialValues.feeders, false)
    form.setFieldValue('minFeeders', initialValues.minFeeders, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues])

  // Use useEffect to update threshold value when signers array changes
  React.useEffect(() => {
    if (form.values.feeders.length > 0 && form.values.minFeeders === 0) {
      form.setFieldValue('minFeeders', 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.feeders, form.values.minFeeders])

  return (
    <Card variant="secondary" px={2} py={3}>
      <Stack gap={2}>
        <Text variant="body2" color="textSecondary">
          Add or remove addresses that can: <br />
          <Text color="textPrimary">
            <b>provide oracle pricing updates</b> for the onchain NAV*
          </Text>
        </Text>
        <FieldArray name="feeders">
          {({ push, remove }) => (
            <Stack gap={2}>
              {form.values.feeders?.map((_, index) => (
                <Field name={`feeders.${index}`} validate={combine(address(), index === 0 ? () => '' : required())}>
                  {({ field }: FieldProps) => {
                    return (
                      <FormAddressInput
                        key={field.name}
                        name={`feeders.${index}`}
                        placeholder="Enter address..."
                        chainId={chainId}
                        symbol={
                          index >= 1 && (
                            <IconButton onClick={() => remove(index)}>
                              <IconTrash color="textSecondary" />
                            </IconButton>
                          )
                        }
                      />
                    )
                  }}
                </Field>
              ))}
              <Box>
                <AddButton
                  variant="inverted"
                  onClick={() => {
                    if (form.values.feeders?.length <= 10) {
                      push('')
                    }
                  }}
                />
              </Box>
            </Stack>
          )}
        </FieldArray>
        <Box>
          <Field name="minFeeders" validate={combine(positiveNumber(), min(1, `Needs at least 1 provider`))}>
            {({ field, form }: FieldProps) => (
              <Select
                label="How many addresses are needed to update asset pricing for the onchain NAV*"
                name="minFeeders"
                onChange={(event) => form.setFieldValue('minFeeders', Number(event.target.value))}
                onBlur={field.onBlur}
                value={field.value}
                options={form.values.feeders.map((_: any, i: number) => ({
                  value: `${i + 1}`,
                  label: `${i + 1}`,
                }))}
                placeholder="Select..."
              />
            )}
          </Field>
        </Box>
      </Stack>
    </Card>
  )
}
