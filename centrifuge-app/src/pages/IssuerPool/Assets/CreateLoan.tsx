import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import {
  Box,
  Button,
  CurrencyInput,
  DateInput,
  Grid,
  ImageUpload,
  NumberInput,
  Select,
  Stack,
  Text,
  TextAreaInput,
  TextInput,
} from '@centrifuge/fabric'
import { Field, FieldProps, Form, FormikProvider, useFormik, useFormikContext } from 'formik'
import * as React from 'react'
import { Redirect, useHistory, useParams } from 'react-router'
import { lastValueFrom, switchMap } from 'rxjs'
import { useCentrifuge } from '../../../components/CentrifugeProvider'
import { FieldWithErrorMessage } from '../../../components/FieldWithErrorMessage'
import { PageHeader } from '../../../components/PageHeader'
import { PageSection } from '../../../components/PageSection'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { usePodAuth } from '../../../components/PodAuthProvider'
import { PodAuthSection } from '../../../components/PodAuthSection'
import { Transaction, useTransactions } from '../../../components/TransactionsProvider'
import { useWeb3 } from '../../../components/Web3Provider'
import { LoanTemplate } from '../../../types'
import { truncateText } from '../../../utils/formatting'
import { getFileDataURI } from '../../../utils/getFileDataURI'
import { useAddress } from '../../../utils/useAddress'
import { useCentrifugeTransaction } from '../../../utils/useCentrifugeTransaction'
import { useFocusInvalidInput } from '../../../utils/useFocusInvalidInput'
import { useMetadataMulti } from '../../../utils/useMetadata'
import { useCollateralCollectionId } from '../../../utils/useNFTs'
import { usePool, usePoolMetadata } from '../../../utils/usePools'
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
  image: File | null
  description: string
  assetName: string
  templateId: string
  attributes: Record<string, string | number>
}

type Attribute = LoanTemplate['sections'][0]['attributes'][0]
type TemplateFieldProps<T extends string> = Attribute & { type: T; name: string }

