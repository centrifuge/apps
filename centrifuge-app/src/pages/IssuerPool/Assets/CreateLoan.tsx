import {
  Button,
  CurrencyInput,
  DateInput,
  Grid,
  ImageUpload,
  NumberInput,
  Select,
  Stack,
  TextAreaInput,
  TextInput,
} from '@centrifuge/fabric'
import { Field, FieldProps, Form, FormikProvider, useFormik, useFormikContext } from 'formik'
import * as React from 'react'
import { Redirect, useHistory, useLocation } from 'react-router'
import { useCentrifuge } from '../../../components/CentrifugeProvider'
import { FieldWithErrorMessage } from '../../../components/FieldWithErrorMessage'
import { PageHeader } from '../../../components/PageHeader'
import { PageSection } from '../../../components/PageSection'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { PoolMetadata, Schema } from '../../../types'
import { truncateText } from '../../../utils/formatting'
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

type Attribute = Schema['sections'][0]['attributes'][0]
type SchemaFieldProps<T extends string> = Attribute & { type: T; name: string }

const CurrencyField: React.VFC<SchemaFieldProps<'currency'>> = ({ name, label, currencySymbol }) => {
  const form = useFormikContext()
  return (
    <Field name={name} validate={combine(required(), positiveNumber(), max(Number.MAX_SAFE_INTEGER))} key={label}>
      {({ field, meta }: FieldProps) => {
        return (
          <CurrencyInput
            {...field}
            variant="small"
            label={`${label}*`}
            errorMessage={meta.touched ? meta.error : undefined}
            currency={currencySymbol}
            placeholder="0.00"
            name={name}
            onChange={(value) => form.setFieldValue(name, value)}
          />
        )
      }}
    </Field>
  )
}

const DecimalField: React.VFC<SchemaFieldProps<'decimal'>> = ({ name, label }) => {
  return <FieldWithErrorMessage name={name} as={NumberInput} label={`${label}*`} validate={required()} key={label} />
}

const StringField: React.VFC<SchemaFieldProps<'string'>> = ({ name, label, ...attr }) => {
  if ('options' in attr) {
    return (
      <Field name={name} validate={required()} key={label}>
        {({ field, form }: any) => (
          <Select
            placeholder="Select one"
            label={`${label}*`}
            options={attr.options.map((o) => ({ label: o, value: o }))}
            value={field.value}
            onSelect={(v) => {
              form.setFieldValue(name, v)
            }}
          />
        )}
      </Field>
    )
  }

  return <FieldWithErrorMessage name={name} as={TextInput} label={`${label}*`} validate={required()} key={label} />
}

const TimestampField: React.VFC<SchemaFieldProps<'timestamp'>> = ({ name, label }) => {
  return <FieldWithErrorMessage name={name} as={DateInput} label={`${label}*`} validate={required()} key={label} />
}

const PercentageField: React.VFC<SchemaFieldProps<'timestamp'>> = ({ name, label }) => {
  return (
    <FieldWithErrorMessage
      name={name}
      as={NumberInput}
      label={`${label}*`}
      validate={required()}
      placeholder="0.00"
      rightElement="%"
      key={label}
    />
  )
}

const schemaFields = {
  currency: CurrencyField,
  decimal: DecimalField,
  string: StringField,
  timestamp: TimestampField,
  percentage: PercentageField,
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
    label: truncateText((poolMetadata[i].data as PoolMetadata)?.pool?.name || pool.id, 30),
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
    ?.data as PoolMetadata

  const schemaIds = selectedPoolMetadata?.schemas?.map((s) => s.id) ?? []
  const schemaMetadata = useMetadataMulti(selectedPoolMetadata?.schemas?.map((s) => s.id) ?? [])

  const schemaSelectOptions = schemaIds.map((id, i) => ({
    label: truncateText((schemaMetadata[i].data as Schema)?.name ?? `Schema ${i + 1}`, 30),
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
                {section.attributes?.map((attr) => {
                  const Comp = schemaFields[attr.type] as React.VFC<any>
                  const name = `attributes.${labelToKey(attr.label)}`
                  return <Comp {...attr} name={name} key={attr.label} />
                })}
              </Grid>
            </PageSection>
          ))}

          <PageSection title="Description" titleAddition="Optional">
            <Stack gap={3}>
              <Field name="image" validate={validate.issuerLogo}>
                {({ field, meta, form }: FieldProps) => (
                  <ImageUpload
                    file={field.value}
                    onFileChange={(file) => {
                      form.setFieldTouched('image', true, false)
                      form.setFieldValue('image', file)
                    }}
                    requirements="JPG/PNG, 500x500px, up to 1MB"
                    label="Asset image"
                    errorMessage={meta.touched ? meta.error : undefined}
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
            </Stack>
          </PageSection>
        </Stack>
      </Form>
    </FormikProvider>
  )
}

function labelToKey(label: string) {
  return label.toLowerCase().replaceAll(/\s/g, '_')
}
