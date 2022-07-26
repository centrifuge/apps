import {
  Button,
  CurrencyInput,
  DateInput,
  FileUpload,
  Grid,
  NumberInput,
  Select,
  Stack,
  TextAreaInput,
  TextInput,
} from '@centrifuge/fabric'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { Redirect, useHistory, useLocation } from 'react-router'
import { useCentrifuge } from '../../../components/CentrifugeProvider'
import { FieldWithErrorMessage } from '../../../components/FieldWithErrorMessage'
import { PageHeader } from '../../../components/PageHeader'
import { PageSection } from '../../../components/PageSection'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { PoolMetadata, Schema } from '../../../types'
import { useAddress } from '../../../utils/useAddress'
import { useCentrifugeTransaction } from '../../../utils/useCentrifugeTransaction'
import { useFocusInvalidInput } from '../../../utils/useFocusInvalidInput'
import { useMetadataMulti } from '../../../utils/useMetadata'
import { usePermissions } from '../../../utils/usePermissions'
import { usePools } from '../../../utils/usePools'
import { combine, max, maxLength, positiveNumber, required } from '../../../utils/validation'
import { validate } from '../../IssuerCreatePool/validate'

export const IssuerCreateLoanPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <IssuerCreateLoan />
    </PageWithSideBar>
  )
}

type FormValues = {
  assetName: string
  poolId: string
  schemaId: string
  attributes: Record<string, string | number>
}

