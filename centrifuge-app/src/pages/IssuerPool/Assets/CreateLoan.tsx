import { CurrencyBalance, Rate } from '@centrifuge/centrifuge-js'
import {
  formatBalance,
  Transaction,
  useBalances,
  useCentrifuge,
  useCentrifugeConsts,
  useCentrifugeTransaction,
  useTransactions,
} from '@centrifuge/centrifuge-react'
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
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { Redirect, useHistory, useParams } from 'react-router'
import { lastValueFrom, switchMap } from 'rxjs'
import { FieldWithErrorMessage } from '../../../components/FieldWithErrorMessage'
import { PageHeader } from '../../../components/PageHeader'
import { PageSection } from '../../../components/PageSection'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { PodAuthSection } from '../../../components/PodAuthSection'
import { RouterLinkButton } from '../../../components/RouterLinkButton'
import { LoanTemplate, LoanTemplateAttribute } from '../../../types'
import { getFileDataURI } from '../../../utils/getFileDataURI'
import { useFocusInvalidInput } from '../../../utils/useFocusInvalidInput'
import { useMetadata } from '../../../utils/useMetadata'
import { usePoolAccess, useSuitableAccounts } from '../../../utils/usePermissions'
import { usePodAuth } from '../../../utils/usePodAuth'
import { usePool, usePoolMetadata } from '../../../utils/usePools'
import { combine, max, maxLength, min, positiveNumber, required } from '../../../utils/validation'
import { validate } from '../../IssuerCreatePool/validate'
import { PricingInput } from './PricingInput'

export const IssuerCreateLoanPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <IssuerCreateLoan />
    </PageWithSideBar>
  )
}

export type CreateLoanFormValues = {
  image: File | null
  description: string
  assetName: string
  attributes: Record<string, string | number>
  pricing: {
    valuationMethod: 'discountedCashFlow' | 'outstandingDebt' | 'oracle'
    maxBorrowAmount: 'upToTotalBorrowed' | 'upToOutstandingDebt'
    value: number | ''
    maturityDate: string
    maturityExtensionDays: number
    advanceRate: number | ''
    interestRate: number | ''
    probabilityOfDefault: number | ''
    lossGivenDefault: number | ''
    discountRate: number | ''
    maxBorrowQuantity: number | ''
    Isin: string
    notional: number | ''
  }
}

type TemplateFieldProps = LoanTemplateAttribute & { name: string }

function TemplateField({ label, name, input }: TemplateFieldProps) {
  switch (input.type) {
    case 'single-select':
      return (
        <Field name={name} validate={required()} key={label}>
          {({ field, form }: any) => (
            <Select
              placeholder="Select one"
              label={`${label}*`}
              options={input.options.map((o) => (typeof o === 'string' ? { label: o, value: o } : o))}
              value={field.value ?? ''}
              onChange={(event) => {
                form.setFieldValue(name, event.target.value)
              }}
            />
          )}
        </Field>
      )
    case 'currency': {
      return (
        <Field
          name={name}
          validate={combine(required(), positiveNumber(), min(input.min ?? -Infinity), max(input.max ?? Infinity))}
          key={label}
        >
          {({ field, meta, form }: FieldProps) => {
            return (
              <CurrencyInput
                {...field}
                variant="small"
                label={`${label}*`}
                errorMessage={meta.touched ? meta.error : undefined}
                currency={input.symbol}
                placeholder="0.00"
                onChange={(value) => form.setFieldValue(name, value)}
                min={input.min}
                max={input.max}
              />
            )
          }}
        </Field>
      )
    }
    case 'number':
      return (
        <FieldWithErrorMessage
          name={name}
          as={NumberInput}
          label={`${label}*`}
          placeholder={input.placeholder}
          validate={combine(required(), min(input.min ?? -Infinity), max(input.max ?? Infinity))}
          rightElement={input.unit}
          min={input.min}
          max={input.max}
        />
      )
    case 'date':
      return (
        <FieldWithErrorMessage
          name={name}
          as={DateInput}
          label={`${label}*`}
          placeholder={input.placeholder}
          validate={required()}
          min={input.min}
          max={input.max}
        />
      )
    default: {
      const { type, ...rest } = input.type as any
      return (
        <FieldWithErrorMessage
          name={name}
          as={type === 'textarea' ? TextAreaInput : TextInput}
          label={`${label}*`}
          validate={required()}
          {...rest}
        />
      )
    }
  }
}

// 'integer' | 'decimal' | 'string' | 'bytes' | 'timestamp' | 'monetary'

