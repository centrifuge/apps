import { PoolMetadata } from '@centrifuge/centrifuge-js'
import { useCentrifuge, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Box, Button, Checkbox, Grid, ImageUpload, Select, Shelf, Stack, TextInput } from '@centrifuge/fabric'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { useParams } from 'react-router'
import { lastValueFrom } from 'rxjs'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { useDebugFlags } from '../../../components/DebugFlags'
import { FieldWithErrorMessage } from '../../../components/FieldWithErrorMessage'
import { LabelValueStack } from '../../../components/LabelValueStack'
import { PageSection } from '../../../components/PageSection'
import { Tooltips } from '../../../components/Tooltips'
import { config } from '../../../config'
import { getFileDataURI } from '../../../utils/getFileDataURI'
import { useFile } from '../../../utils/useFile'
import { usePrefetchMetadata } from '../../../utils/useMetadata'
import { useSuitableAccounts } from '../../../utils/usePermissions'
import { usePool, usePoolMetadata } from '../../../utils/usePools'
import { CreatePoolValues } from '../../IssuerCreatePool'
import { validate } from '../../IssuerCreatePool/validate'

type Values = Pick<CreatePoolValues, 'poolName' | 'poolIcon' | 'assetClass' | 'subAssetClass' | 'podEndpoint'> & {
  listed: boolean
}

const ASSET_CLASSES = Object.keys(config.assetClasses).map((key) => ({
  label: key,
  value: key,
}))

