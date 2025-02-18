import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Grid, ImageUpload, Select, Text, TextInput } from '@centrifuge/fabric'
import { Field, FieldProps, useFormikContext } from 'formik'
import { useEffect, useState } from 'react'
import { useTheme } from 'styled-components'
import { FieldWithErrorMessage } from '../../../../src/components/FieldWithErrorMessage'
import { Tooltips } from '../../../../src/components/Tooltips'
import { config } from '../../../../src/config'
import { ASSET_CLASSES } from '../../../../src/pages/IssuerCreatePool/PoolStructureSection'
import { validate } from '../../../../src/pages/IssuerCreatePool/validate'
import { UpdatePoolFormValues } from './PoolConfigurationDrawer'

export function PoolDescriptionSection() {
  const form = useFormikContext<UpdatePoolFormValues>()
  const theme = useTheme()
  const cent = useCentrifuge()
  const [icon, setIcon] = useState<File | null>(null)

  const iconUrl = cent.metadata.parseMetadataUrl(form.values?.pool?.icon?.uri ?? '')

  const subAssetClasses = form.values?.pool?.asset?.class
    ? config.assetClasses[form.values?.pool?.asset?.class as keyof typeof config.assetClasses]?.map((label) => ({
        label,
        value: label,
      }))
    : []

  useEffect(() => {
    if (iconUrl) {
      fetch(iconUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Network response was not ok')
          }
          return response.blob()
        })
        .then((blob) => {
          const newFile = new File([blob], 'icon.svg', { type: blob.type })
          setIcon(newFile)
        })
        .catch((error) => {
          console.error('Error converting URL to file:', error)
        })
    }
  }, [iconUrl])

  return (
    <Grid
      p={2}
      backgroundColor="backgroundSecondary"
      borderRadius={8}
      border={`1px solid ${theme.colors.borderPrimary}`}
      mb={2}
      gap={2}
    >
      <FieldWithErrorMessage
        name="pool.name"
        as={TextInput}
        label="Pool name*"
        placeholder="Type here..."
        maxLength={100}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setFieldValue('pool.name', e.target.value)}
        validate={validate.poolName}
      />
      <Field name="pool.investorType" validate={validate.investorType}>
        {({ field }: FieldProps) => (
          <FieldWithErrorMessage
            {...field}
            name="pool.investorType"
            label={<Tooltips type="investorType" label={<Text variant="heading4">Investor type*</Text>} size="sm" />}
            onChange={(event: any) => form.setFieldValue('pool.investorType', event.target.value)}
            as={TextInput}
            placeholder="Type here..."
            maxLength={30}
            onBlur={field.onBlur}
          />
        )}
      </Field>
      <Field name="pool.icon" validate={validate.poolIcon}>
        {({ field, meta, form }: FieldProps) => (
          <ImageUpload
            name="pool.icon"
            file={icon}
            onFileChange={async (file) => {
              form.setFieldTouched('pool.icon', true, false)
              form.setFieldValue('pool.icon', file)
              setIcon(file)
            }}
            label="Pool icon*"
            accept="image/svg+xml"
            placeholder="SVG (in square size)"
            id="poolIcon"
            height={144}
            errorMessage={meta.touched && meta.error ? meta.error : undefined}
          />
        )}
      </Field>
      <Field
        name="poolStructure"
        as={TextInput}
        label="Pool structure"
        maxLength={100}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setFieldValue('poolStructure', e.target.value)}
        value="Revolving"
        disabled
      />
      <Field
        name="assetDenomination"
        as={TextInput}
        label="Asset denomination"
        maxLength={100}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setFieldValue('assetDenomination', e.target.value)}
        value={form.values.currency.symbol}
        disabled
      />
      <Field name="pool.asset.class" validate={validate.assetClass}>
        {({ field, meta, form }: FieldProps) => (
          <Select
            name="pool.asset.class"
            label={
              <Tooltips type="assetClass" label={<Text variant="heading4">Primary asset class*</Text>} size="sm" />
            }
            onChange={(event) => {
              form.setFieldValue('pool.asset.class', event.target.value)
              form.setFieldValue('pool.asset.subClass', '', false)
            }}
            value={field.value}
            options={ASSET_CLASSES}
            placeholder="Please select..."
            onBlur={field.onBlur}
            errorMessage={meta.touched && meta.error ? meta.error : undefined}
          />
        )}
      </Field>
      <Field name="pool.asset.subClass">
        {({ field, meta, form }: FieldProps) => (
          <Select
            name="pool.asset.subClass"
            label="Secondary asset class*"
            onChange={(event) => form.setFieldValue('pool.asset.subClass', event.target.value)}
            onBlur={field.onBlur}
            value={field.value}
            options={subAssetClasses}
            placeholder="Select..."
            errorMessage={meta.touched && meta.error ? meta.error : undefined}
          />
        )}
      </Field>
    </Grid>
  )
}
