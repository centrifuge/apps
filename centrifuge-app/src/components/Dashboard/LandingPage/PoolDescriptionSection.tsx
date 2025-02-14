import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Grid, ImageUpload, Select, Text, TextInput } from '@centrifuge/fabric'
import { Field, FieldProps, useFormikContext } from 'formik'
import { useEffect, useState } from 'react'
import { useTheme } from 'styled-components'
import { FieldWithErrorMessage } from '../../../../src/components/FieldWithErrorMessage'
import { Tooltips } from '../../../../src/components/Tooltips'
import { config } from '../../../../src/config'
import { ASSET_CLASSES } from '../../../../src/pages/IssuerCreatePool/PoolStructureSection'
import { CreatePoolFormValues } from './PoolConfigurationDrawer'

export function PoolDescriptionSection() {
  const form = useFormikContext<CreatePoolFormValues>()
  const theme = useTheme()
  const cent = useCentrifuge()
  const [icon, setIcon] = useState<File | null>(null)

  const iconUrl = cent.metadata.parseMetadataUrl(form.values.pool.poolIcon)

  const subAssetClasses =
    config.assetClasses[form.values.pool.assetClass as keyof typeof config.assetClasses]?.map((label) => ({
      label,
      value: label,
    })) ?? []

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
          // Create a File object. Adjust the filename as needed.
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
        name="pool.poolName"
        as={TextInput}
        label="Pool name*"
        placeholder="Type here..."
        maxLength={100}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setFieldValue('pool.poolName', e.target.value)}
        value={form.values.pool.poolName}
      />
      <Field name="pool.investorType">
        {({ field }: FieldProps) => (
          <FieldWithErrorMessage
            name="pool.investorType"
            label={<Tooltips type="investorType" label={<Text variant="heading4">Investor type*</Text>} size="sm" />}
            onChange={(event: any) => form.setFieldValue('pool.investorType', event.target.value)}
            onBlur={field.onBlur}
            value={field.value}
            as={TextInput}
            placeholder="Type here..."
            maxLength={30}
          />
        )}
      </Field>
      <ImageUpload
        name="pool.poolIcon"
        file={icon}
        onFileChange={async (file) => {
          form.setFieldTouched('pool.poolIcon', true, false)
          form.setFieldValue('pool.poolIcon', file)
        }}
        label="Pool icon*"
        accept="image/svg+xml"
        placeholder="SVG (in square size)"
        id="poolIcon"
        height={144}
      />
      <Field
        name="pool.poolStructure"
        as={TextInput}
        label="Pool structure"
        maxLength={100}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setFieldValue('pool.poolStructure', e.target.value)}
        value="Revolving"
        disabled
      />
      <Field
        name="pool.assetDenomination"
        as={TextInput}
        label="Asset denomination"
        maxLength={100}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          form.setFieldValue('pool.assetDenomination', e.target.value)
        }
        value={form.values.pool.assetDenomination}
        disabled
      />
      <Field name="pool.assetClass">
        {({ field }: FieldProps) => (
          <Select
            name="pool.assetClass"
            label={
              <Tooltips type="assetClass" label={<Text variant="heading4">Primary asset class*</Text>} size="sm" />
            }
            onChange={(event) => {
              form.setFieldValue('pool.assetClass', event.target.value)
              form.setFieldValue('pool.subAssetClass', '', false)
            }}
            value={field.value}
            options={ASSET_CLASSES}
            placeholder="Please select..."
          />
        )}
      </Field>
      <Field name="pool.subAssetClass">
        {({ field, meta, form }: FieldProps) => (
          <Select
            name="pool.subAssetClass"
            label="Secondary asset class*"
            onChange={(event) => form.setFieldValue('pool.subAssetClass', event.target.value)}
            onBlur={field.onBlur}
            value={field.value}
            options={subAssetClasses}
            placeholder="Select..."
          />
        )}
      </Field>
    </Grid>
  )
}