const CurrencyField: React.VFC<TemplateFieldProps<'currency'>> = ({ name, label, currencySymbol }) => {
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

const DecimalField: React.VFC<TemplateFieldProps<'decimal'>> = ({ name, label }) => {
  return <FieldWithErrorMessage name={name} as={NumberInput} label={`${label}*`} validate={required()} key={label} />
}

const StringField: React.VFC<TemplateFieldProps<'string'>> = ({ name, label, ...attr }) => {
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

const TimestampField: React.VFC<TemplateFieldProps<'timestamp'>> = ({ name, label }) => {
  return <FieldWithErrorMessage name={name} as={DateInput} label={`${label}*`} validate={required()} key={label} />
}

const PercentageField: React.VFC<TemplateFieldProps<'percentage'>> = ({ name, label }) => {
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

const templateFields = {
  currency: CurrencyField,
  decimal: DecimalField,
  string: StringField,
  timestamp: TimestampField,
  percentage: PercentageField,
}

// 'integer' | 'decimal' | 'string' | 'bytes' | 'timestamp' | 'monetary'

const IssuerCreateLoan: React.FC = () => {
  const { pid } = useParams<{ pid: string }>()
  const pool = usePool(pid)
  const [redirect, setRedirect] = React.useState<string>()
  const history = useHistory()
  const address = useAddress()
  const centrifuge = useCentrifuge()
  const collateralCollectionId = useCollateralCollectionId(pid)
  const { selectedAccount, proxy } = useWeb3()
  const { addTransaction, updateTransaction } = useTransactions()

  const { data: poolMetadata, isLoading: poolMetadataIsLoading } = usePoolMetadata(pool)
  const podUrl = poolMetadata?.pod?.url

  const { token, isLoggedIn } = usePodAuth(podUrl)

  const { isLoading: isTxLoading, execute: doTransaction } = useCentrifugeTransaction(
    'Create asset',
    (cent) =>
      ([submittable], options) =>
        cent.getApi().pipe(switchMap((api) => cent.wrapSignAndSend(api, submittable, { ...options, sendOnly: true }))),
    {
      onSuccess: async (_, result) => {
        const api = await centrifuge.getApiPromise()
        const event = result.events.find(({ event }) => api.events.loans.Created.is(event))
        if (event) {
          const eventData = event.toHuman() as any
          const loanId = eventData.event.data.loanId.replace(/\D/g, '')

          // Doing the redirect via state, so it only happens if the user is still on this
          // page when the transaction completes
          setRedirect(`/issuer/${pid}/assets/${loanId}`)
        }
      },
    }
  )

  const form = useFormik<FormValues>({
    initialValues: {
      image: null,
      description: '',
      assetName: '',
      templateId: '',
      attributes: {},
    },
    onSubmit: async (values, { setSubmitting }) => {
      if (!podUrl || !collateralCollectionId || !address || !token) return

      const txId = Math.random().toString(36).substr(2)

      const tx: Transaction = {
        id: txId,
        title: 'Create document',
        status: 'creating',
        args: [],
      }
      addTransaction(tx)

      const attributes = valuesToPodAttributes(values.attributes, selectedTemplateMetadata) as any
      attributes._template = { type: 'string', value: form.values.templateId }

      let imageMetadataHash
      if (values.image) {
        const fileDataUri = await getFileDataURI(values.image)
        imageMetadataHash = await lastValueFrom(centrifuge.metadata.pinFile(fileDataUri))
      }

      try {
        const { documentId } = await centrifuge.pod.createDocument([
          podUrl,
          token!.signed,
          {
            attributes,
            writeAccess: [address],
          },
        ])

        const publicAttributes = selectedTemplateMetadata.sections
          .filter((section) => section.public)
          .flatMap((section) => section.attributes.map(({ label }) => labelToKey(label)))
        publicAttributes.push('_template')

        const { nftId, jobId } = await centrifuge.pod.commitDocumentAndMintNft([
          podUrl,
          token.signed,
          {
            documentId,
            collectionId: collateralCollectionId,
            owner: address,
            publicAttributes,
            name: values.assetName,
            description: values.description,
            image: imageMetadataHash?.uri,
          },
        ])

        updateTransaction(txId, { status: 'unconfirmed' })

        const connectedCent = centrifuge.connect(selectedAccount!.address, selectedAccount!.signer as any)
        if (proxy) {
          connectedCent.setProxy(proxy.delegator)
        }

        // Sign createLoan transaction
        const submittable = await lastValueFrom(
          connectedCent.pools.createLoan([pid, collateralCollectionId, nftId], { signOnly: true, era: 100 })
        )

        updateTransaction(txId, { status: 'pending' })

        await centrifuge.pod.awaitJob([podUrl, token.signed, jobId])

        // Send the signed createLoan transaction
        doTransaction([submittable], undefined, txId)
      } catch (e) {
        updateTransaction(txId, { status: 'failed', failedReason: 'Failed to create document NFT' })
      }

      setSubmitting(false)
    },
  })

  const templateIds = poolMetadata?.loanTemplates?.map((s) => s.id) ?? []
  const templateMetadata = useMetadataMulti(templateIds)

  const templateSelectOptions = templateIds.map((id, i) => ({
    label: truncateText((templateMetadata[i].data as LoanTemplate)?.name ?? `Template ${i + 1}`, 30),
    value: id,
  }))

  const selectedTemplateMetadata = templateMetadata[templateIds.findIndex((id) => id === form.values.templateId)]
    ?.data as LoanTemplate

  const formRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(form, formRef)

  if (redirect) {
    return <Redirect to={redirect} />
  }

  const isPending = isTxLoading || form.isSubmitting

  return (
    <FormikProvider value={form}>
      <Form ref={formRef} noValidate>
        <Stack>
          <PageHeader
            title="Create asset"
            subtitle={poolMetadata?.pool?.name}
            actions={
              isLoggedIn && (
                <>
                  <Button variant="secondary" onClick={() => history.goBack()}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={isPending} disabled={!form.values.templateId}>
                    Create
                  </Button>
                </>
              )
            }
          />
          {isLoggedIn ? (
            <>
              <PageSection titleAddition="Select a template to enter the asset details.">
                <Grid columns={[1, 2, 2, 3]} equalColumns gap={2} rowGap={3}>
                  <FieldWithErrorMessage
                    validate={combine(required(), maxLength(100))}
                    name="assetName"
                    as={TextInput}
                    label="Asset name*"
                    placeholder=""
                    maxLength={100}
                  />
                  <Field name="templateId" validate={required()}>
                    {({ field, form, meta }: any) => (
                      <Select
                        placeholder="Select template"
                        label="Asset template"
                        options={templateSelectOptions}
                        value={field.value}
                        onSelect={(v) => {
                          form.setFieldValue('templateId', v)
                        }}
                        errorMessage={meta.touched ? meta.error : undefined}
                        disabled={isPending}
                      />
                    )}
                  </Field>
                </Grid>
              </PageSection>
              {selectedTemplateMetadata?.sections.map((section) => (
                <PageSection
                  title={section.name}
                  titleAddition={section.public ? 'Public' : 'Private'}
                  key={section.name}
                >
                  <Grid columns={[1, 2, 2, 3]} equalColumns gap={2} rowGap={3}>
                    {section.attributes?.map((attr) => {
                      const Comp = templateFields[attr.type] as React.VFC<any>
                      const name = `attributes.${labelToKey(attr.label)}`
                      return <Comp {...attr} name={name} key={attr.label} />
                    })}
                  </Grid>
                </PageSection>
              ))}

              {(selectedTemplateMetadata?.options.image || selectedTemplateMetadata?.options.description) && (
                <PageSection title="Description" titleAddition="Optional">
                  <Stack gap={3}>
                    {selectedTemplateMetadata.options.image && (
                      <Field name="image" validate={validate.nftImage}>
                        {({ field, meta, form }: FieldProps) => (
                          <ImageUpload
                            file={field.value}
                            onFileChange={(file) => {
                              form.setFieldTouched('image', true, false)
                              form.setFieldValue('image', file)
                            }}
                            requirements="JPG/PNG/SVG, max 1MB"
                            label="Asset image"
                            errorMessage={meta.touched ? meta.error : undefined}
                          />
                        )}
                      </Field>
                    )}
                    {selectedTemplateMetadata.options.description && (
                      <FieldWithErrorMessage
                        name="description"
                        as={TextAreaInput}
                        label="Description"
                        placeholder="Add asset description paragraph..."
                        maxLength={100}
                      />
                    )}
                  </Stack>
                </PageSection>
              )}
            </>
          ) : podUrl ? (
            <Box py={8}>
              <PodAuthSection podUrl={podUrl} message="You need to be logged in to create assets" />
            </Box>
          ) : (
            !poolMetadataIsLoading && (
              <Stack alignItems="center" py={8}>
                <Text>POD endpoint is missing in pool configuration</Text>
              </Stack>
            )
          )}
        </Stack>
      </Form>
    </FormikProvider>
  )
}

function labelToKey(label: string) {
  return label.toLowerCase().replaceAll(/\s/g, '_')
}

function valuesToPodAttributes(values: FormValues['attributes'], template: LoanTemplate) {
  return Object.fromEntries(
    template.sections.flatMap((section) =>
      section.attributes.map((attr) => {
        const key = labelToKey(attr.label)
        const value = values[key]
        switch (attr.type) {
          case 'timestamp':
            return [
              key,
              {
                type: 'timestamp',
                value: new Date(value).toISOString(),
              },
            ]
          case 'currency': {
            const formatted = CurrencyBalance.fromFloat(value, attr.currencyDecimals).toString()
            return [
              key,
              {
                type: 'monetary',
                value: formatted,
                monetary_value: {
                  ID: attr.currencySymbol,
                  Value: formatted,
                  ChainID: 1,
                },
              },
            ]
          }
          case 'percentage':
            return [
              key,
              {
                type: 'decimal',
                value: String(value),
              },
            ]
          default:
            return [
              key,
              {
                type: attr.type,
                value: String(value),
              },
            ]
        }
      })
    )
  )
}