const IssuerCreateLoan: React.FC = () => {
  const { state } = useLocation<{ pid: string }>()
  const address = useAddress()
  const permissions = usePermissions(address)
  const pools = usePools()
  const [redirect, setRedirect] = React.useState<string>()
  const history = useHistory()
  const centrifuge = useCentrifuge()

  const poolIds = permissions
    ? Object.entries(permissions.pools)
        .filter(([_, p]) => p.roles.includes('Borrower'))
        .map(([poolId]) => poolId)
    : []

  const allowedPools = pools ? pools.filter((p) => poolIds.includes(p.id)) : []

  const poolMetadata = useMetadataMulti(allowedPools.map((pool) => pool.metadata))

  const poolSelectOptions = allowedPools.map((pool, i) => ({
    label: truncate((poolMetadata[i].data as PoolMetadata)?.pool?.name || pool.id, 30),
    value: pool.id,
  }))

  const form = useFormik<FormValues>({
    initialValues: {
      assetName: '',
      poolId: state?.pid ?? '',
      schemaId: '',
      attributes: {},
    },
    onSubmit: (values, { setSubmitting }) => {
      // doTransaction([])
      setSubmitting(false)
    },
  })

  const selectedPoolMetadata = poolMetadata[allowedPools?.findIndex((p) => p.id === form.values.poolId)]
    .data as PoolMetadata

  const schemaIds = selectedPoolMetadata?.schemas?.map((s) => s.id) ?? []
  const schemaMetadata = useMetadataMulti(selectedPoolMetadata?.schemas?.map((s) => s.id) ?? [])

  const schemaSelectOptions = schemaIds.map((id, i) => ({
    label: truncate((schemaMetadata[i].data as Schema)?.name ?? `Schema ${i + 1}`, 30),
    value: id,
  }))

  const selectedSchemaMetadata = schemaMetadata[schemaIds.findIndex((id) => id === form.values.schemaId)]
    ?.data as Schema

  const { isLoading } = useCentrifugeTransaction('Create asset', (cent) => cent.pools.createLoan, {
    onSuccess: async ([poolId], result) => {
      const api = await centrifuge.getApiPromise()
      const event = result.events.find(({ event }) => api.events.loans.Created.is(event))
      if (event) {
        const eventData = event.toHuman() as any
        const loanId = eventData.event.data[1].replace(/\D/g, '')

        // Doing the redirect via state, so it only happens if the user is still on this
        // page when the transaction completes
        setRedirect(`/issuer/${poolId}/assets/${loanId}`)
      }
    },
  })

  const formRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(form, formRef)

  if (redirect) {
    return <Redirect to={redirect} />
  }

  function getInput(attr: Schema['sections'][0]['attributes'][0]) {
    const name = `attributes.${labelToKey(attr.label)}`
    switch (attr.type) {
      case 'currency': {
        return (
          <Field
            name={name}
            validate={combine(required(), positiveNumber(), max(Number.MAX_SAFE_INTEGER))}
            key={attr.label}
          >
            {({ field, meta }: FieldProps) => {
              return (
                <CurrencyInput
                  {...field}
                  variant="small"
                  label={`${attr.label}*`}
                  errorMessage={meta.touched ? meta.error : undefined}
                  currency={attr.currencySymbol}
                  placeholder="0.00"
                  name={name}
                  onChange={(value) => form.setFieldValue(name, value)}
                />
              )
            }}
          </Field>
        )
      }
      case 'decimal': {
        return (
          <FieldWithErrorMessage
            name={name}
            as={NumberInput}
            label={`${attr.label}*`}
            validate={required()}
            key={attr.label}
          />
        )
      }
      case 'string': {
        if ('options' in attr) {
          return (
            <Field name={name} validate={required()} key={attr.label}>
              {({ field, form }: any) => (
                <Select
                  placeholder="Select one"
                  label={`${attr.label}*`}
                  options={attr.options.map((o) => ({ label: o, value: o }))}
                  value={field.value}
                  onSelect={(v) => {
                    form.setFieldValue(name, v)
                  }}
                  disabled={isLoading}
                />
              )}
            </Field>
          )
        }

        return (
          <FieldWithErrorMessage
            name={name}
            as={TextInput}
            label={`${attr.label}*`}
            validate={required()}
            key={attr.label}
          />
        )
      }
      case 'timestamp': {
        return (
          <FieldWithErrorMessage
            name={name}
            as={DateInput}
            label={`${attr.label}*`}
            validate={required()}
            key={attr.label}
          />
        )
      }
      case 'percentage': {
        return (
          <FieldWithErrorMessage
            name={name}
            as={NumberInput}
            label={`${attr.label}*`}
            validate={required()}
            placeholder="0.00"
            rightElement="%"
            key={attr.label}
          />
        )
      }
    }
  }

  return (
    <FormikProvider value={form}>
      <Form ref={formRef} noValidate>
        <Stack>
          <PageHeader
            title="Create asset"
            subtitle={selectedPoolMetadata?.pool?.name}
            actions={
              <>
                <Button variant="secondary" onClick={() => history.goBack()}>
                  Cancel
                </Button>
                <Button type="submit" loading={isLoading} disabled={!form.values.poolId}>
                  Create
                </Button>
              </>
            }
          />
          <PageSection titleAddition="Select a schema to enter the asset details.">
            <Grid columns={[1, 2, 2, 3]} equalColumns gap={2} rowGap={3}>
              <FieldWithErrorMessage
                validate={combine(required(), maxLength(100))}
                name="assetName"
                as={TextInput}
                label="Asset name*"
                placeholder=""
                maxLength={100}
              />
              <Field name="poolId">
                {({ field, form }: any) => (
                  <Select
                    placeholder="Select one"
                    label="Asset originator"
                    options={poolSelectOptions}
                    value={field.value}
                    onSelect={(v) => {
                      form.setFieldValue('schemaId', '', false)
                      form.setFieldTouched('schemaId', false)
                      form.setFieldValue('poolId', v)
                    }}
                    disabled={isLoading}
                  />
                )}
              </Field>
              <Field name="schemaId" validate={required()}>
                {({ field, form, meta }: any) => (
                  <Select
                    placeholder="Select schema"
                    label="Schema"
                    options={schemaSelectOptions}
                    value={field.value}
                    onSelect={(v) => {
                      form.setFieldValue('schemaId', v)
                    }}
                    errorMessage={meta.touched ? meta.error : undefined}
                    disabled={isLoading}
                  />
                )}
              </Field>
            </Grid>
          </PageSection>
          {selectedSchemaMetadata?.sections.map((section) => (
            <PageSection title={section.name} titleAddition={section.public ? 'Public' : 'Private'} key={section.name}>
              <Grid columns={[1, 2, 2, 3]} equalColumns gap={2} rowGap={3}>
                {section.attributes?.map((attr) => getInput(attr))}
              </Grid>
            </PageSection>
          ))}

          <PageSection title="Description" titleAddition="Optional">
            <Grid columns={[1, 1, 2]} gap={2} rowGap={3}>
              <Field name="image" validate={validate.issuerLogo}>
                {({ field, meta, form }: FieldProps) => (
                  <FileUpload
                    file={field.value}
                    onFileChange={(file) => {
                      form.setFieldTouched('image', true, false)
                      form.setFieldValue('image', file)
                    }}
                    label="Image (JPG/PNG, 500x500px)"
                    placeholder="Choose file"
                    errorMessage={meta.touched ? meta.error : undefined}
                    accept="image/*"
                  />
                )}
              </Field>
              <FieldWithErrorMessage
                name="description"
                as={TextAreaInput}
                label="Description"
                placeholder="Add asset description paragraph..."
                maxLength={100}
              />
            </Grid>
          </PageSection>
        </Stack>
      </Form>
    </FormikProvider>
  )
}

function truncate(txt: string, num: number) {
  if (txt.length > num) {
    return `${txt.slice(0, num)}...`
  }
  return txt
}

function labelToKey(label: string) {
  return label.toLowerCase().replaceAll(/\s/g, '_')
}