export function Details() {
  const isDemo = import.meta.env.REACT_APP_IS_DEMO
  const { pid: poolId } = useParams<{ pid: string }>()
  const [isEditing, setIsEditing] = React.useState(false)
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const cent = useCentrifuge()
  const prefetchMetadata = usePrefetchMetadata()
  const { data: iconFile } = useFile(metadata?.pool?.icon?.uri, 'icon')
  const { editPoolVisibility } = useDebugFlags()
  const [account] = useSuitableAccounts({ poolId, poolRole: ['PoolAdmin'] })

  const initialValues: Values = React.useMemo(
    () => ({
      poolName: metadata?.pool?.name ?? '',
      poolIcon: iconFile ?? null,
      assetClass:
        metadata?.pool?.asset?.class && Object.keys(config.assetClasses).includes(metadata.pool.asset.class)
          ? metadata.pool.asset.class
          : 'Private credit',
      subAssetClass: metadata?.pool?.asset?.subClass ?? '',
      podEndpoint: metadata?.pod?.node ?? '',
      listed: metadata?.pool?.listed ?? false,
    }),
    [metadata, iconFile]
  )

  const { execute, isLoading } = useCentrifugeTransaction('Update configuration', (cent) => cent.pools.setMetadata, {
    onSuccess: () => {
      setIsEditing(false)
    },
  })

  const form = useFormik({
    initialValues,
    onSubmit: async (values, actions) => {
      const oldMetadata = metadata as PoolMetadata
      const iconChanged = values.poolIcon !== initialValues.poolIcon

      if (!hasChanges) {
        setIsEditing(false)
        actions.setSubmitting(false)
        return
      }
      let iconUri
      if (iconChanged) {
        iconUri = (await lastValueFrom(cent.metadata.pinFile(await getFileDataURI(values.poolIcon as File)))).uri
        prefetchMetadata(iconUri)
      }
      const newPoolMetadata: PoolMetadata = {
        ...oldMetadata,
        pool: {
          ...oldMetadata.pool,
          name: values.poolName,
          icon: iconUri ? { uri: iconUri, mime: values.poolIcon!.type } : oldMetadata.pool.icon,
          asset: {
            class: values.assetClass,
            subClass: values.subAssetClass,
          },
          listed: values.listed,
        },
        pod: {
          ...oldMetadata.pod,
          node: values.podEndpoint,
        },
      }

      execute([poolId, newPoolMetadata], { account })
      actions.setSubmitting(false)
    },
  })

  React.useEffect(() => {
    if (isEditing && !isLoading) return
    form.resetForm()
    form.setValues(initialValues, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues])

  React.useEffect(() => {
    form.resetForm()
    form.setValues(initialValues, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing])

  const hasChanges = Object.entries(form.values).some(([k, v]) => (initialValues as any)[k] !== v)

  const icon = cent.metadata.parseMetadataUrl(metadata?.pool?.icon?.uri ?? '')

  const currency = pool?.currency.symbol ?? ''

  const subAssetClasses =
    config.assetClasses[form.values.assetClass]?.map((label) => ({
      label,
      value: label,
    })) ?? []

  return (
    <FormikProvider value={form}>
      <Form>
        <PageSection
          title="Details"
          headerRight={
            isEditing ? (
              <ButtonGroup variant="small">
                <Button variant="secondary" onClick={() => setIsEditing(false)} small>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  small
                  loading={isLoading || form.isSubmitting}
                  loadingMessage={isLoading || form.isSubmitting ? 'Pending...' : undefined}
                  key="done"
                  disabled={!hasChanges}
                >
                  Done
                </Button>
              </ButtonGroup>
            ) : (
              <Button variant="secondary" onClick={() => setIsEditing(true)} small>
                Edit
              </Button>
            )
          }
        >
          {isEditing ? (
            <Grid columns={[1, 2, 2]} equalColumns gap={2} rowGap={3}>
              <Field name="poolIcon" validate={validate.poolIcon}>
                {({ field, meta, form }: FieldProps) => (
                  <ImageUpload
                    file={field.value}
                    onFileChange={(file) => {
                      form.setFieldTouched('poolIcon', true, false)
                      form.setFieldValue('poolIcon', file)
                    }}
                    requirements=""
                    label="Pool icon: SVG in square size*"
                    errorMessage={meta.touched ? meta.error : undefined}
                    accept="image/svg+xml"
                  />
                )}
              </Field>
              <FieldWithErrorMessage
                validate={validate.poolName}
                name="poolName"
                as={TextInput}
                label="Pool name*"
                placeholder="New pool"
                maxLength={100}
              />
              <Field name="assetClass" validate={validate.assetClass}>
                {({ field, meta, form }: FieldProps) => (
                  <Select
                    name="assetClass"
                    label={<Tooltips type="assetClass" label="Asset class*" variant="secondary" />}
                    onChange={(event) => {
                      form.setFieldValue('assetClass', event.target.value)
                      form.setFieldValue('subAssetClass', '', false)
                    }}
                    onBlur={field.onBlur}
                    errorMessage={meta.touched && meta.error ? meta.error : undefined}
                    value={field.value}
                    options={ASSET_CLASSES}
                    placeholder="Select..."
                  />
                )}
              </Field>
              <Field name="subAssetClass" validate={validate.subAssetClass}>
                {({ field, meta, form }: FieldProps) => (
                  <Select
                    name="subAssetClass"
                    label="Secondary asset class"
                    onChange={(event) => form.setFieldValue('subAssetClass', event.target.value)}
                    onBlur={field.onBlur}
                    errorMessage={meta.touched && meta.error ? meta.error : undefined}
                    value={field.value}
                    options={subAssetClasses}
                    placeholder="Select..."
                  />
                )}
              </Field>
              <Select
                name="currency"
                label="Currency"
                value={currency}
                options={[{ label: currency, value: currency }]}
                placeholder=""
                disabled
              />
              <FieldWithErrorMessage
                validate={validate.podEndpoint}
                name="podEndpoint"
                as={TextInput}
                label={`POD endpoint`}
                placeholder="https://..."
              />

              {((isDemo && editPoolVisibility) || !isDemo) && (
                <Field name="listed" validate={validate.assetClass}>
                  {({ field }: FieldProps) => (
                    <Stack px={2}>
                      <LabelValueStack
                        label="Menu listing"
                        value={<Checkbox {...field} checked={field.value} label="Published" />}
                      />
                    </Stack>
                  )}
                </Field>
              )}
            </Grid>
          ) : (
            <Shelf gap={3} flexWrap="wrap">
              <Box as={icon ? 'img' : 'div'} width="iconLarge" height="iconLarge" src={icon} />
              <LabelValueStack label="Pool name" value={metadata?.pool?.name} />

              <LabelValueStack
                label="Asset class"
                value={metadata?.pool?.asset.class}
              />
              <LabelValueStack label="Secondary asset class" value={metadata?.pool?.asset.subClass} />

              <LabelValueStack label="Currency" value={currency} />
              <LabelValueStack label="POD endpoint" value={metadata?.pod?.node ?? '-'} />
              <LabelValueStack label="Menu listing" value={metadata?.pool?.listed ? 'Published' : 'Not published'} />
            </Shelf>
          )}
        </PageSection>
      </Form>
    </FormikProvider>
  )
}
