import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Box, FileUpload, Grid, ImageUpload, Text, TextAreaInput, TextInput, URLInput } from '@centrifuge/fabric'
import { Field, FieldProps, useFormikContext } from 'formik'
import { useEffect, useState } from 'react'
import { useTheme } from 'styled-components'
import { FieldWithErrorMessage } from '../../../../src/components/FieldWithErrorMessage'
import { Tooltips } from '../../../../src/components/Tooltips'
import { validate } from '../../../../src/pages/IssuerCreatePool/validate'
import { UpdatePoolFormValues } from './PoolConfigurationDrawer'

export function IssuerDetailsSection() {
  const form = useFormikContext<UpdatePoolFormValues>()
  const theme = useTheme()
  const cent = useCentrifuge()
  const [logo, setLogo] = useState<File | null>(null)

  const logoUrl = cent.metadata.parseMetadataUrl(form.values.pool.issuer.logo?.uri ?? '')

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
      <Field name="pool.issuer.name" validate={validate.issuerName}>
        {({ field, meta, form }: FieldProps) => (
          <Box position="relative">
            <FieldWithErrorMessage
              name="pool.issuer.name"
              label={<Tooltips type="issuerName" label={<Text variant="heading4">Legal name of the issuer*</Text>} />}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                form.setFieldValue('pool.issuer.name', event.target.value)
              }
              onBlur={field.onBlur}
              value={field.value}
              as={TextInput}
              placeholder="Type here..."
              maxLength={100}
            />
          </Box>
        )}
      </Field>
      <Field name="pool.issuer.repName" validate={validate.issuerRepName}>
        {({ field, meta, form }: FieldProps) => (
          <Box position="relative">
            <FieldWithErrorMessage
              name="pool.issuer.repName"
              label={<Text variant="heading4">Legal name of the issuer representative*</Text>}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                form.setFieldValue('pool.issuer.repName', event.target.value)
              }
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
        onFileChange={(file) => {
          form.setFieldValue('pool.issuer.logo', file)
          setLogo(file)
        }}
        accept="image/png, image/jpeg, image/jpg"
        placeholder="SVG, PNG, or JPG (max. 1MB; 480x480px)"
        label="Issuer logo"
        id="issuerLogo"
        height={144}
      />
      <Field name="pool.issuer.shortDescription" validate={validate.issuerShortDescription}>
        {({ field }: FieldProps) => (
          <FieldWithErrorMessage
            name="pool.issuer.shortDescription"
            label="Landing page description (50-100 characters)*"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              form.setFieldValue('pool.issuer.shortDescription', event.target.value)
            }
            onBlur={field.onBlur}
            value={field.value}
            as={TextAreaInput}
            placeholder="Type here..."
            maxLength={100}
            minLength={50}
          />
        )}
      </Field>
      <Field name="pool.issuer.description" validate={validate.issuerDescription}>
        {({ field }: FieldProps) => (
          <FieldWithErrorMessage
            name="pool.issuer.description"
            as={TextAreaInput}
            label="Overview page description (100-3000 characters)*"
            placeholder="Type here..."
            maxLength={3000}
            minLength={100}
            value={field.value}
            onBlur={field.onBlur}
          />
        )}
      </Field>
      <Field name="pool.links.website" label="Website URL" placeholder="www.example.com" as={URLInput} />
      <Field name="pool.links.forum" label="Governance forum" placeholder="www.example.com" as={URLInput} />
      <Field name="pool.links.executiveSummary">
        {({ field, meta, form }: FieldProps) => (
          <FileUpload
            file={field.value}
            onFileChange={(file) => {
              form.setFieldValue('pool.links.executiveSummary', file)
            }}
            label="Executive summary PDF"
            placeholder="Click to upload"
            accept="application/pdf"
            onClear={() => form.setFieldValue('pool.links.executiveSummary', null)}
            small
          />
        )}
      </Field>
      <Field name="pool.details.title">
        {({ field, meta, form }: FieldProps) => (
          <Box position="relative">
            <Field
              name="pool.details.title"
              label={<Text variant="heading4">Additional information</Text>}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                form.setFieldValue('pool.details.title', event.target.value)
              }
              onBlur={field.onBlur}
              value={field.value}
              as={TextInput}
              placeholder="Title"
              maxLength={100}
            />
          </Box>
        )}
      </Field>
      <Field name="pool.details.description">
        {({ field }: FieldProps) => (
          <Field
            name="pool.details.description"
            as={TextAreaInput}
            placeholder="Description"
            maxLength={3000}
            value={field.value}
          />
        )}
      </Field>
    </Grid>
  )
}
