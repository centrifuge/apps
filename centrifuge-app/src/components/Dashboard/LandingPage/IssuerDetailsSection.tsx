import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Box, Grid, ImageUpload, Text, TextAreaInput, TextInput } from '@centrifuge/fabric'
import { Field, FieldProps, useFormikContext } from 'formik'
import { useEffect, useState } from 'react'
import { useTheme } from 'styled-components'
import { FieldWithErrorMessage } from '../../../../src/components/FieldWithErrorMessage'
import { Tooltips } from '../../../../src/components/Tooltips'
import { CreatePoolFormValues } from './PoolConfigurationDrawer'

export function IssuerDetailsSection() {
  const form = useFormikContext<CreatePoolFormValues>()
  const theme = useTheme()
  const cent = useCentrifuge()
  const [logo, setLogo] = useState<File | null>(null)

  const logoUrl = cent.metadata.parseMetadataUrl(form.values.pool.issuerLogo)

  useEffect(() => {
    if (logoUrl) {
      fetch(logoUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Network response was not ok')
          }
          return response.blob()
        })
        .then((blob) => {
          // Create a File object. Adjust the filename as needed.
          const newFile = new File([blob], 'icon.svg', { type: blob.type })
          setLogo(newFile)
        })
        .catch((error) => {
          console.error('Error converting URL to file:', error)
        })
    }
  }, [logoUrl])

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
      <ImageUpload
        file={logo}
        onFileChange={(file) => form.setFieldValue('pool.issuerLogo', file)}
        accept="image/png, image/jpeg, image/jpg"
        placeholder="SVG, PNG, or JPG (max. 1MB; 480x480px)"
        label="Issuer logo"
        id="issuerLogo"
        height={144}
      />
      <Field name="pool.issuerShortDescription">
        {({ field }: FieldProps) => (
          <FieldWithErrorMessage
            name="pool.issuerShortDescription"
            label="Landing page description (50-100 characters)*"
            onChange={(event: any) => form.setFieldValue('pool.issuerShortDescription', event.target.value)}
            onBlur={field.onBlur}
            value={field.value}
            as={TextAreaInput}
            placeholder="Type here..."
            maxLength={100}
          />
        )}
      </Field>
      <Field name="pool.issuerDescription">
        {({ field }: FieldProps) => (
          <FieldWithErrorMessage
            name="pool.issuerDescription"
            as={TextAreaInput}
            label="Overview page description (100-3000 characters)*"
            placeholder="Type here..."
            maxLength={1000}
            value={field.value}
          />
        )}
      </Field>
    </Grid>
  )
}
