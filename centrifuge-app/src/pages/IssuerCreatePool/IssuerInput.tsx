import { Box, FileUpload, Grid, ImageUpload, Text, TextAreaInput, TextInput } from '@centrifuge/fabric'
import { Field, FieldProps } from 'formik'
import * as React from 'react'
import { FieldWithErrorMessage } from '../../components/FieldWithErrorMessage'
import { Tooltips } from '../../components/Tooltips'
import { isTestEnv } from '../../config'
import { CustomDetails } from './CustomDetails'
import { validate } from './validate'

type Props = {
  waitingForStoredIssuer?: boolean
}

const createLabel = (label: string) => `${label}${isTestEnv ? '' : '*'}`

export const IssuerInput: React.FC<Props> = ({ waitingForStoredIssuer = false }) => {
  return (
    <Grid columns={[1, 2]} equalColumns gap={2} rowGap={3}>
      <Box gridColumn={['span 1', 'span 2']}>
        <FieldWithErrorMessage
          validate={validate.issuerName}
          name="issuerName"
          as={TextInput}
          label={<Tooltips type="issuerName" label="Legal name of issuer*" variant="secondary" />}
          placeholder="Name..."
          maxLength={100}
          disabled={waitingForStoredIssuer}
        />
      </Box>
      <Box gridColumn={['span 1', 'span 2']}>
        <FieldWithErrorMessage
          validate={!isTestEnv && validate.issuerRepName}
          name="issuerRepName"
          as={TextInput}
          label={
            <Tooltips
              type="issuerRepName"
              label={createLabel('Legal name of issuer representative')}
              variant="secondary"
            />
          }
          placeholder="Full name..."
          maxLength={100}
          disabled={waitingForStoredIssuer}
        />
      </Box>
      <Box gridColumn={['span 1', 'span 2']}>
        <FieldWithErrorMessage
          validate={!isTestEnv && validate.issuerDescription}
          name="issuerDescription"
          as={TextAreaInput}
          label={
            <Tooltips
              type="poolDescription"
              variant="secondary"
              label={createLabel('Description (minimum 100 characters)')}
            />
          }
          placeholder="Description..."
          maxLength={1000}
          disabled={waitingForStoredIssuer}
        />
      </Box>
      <Box gridColumn={['span 1', 'span 2']} width="100%">
        <Field name="issuerLogo" validate={validate.issuerLogo}>
          {({ field, meta, form }: FieldProps) => (
            <ImageUpload
              file={field.value}
              onFileChange={(file) => {
                form.setFieldTouched('issuerLogo', true, false)
                form.setFieldValue('issuerLogo', file)
              }}
              label="Issuer logo"
              requirements="JPG/PNG/SVG, max 1MB, max 480x480px"
              buttonLabel="Choose issuer logo"
              errorMessage={meta.touched && meta.error ? meta.error : undefined}
              accept="image/*"
            />
          )}
        </Field>
      </Box>
      <Box gridColumn={['span 1', 'span 2']}>
        <Text>Links</Text>
      </Box>
      <Field name="executiveSummary" validate={!isTestEnv && validate.executiveSummary}>
        {({ field, meta, form }: FieldProps) => (
          <FileUpload
            file={field.value}
            onFileChange={(file) => {
              form.setFieldTouched('executiveSummary', true, false)
              form.setFieldValue('executiveSummary', file)
            }}
            accept="application/pdf"
            label={createLabel('Executive summary PDF')}
            placeholder="Choose file"
            errorMessage={meta.touched && meta.error ? meta.error : undefined}
          />
        )}
      </Field>
      <FieldWithErrorMessage
        name="website"
        as={TextInput}
        label={createLabel('Website')}
        placeholder="https://..."
        validate={!isTestEnv && validate.website}
      />
      <FieldWithErrorMessage
        name="forum"
        as={TextInput}
        label="Governance forum"
        placeholder="https://..."
        validate={validate.forum}
      />
      <FieldWithErrorMessage
        name="email"
        as={TextInput}
        label={createLabel('Email')}
        placeholder=""
        validate={!isTestEnv && validate.email}
      />

      <Box gridColumn={['span 1', 'span 2']}>
        <CustomDetails />
      </Box>
    </Grid>
  )
}
