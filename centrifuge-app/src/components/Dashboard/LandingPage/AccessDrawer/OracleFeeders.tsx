import Centrifuge, { addressToHex, PoolMetadata } from '@centrifuge/centrifuge-js'
import {
  CombinedSubstrateAccount,
  useCentEvmChainId,
  useCentrifugeApi,
  useCentrifugeQuery,
  wrapProxyCallsForAccount,
} from '@centrifuge/centrifuge-react'
import { AddressInput, Box, Card, Flex, IconTrash, Stack, Text } from '@centrifuge/fabric'
import { blake2AsHex } from '@polkadot/util-crypto'
import { Field, FieldArray, FieldProps, useFormikContext } from 'formik'
import * as React from 'react'
import { map } from 'rxjs'
import type { FormHandle } from '.'
import { AddButton } from '../../../../pages/IssuerCreatePool/PoolDetailsSection'
import { address, combine, positiveNumber, required } from '../../../../utils/validation'
import { ChangeThreshold } from './ChangeTreshold'

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
      minFeeders: storedInfo?.feeders ?? 1,
    }),
    [storedInfo]
  )

  console.log('🚀 ~ initialValues:', initialValues, storedInfo)

  async function getBatch(_: Centrifuge, values: FeedersFormValues, metadata: PoolMetadata) {
    const oldFeeders = new Set(initialValues.feeders)
    const hasChanges =
      values.minFeeders !== initialValues.minFeeders ||
      values.feeders.some((addr) => !oldFeeders.has(addr)) ||
      oldFeeders.size !== values.feeders.length

    if (!hasChanges) return { batch: [], metadata }

    const info = {
      minFeeders: values.minFeeders,
      feeders: values.feeders.map((addr) => ({ system: { Signed: addr } })),
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
            <b>provide oracle pricing updates</b> for the onchain NAV.
          </Text>
        </Text>
        <FieldArray name="feeders">
          {({ push, remove }) => (
            <Stack gap={2}>
              {form.values.feeders?.map((_, index) => (
                <Field
                  name={`feeders.${index}.address`}
                  validate={combine(address(), index === 0 ? () => '' : required())}
                >
                  {({ field }: FieldProps) => (
                    <AddressInput
                      {...field}
                      iconOverride={
                        <Flex
                          as="button"
                          border="none"
                          backgroundColor="transparent"
                          alignItems="center"
                          justifyContent="center"
                          onClick={() => remove(index)}
                          pr={1}
                        >
                          {index >= 1 && <IconTrash color="textSecondary" />}
                        </Flex>
                      }
                      placeholder="Enter address..."
                      key={index}
                    />
                  )}
                </Field>
              ))}
              <Box alignSelf="flex-end">
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
          <ChangeThreshold
            primaryText="Oracle update threshold"
            secondaryText="Determine how many oracle providers are required before a pricing update is finalized and will become reflected in the NAV."
            isEditing
            fieldName="minFeeders"
            signersFieldName="feeders"
            validate={positiveNumber()}
            minThreshold={1}
            type="providers"
          />
        </Box>
      </Stack>
    </Card>
  )
}
