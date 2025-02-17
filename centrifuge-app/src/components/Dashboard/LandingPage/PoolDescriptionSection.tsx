import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Grid, ImageUpload, Select, Text, TextInput } from '@centrifuge/fabric'
import { Field, FieldProps, useFormikContext } from 'formik'
import { useEffect, useState } from 'react'
import { useTheme } from 'styled-components'
import { FieldWithErrorMessage } from '../../../../src/components/FieldWithErrorMessage'
import { Tooltips } from '../../../../src/components/Tooltips'
import { config } from '../../../../src/config'
import { ASSET_CLASSES } from '../../../../src/pages/IssuerCreatePool/PoolStructureSection'
import { UpdatePoolFormValues } from './PoolConfigurationDrawer'

export function PoolDescriptionSection() {
  const form = useFormikContext<UpdatePoolFormValues>()
  const theme = useTheme()
  const cent = useCentrifuge()
  const [icon, setIcon] = useState<File | null>(null)

  const iconUrl = cent.metadata.parseMetadataUrl(form.values.poolIcon)

  const subAssetClasses =
    config.assetClasses[form.values.assetClass as keyof typeof config.assetClasses]?.map((label) => ({
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
        name="poolName"
        as={TextInput}
        label="Pool name*"
        placeholder="Type here..."
        maxLength={100}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setFieldValue('poolName', e.target.value)}
        value={form.values.poolName}
      />
      <Field name="investorType">
        {({ field }: FieldProps) => (
          <FieldWithErrorMessage
            name="investorType"
            label={<Tooltips type="investorType" label={<Text variant="heading4">Investor type*</Text>} size="sm" />}
            onChange={(event: any) => form.setFieldValue('investorType', event.target.value)}
            onBlur={field.onBlur}
            value={field.value}
            as={TextInput}
            placeholder="Type here..."
            maxLength={30}
          />
        )}
      </Field>
      <ImageUpload
        name="poolIcon"
        file={icon}
        onFileChange={async (file) => {
          form.setFieldTouched('poolIcon', true, false)
          form.setFieldValue('poolIcon', file)
        }}
        label="Pool icon*"
        accept="image/svg+xml"
        placeholder="SVG (in square size)"
        id="poolIcon"
        height={144}
      />
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
        value={form.values.assetDenomination}
        disabled
      />
      <Field name="assetClass">
        {({ field }: FieldProps) => (
          <Select
            name="assetClass"
            label={
              <Tooltips type="assetClass" label={<Text variant="heading4">Primary asset class*</Text>} size="sm" />
            }
            onChange={(event) => {
              form.setFieldValue('assetClass', event.target.value)
              form.setFieldValue('subAssetClass', '', false)
            }}
            value={field.value}
            options={ASSET_CLASSES}
            placeholder="Please select..."
          />
        )}
      </Field>
      <Field name="subAssetClass">
        {({ field, meta, form }: FieldProps) => (
          <Select
            name="subAssetClass"
            label="Secondary asset class*"
            onChange={(event) => form.setFieldValue('subAssetClass', event.target.value)}
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
