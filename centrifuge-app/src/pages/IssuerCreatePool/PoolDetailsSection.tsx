import { PoolMetadataInput } from '@centrifuge/centrifuge-js'
import {
  Box,
  Button,
  CurrencyInput,
  FileUpload,
  Grid,
  ImageUpload,
  InputErrorMessage,
  Select,
  Text,
  TextAreaInput,
  TextInput,
  URLInput,
} from '@centrifuge/fabric'
import { Field, FieldProps, useFormikContext } from 'formik'
import { FieldWithErrorMessage } from '../../../src/components/FieldWithErrorMessage'
import { Tooltips } from '../../../src/components/Tooltips'
import { isTestEnv } from '../../../src/config'
import { IssuerCategoriesSection } from './IssuerCategories'
import { PoolRatingsSection } from './PoolRatings'
import { StyledGrid } from './PoolStructureSection'
import { validate } from './validate'

export const AddButton = ({ onClick }: { onClick: () => void }) => (
  <Button variant="secondary" small style={{ width: 163, height: 36 }} onClick={onClick}>
    Add another
  </Button>
)

export const PoolDetailsSection = () => {
  const form = useFormikContext<PoolMetadataInput>()
  const createLabel = (label: string) => `${label}${isTestEnv ? '' : '*'}`

  return (
    <Box>
      <Text variant="heading2" fontWeight={700}>
        Pool Details
      </Text>
      <StyledGrid gridTemplateColumns={['1fr', '1fr 1fr']} gap={3} mt={2}>
        <Grid gap={2}>
          <Field name="investorType" validate={validate.investorType}>
            {({ field, meta, form }: FieldProps) => (
              <FieldWithErrorMessage
                name="investorType"
                label={
                  <Tooltips type="investorType" label={<Text variant="heading4">Investor type*</Text>} size="sm" />
                }
                onChange={(event: any) => form.setFieldValue('investorType', event.target.value)}
                onBlur={field.onBlur}
                errorMessage={meta.touched && meta.error ? meta.error : undefined}
                value={field.value}
                as={TextInput}
                placeholder="Type here..."
                maxLength={30}
              />
            )}
          </Field>
          <Field name="maxReserve" validate={validate.maxReserve}>
            {({ field, form }: FieldProps) => (
              <CurrencyInput
                {...field}
                name="maxReserve"
                label="Initial maximum reserve*"
                placeholder="0"
                currency={form.values.currency}
                onChange={(value) => form.setFieldValue('maxReserve', value)}
              />
            )}
          </Field>
          <Field name="poolType" validate={validate.poolType}>
            {({ field, form, meta }: FieldProps) => (
              <Select
                name="poolType"
                label={<Tooltips type="poolType" size="sm" label={<Text variant="heading4">Pool type*</Text>} />}
                onChange={(event) => form.setFieldValue('poolType', event.target.value)}
                onBlur={field.onBlur}
                errorMessage={meta.touched && meta.error ? meta.error : undefined}
                value={field.value}
                options={[
                  { label: 'Open', value: 'open' },
                  { label: 'Closed', value: 'closed' },
                ]}
                placeholder="Select..."
              />
            )}
          </Field>
        </Grid>
        <Field name="poolIcon" validate={validate.poolIcon}>
          {({ field, meta, form }: FieldProps) => (
            <ImageUpload
              name="poolIcon"
              file={field.value}
              onFileChange={async (file) => {
                form.setFieldTouched('poolIcon', true, false)
                form.setFieldValue('poolIcon', file)
              }}
              label="Pool icon*"
              errorMessage={meta.touched && meta.error ? meta.error : undefined}
              accept="image/svg+xml"
              placeholder="SVG (in square size)"
              id="poolIcon"
              height={144}
            />
          )}
        </Field>
      </StyledGrid>

      <Box mt={4} mb={3}>
        <Text variant="heading2">Issuer</Text>
        <StyledGrid gridTemplateColumns={['1fr', '1fr 1fr']} gap={3} mt={3}>
          <Grid gap={2}>
            <Field name="issuerName" validate={validate.issuerName}>
              {({ field, meta, form }: FieldProps) => (
                <Box position="relative">
                  <Field
                    name="issuerName"
                    label={
                      <Tooltips type="issuerName" label={<Text variant="heading4">Legal name of the issuer*</Text>} />
                    }
                    onChange={(event: any) => form.setFieldValue('issuerName', event.target.value)}
                    onBlur={field.onBlur}
                    value={field.value}
                    as={TextInput}
                    placeholder="Type here..."
                    maxLength={100}
                  />
                  {meta.touched ? (
                    <InputErrorMessage style={{ position: 'absolute' }}>{meta.error}</InputErrorMessage>
                  ) : null}
                </Box>
              )}
            </Field>
            <Field name="issuerLogo">
              {({ field, meta, form }: FieldProps) => (
                <ImageUpload
                  file={field.value}
                  onFileChange={(file) => form.setFieldValue('issuerLogo', file)}
                  accept="image/png, image/jpeg, image/jpg"
                  placeholder="SVG, PNG, or JPG (max. 1MB; 480x480px)"
                  label="Issuer logo"
                  id="issuerLogo"
                  height={144}
                />
              )}
            </Field>
          </Grid>
          <Grid gap={2}>
            <Field name="issuerRepName">
              {({ field, meta, form }: FieldProps) => (
                <FieldWithErrorMessage
                  name="issuerRepName"
                  label={
                    <Tooltips
                      type="issuerRepName"
                      label={<Text variant="heading4">Legal name of the issuer representative</Text>}
                    />
                  }
                  onChange={(event: any) => form.setFieldValue('issuerRepName', event.target.value)}
                  value={field.value}
                  as={TextInput}
                  placeholder="Type here..."
                  maxLength={100}
                />
              )}
            </Field>
            <Field name="issuerShortDescription" validate={validate.issuerShortDescription}>
              {({ field, meta, form }: FieldProps) => (
                <FieldWithErrorMessage
                  name="issuerShortDescription"
                  label="Landing page description (50-100 characters)*"
                  onChange={(event: any) => form.setFieldValue('issuerShortDescription', event.target.value)}
                  onBlur={field.onBlur}
                  errorMessage={meta.touched && meta.error ? meta.error : undefined}
                  value={field.value}
                  as={TextAreaInput}
                  placeholder="Type here..."
                  maxLength={100}
                />
              )}
            </Field>
          </Grid>
          <Box gridColumn="span 2">
            <Field name="issuerDescription" validate={validate.issuerDescription}>
              {({ field, meta, form }: FieldProps) => (
                <FieldWithErrorMessage
                  validate={validate.issuerDescription}
                  name="issuerDescription"
                  as={TextAreaInput}
                  label="Overview page description (100-3000 characters)*"
                  placeholder="Type here..."
                  maxLength={1000}
                  errorMessage={meta.touched && meta.error ? meta.error : undefined}
                />
              )}
            </Field>
          </Box>
          <Grid gap={2}>
            <FieldWithErrorMessage
              name="website"
              label="Website URL"
              placeholder="www.example.com"
              as={URLInput}
              validate={validate.websiteNotRequired()}
            />
            <FieldWithErrorMessage
              name="forum"
              label="Governance forum"
              placeholder="www.example.com"
              as={URLInput}
              validate={validate.websiteNotRequired()}
            />
            <FieldWithErrorMessage
              name="email"
              as={TextInput}
              label={createLabel('Email')}
              placeholder="Type here..."
            />
            <Field name="executiveSummary">
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
                  onClear={() => form.setFieldValue(`executiveSummary`, null)}
                  small
                />
              )}
            </Field>
          </Grid>
          <Grid gap={2}>
            <FieldWithErrorMessage
              name="details.title"
              as={TextInput}
              label="Additional information"
              placeholder="Title"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                form.setFieldValue('details', {
                  ...form.values.details,
                  title: e.target.value,
                })
              }
            />
            <Box display="flex" flexDirection="column">
              <FieldWithErrorMessage
                name="details.body"
                as={TextAreaInput}
                placeholder="Description"
                maxLength={3000}
                style={{ height: '220px' }}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  form.setFieldValue('details', {
                    ...form.values.details,
                    body: e.target.value,
                  })
                }
              />
              <Text variant="body3" style={{ marginTop: 4 }}>
                (Max 3000 characters)
              </Text>
            </Box>
          </Grid>
        </StyledGrid>
      </Box>
      {/* service providers section */}
      <IssuerCategoriesSection />

      {/* pool ratings section */}
      <PoolRatingsSection />

      <Box mt={4} mb={3}>
        <Text variant="heading2">Pool analysis</Text>
        <StyledGrid gridTemplateColumns={['1fr', '1fr 1fr']} gap={3} mt={3}>
          <FieldWithErrorMessage
            name="reportUrl"
            label="Report URL"
            placeholder="Type here..."
            validate={validate.websiteNotRequired()}
            as={URLInput}
          />
          <FieldWithErrorMessage
            name="reportAuthorName"
            as={TextInput}
            label="Rewiewer name"
            placeholder="Type here..."
          />
          <FieldWithErrorMessage
            name="reportAuthorTitle"
            as={TextInput}
            label="Rewiewer job title"
            placeholder="Type here..."
          />

          <Field name="reportAuthorAvatar">
            {({ field, meta, form }: FieldProps) => (
              <FileUpload
                file={field.value}
                onFileChange={(file) => {
                  form.setFieldValue('reportAuthorAvatar', file)
                }}
                label="Reviewer avatar"
                placeholder="Choose file"
                accept="image/png, image/jpeg, image/jpg"
                onClear={() => form.setFieldValue('reportAuthorAvatar', null)}
                small
              />
            )}
          </Field>
        </StyledGrid>
      </Box>
    </Box>
  )
}
