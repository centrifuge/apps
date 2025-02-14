import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Box, Grid, Text, TextInput } from '@centrifuge/fabric'
import { Field, FieldProps, useFormikContext } from 'formik'
import { useEffect, useState } from 'react'
import { useTheme } from 'styled-components'
import { Tooltips } from '../../../../src/components/Tooltips'
import { config } from '../../../../src/config'
import { CreatePoolFormValues } from './PoolConfigurationDrawer'

export function IssuerDetailsSection() {
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
      <Field name="pool.issuerName">
        {({ field, meta, form }: FieldProps) => (
          <Box position="relative">
            <Field
              name="pool.issuerName"
              label={<Tooltips type="issuerName" label={<Text variant="heading4">Legal name of the issuer*</Text>} />}
              onChange={(event: any) => form.setFieldValue('pool.issuerName', event.target.value)}
              onBlur={field.onBlur}
              value={field.value}
              as={TextInput}
              placeholder="Type here..."
              maxLength={100}
            />
          </Box>
        )}
      </Field>
      <Field name="pool.repName">
        {({ field, meta, form }: FieldProps) => (
          <Box position="relative">
            <Field
              name="pool.repName"
              label={<Text variant="heading4">Legal name of the issuer representative*</Text>}
              onChange={(event: any) => form.setFieldValue('pool.repName', event.target.value)}
              onBlur={field.onBlur}
              value={field.value}
              as={TextInput}
              placeholder="Type here..."
              maxLength={100}
            />
          </Box>
        )}
      </Field>
    </Grid>
  )
}