function IssuerCreateLoan() {
  const { pid } = useParams<{ pid: string }>()
  const pool = usePool(pid)
  const [redirect, setRedirect] = React.useState<string>()
  const history = useHistory()
  const centrifuge = useCentrifuge()

  const { addTransaction, updateTransaction } = useTransactions()
  const {
    loans: { loanDeposit },
    chainSymbol,
  } = useCentrifugeConsts()
  const [account] = useSuitableAccounts({ poolId: pid, poolRole: ['Borrower'], proxyType: ['PodAuth'] })
  const { assetOriginators } = usePoolAccess(pid)
  const collateralCollectionId = assetOriginators.find((ao) => ao.address === account?.actingAddress)
    ?.collateralCollections[0]?.id
  const balances = useBalances(account?.actingAddress)

  const { isAuthed, token } = usePodAuth(pid)

  const { data: poolMetadata, isLoading: poolMetadataIsLoading } = usePoolMetadata(pool)
  const podUrl = poolMetadata?.pod?.node

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

  const form = useFormik<CreateLoanFormValues>({
    initialValues: {
      image: null,
      description: '',
      assetName: '',
      attributes: {},
      pricing: {
        valuationMethod: 'outstandingDebt',
        maxBorrowAmount: 'upToTotalBorrowed',
        value: '',
        maturityDate: '',
        maturityExtensionDays: 0,
        advanceRate: '',
        interestRate: '',
        probabilityOfDefault: '',
        lossGivenDefault: '',
        discountRate: '',
        maxBorrowQuantity: '',
        Isin: '',
        notional: '',
      },
    },
    onSubmit: async (values, { setSubmitting }) => {
      if (!podUrl || !collateralCollectionId || !account || !isAuthed || !token || !templateMetadata) return
      const { decimals } = pool.currency
      const pricingInfo =
        values.pricing.valuationMethod === 'oracle'
          ? {
              valuationMethod: values.pricing.valuationMethod,
              maxBorrowAmount: values.pricing.maxBorrowQuantity
                ? CurrencyBalance.fromFloat(values.pricing.maxBorrowQuantity, decimals)
                : null,
              Isin: values.pricing.Isin || '',
              maturityDate: new Date(values.pricing.maturityDate),
              maturityExtensionDays: values.pricing.maturityExtensionDays,
              interestRate: Rate.fromPercent(values.pricing.interestRate),
              notional: CurrencyBalance.fromFloat(values.pricing.notional, decimals),
            }
          : {
              valuationMethod: values.pricing.valuationMethod,
              maxBorrowAmount: values.pricing.maxBorrowAmount,
              value: CurrencyBalance.fromFloat(values.pricing.value, decimals),
              maturityDate: new Date(values.pricing.maturityDate),
              maturityExtensionDays: values.pricing.maturityExtensionDays,
              advanceRate: Rate.fromPercent(values.pricing.advanceRate),
              interestRate: Rate.fromPercent(values.pricing.interestRate),
              probabilityOfDefault: Rate.fromPercent(values.pricing.probabilityOfDefault || 0),
              lossGivenDefault: Rate.fromPercent(values.pricing.lossGivenDefault || 0),
              discountRate: Rate.fromPercent(values.pricing.discountRate || 0),
            }

      const txId = Math.random().toString(36).substring(2)

      const tx: Transaction = {
        id: txId,
        title: 'Create document',
        status: 'creating',
        args: [],
      }
      addTransaction(tx)

      const attributes = valuesToPodAttributes(values.attributes, templateMetadata as any) as any
      attributes._template = { type: 'string', value: templateId }

      let imageMetadataHash
      if (values.image) {
        const fileDataUri = await getFileDataURI(values.image)
        imageMetadataHash = await lastValueFrom(centrifuge.metadata.pinFile(fileDataUri))
      }

      try {
        const { documentId } = await centrifuge.pod.createDocument([
          podUrl,
          token,
          {
            attributes,
            writeAccess: [account.actingAddress],
          },
        ])

        const publicAttributes = Object.entries(templateMetadata.attributes!)
          .filter(([, attr]) => attr.public)
          .map(([key]) => key)
        publicAttributes.push('_template')

        const { nftId, jobId } = await centrifuge.pod.commitDocumentAndMintNft([
          podUrl,
          token,
          {
            documentId,
            collectionId: collateralCollectionId,
            owner: account.actingAddress,
            publicAttributes,
            name: values.assetName,
            description: values.description,
            image: imageMetadataHash?.uri,
          },
        ])

        updateTransaction(txId, { status: 'unconfirmed' })

        const connectedCent = centrifuge.connect(account.signingAccount.address, account.signingAccount.signer as any)

        // Sign createLoan transaction
        const submittable = await lastValueFrom(
          connectedCent.pools.createLoan([pid, collateralCollectionId, nftId, pricingInfo], {
            signOnly: true,
            era: 100,
            proxies: account.proxies?.map((p) => [p.delegator, p.types.includes('Borrow') ? 'Borrow' : undefined]),
            multisig: account.multisig,
          })
        )

        updateTransaction(txId, { status: 'pending' })

        await centrifuge.pod.awaitJob([podUrl, token, jobId])

        // Send the signed createLoan transaction
        doTransaction([submittable], undefined, txId)
      } catch (e) {
        console.error(e)
        updateTransaction(txId, { status: 'failed', failedReason: 'Failed to create document NFT' })
      }

      setSubmitting(false)
    },
  })

  const templateIds = poolMetadata?.loanTemplates?.map((s) => s.id) ?? []
  const templateId = templateIds.at(-1)
  const { data: templateMetadata } = useMetadata<LoanTemplate>(templateId)

  const formRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(form, formRef)

  if (redirect) {
    return <Redirect to={redirect} />
  }

  const isPending = isTxLoading || form.isSubmitting

  const balanceDec = balances?.native.balance.toDecimal()
  const balanceLow = balanceDec?.lt(loanDeposit.toDecimal())

  const errorMessage = balanceLow ? `The AO account needs at least ${formatBalance(loanDeposit, chainSymbol, 1)}` : null

  return (
    <FormikProvider value={form}>
      <Form ref={formRef} noValidate>
        <Stack>
          <PageHeader
            title="Create asset"
            subtitle={poolMetadata?.pool?.name}
            actions={
              isAuthed && (
                <>
                  {errorMessage && <Text color="criticalPrimary">{errorMessage}</Text>}
                  <Button variant="secondary" onClick={() => history.goBack()}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={isPending}
                    disabled={!templateMetadata || !account || !collateralCollectionId || balanceLow}
                  >
                    Create
                  </Button>
                </>
              )
            }
          />
          {isAuthed ? (
            <>
              <PageSection>
                {!templateId && (
                  <Box
                    mb={3}
                    py={2}
                    borderWidth={0}
                    borderBottomWidth={1}
                    borderColor="borderPrimary"
                    borderStyle="solid"
                  >
                    <Text>Asset template is missing. Please create one first.</Text>
                  </Box>
                )}
                <Grid columns={[1, 2, 2, 2]} equalColumns gap={2} rowGap={3}>
                  <FieldWithErrorMessage
                    validate={combine(required(), maxLength(100))}
                    name="assetName"
                    as={TextInput}
                    label="Asset name*"
                    placeholder=""
                    maxLength={100}
                    disabled={!templateId}
                  />
                  {!templateId && (
                    <Box alignSelf="center" justifySelf="end">
                      <RouterLinkButton to={`/issuer/${pid}/configuration/create-asset-template`}>
                        Create template
                      </RouterLinkButton>
                    </Box>
                  )}
                </Grid>
              </PageSection>
              <PageSection title="Pricing">
                <PricingInput poolId={pid} />
              </PageSection>
              {templateMetadata?.sections?.map((section) => (
                <PageSection
                  title={section.name}
                  titleAddition={
                    section.attributes.some((key) => templateMetadata?.attributes?.[key]?.public) ? 'Public' : 'Private'
                  }
                  key={section.name}
                >
                  <Grid columns={[1, 2, 2, 3]} equalColumns gap={2} rowGap={3}>
                    {section.attributes?.map((key) => {
                      const attr = templateMetadata?.attributes?.[key]
                      if (!attr) return null
                      const name = `attributes.${key}`
                      return <TemplateField {...attr} name={name} key={key} />
                    })}
                  </Grid>
                </PageSection>
              ))}

              {(templateMetadata?.options?.image || templateMetadata?.options?.description) && (
                <PageSection title="Description" titleAddition="Optional">
                  <Stack gap={3}>
                    {templateMetadata.options.image && (
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
                    {templateMetadata.options.description && (
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
              <PodAuthSection poolId={pid} message="You need to be logged in to create assets" />
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

function valuesToPodAttributes(values: CreateLoanFormValues['attributes'], template: LoanTemplate) {
  return Object.fromEntries(
    template.sections.flatMap((section) =>
      section.attributes.map((key) => {
        const attr = template.attributes[key]
        const value = values[key]
        switch (attr.input.type) {
          case 'date':
            return [
              key,
              {
                type: 'timestamp',
                value: new Date(value).toISOString(),
              },
            ]
          case 'currency': {
            const formatted = attr.input.decimals
              ? CurrencyBalance.fromFloat(value, attr.input.decimals).toString()
              : String(value)
            return [
              key,
              {
                type: 'monetary',
                value: formatted,
                monetary_value: {
                  ID: attr.input.symbol,
                  Value: formatted,
                  ChainID: 1,
                },
              },
            ]
          }
          case 'number':
            return [
              key,
              {
                type: attr.input.decimals ? 'integer' : 'decimal',
                value: attr.input.decimals
                  ? CurrencyBalance.fromFloat(value, attr.input.decimals).toString()
                  : String(value),
              },
            ]
          default:
            return [
              key,
              {
                type: 'string',
                value: String(value),
              },
            ]
        }
      })
    )
  )
}
