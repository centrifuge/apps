import { PoolMetadata, PoolMetadataInput } from '@centrifuge/centrifuge-js'
import { Box, Button, Grid, ImageUpload, Select, Shelf, TextInput } from '@centrifuge/fabric'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { useParams } from 'react-router'
import { lastValueFrom } from 'rxjs'
import { useCentrifuge } from '../../../components/CentrifugeProvider'
import { FieldWithErrorMessage } from '../../../components/FieldWithErrorMessage'
import { LabelValueStack } from '../../../components/LabelValueStack'
import { PageSection } from '../../../components/PageSection'
import { Tooltips } from '../../../components/Tooltips'
import { config } from '../../../config'
import { getCurrencySymbol } from '../../../utils/formatting'
import { getFileDataURI } from '../../../utils/getFileDataURI'
import { useCentrifugeTransaction } from '../../../utils/useCentrifugeTransaction'
import { useFile } from '../../../utils/useFile'
import { usePrefetchMetadata } from '../../../utils/useMetadata'
import { usePool, usePoolMetadata } from '../../../utils/usePools'
import { validate } from '../../IssuerCreatePool/validate'

type Values = Pick<PoolMetadataInput, 'poolName' | 'poolIcon' | 'assetClass' | 'nodeEndpoint'> & { listed: boolean }

const ASSET_CLASSES = config.assetClasses.map((label) => ({
  label,
  value: label,
}))

export const Details: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const [isEditing, setIsEditing] = React.useState(false)
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const cent = useCentrifuge()
  const prefetchMetadata = usePrefetchMetadata()
  const { data: iconFile } = useFile(metadata?.pool?.icon, 'icon')

  const initialValues: Values = React.useMemo(
    () => ({
      poolName: metadata?.pool?.name ?? '',
      poolIcon: iconFile ?? null,
      assetClass: metadata?.pool?.asset?.class ?? '',
      nodeEndpoint: metadata?.node?.url ?? '',
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
      const hasChanges = Object.entries(values).some(([k, v]) => (initialValues as any)[k] !== v)

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
          icon: iconUri || oldMetadata.pool.icon,
          asset: {
            class: values.assetClass,
          },
          listed: values.listed,
        },
        node: {
          url: values.nodeEndpoint,
        },
      }

      execute([poolId, newPoolMetadata])
      actions.setSubmitting(false)
    },
  })

  React.useEffect(() => {
    if (isEditing && !isLoading) return
    form.resetForm()
    form.setValues(initialValues, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues])

  const icon = cent.metadata.parseMetadataUrl(metadata?.pool?.icon ?? '')

  return (
    <FormikProvider value={form}>
      <Form>
        <PageSection
          title="Details"
          headerRight={
            isEditing ? (
              <Button
                type="submit"
                small
                loading={isLoading || form.isSubmitting}
                loadingMessage={isLoading || form.isSubmitting ? 'Pending...' : undefined}
                key="done"
              >
                Done
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => setIsEditing(true)} small key="edit">
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
                    label="Pool icon: SVG in square size"
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
                    label={<Tooltips type="assetClass" label="Asset class*" variant="secondary" />}
                    onSelect={(v) => form.setFieldValue('assetClass', v)}
                    onBlur={field.onBlur}
                    errorMessage={meta.touched && meta.error ? meta.error : undefined}
                    value={field.value}
                    options={ASSET_CLASSES}
                    placeholder="Select..."
                  />
                )}
              </Field>
              <FieldWithErrorMessage
                validate={validate.nodeEndpoint}
                name="nodeEndpoint"
                as={TextInput}
                label="Node enpoint*"
                placeholder="https://..."
              />
            </Grid>
          ) : (
            <Shelf gap={3} flexWrap="wrap">
              <Box as={icon ? 'img' : 'div'} width="iconLarge" height="iconLarge" src={icon} />
              <LabelValueStack label="Pool name" value={metadata?.pool?.name} />

              <LabelValueStack label="Asset class" value={metadata?.pool?.asset.class} />

              <LabelValueStack label="Currency" value={getCurrencySymbol(pool?.currency)} />
              <LabelValueStack label="Node endpoint" value={metadata?.node?.url ?? '-'} />
              <LabelValueStack label="Menu listing" value={metadata?.pool?.listed ? 'Listed' : 'Not Listed'} />
            </Shelf>
          )}
        </PageSection>
      </Form>
    </FormikProvider>
  )
}
