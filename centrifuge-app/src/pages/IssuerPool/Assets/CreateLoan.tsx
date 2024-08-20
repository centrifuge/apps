import { CurrencyBalance, LoanInfoInput, Price, Rate } from '@centrifuge/centrifuge-js'
import { NFTMetadataInput } from '@centrifuge/centrifuge-js/dist/modules/nfts'
import {
  DataProtocolAuthGuard,
  formatBalance,
  useBalances,
  useCentrifuge,
  useCentrifugeApi,
  useCentrifugeConsts,
  useCentrifugeTransaction,
  useDataProtocol,
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
  Shelf,
  Stack,
  Text,
  TextAreaInput,
  TextInput,
} from '@centrifuge/fabric'
import BN from 'bn.js'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { useMutation } from 'react-query'
import { Navigate, useNavigate, useParams } from 'react-router'
import { combineLatest, firstValueFrom, from, lastValueFrom, switchMap } from 'rxjs'
import { FieldWithErrorMessage } from '../../../components/FieldWithErrorMessage'
import { LayoutBase } from '../../../components/LayoutBase'
import { PageHeader } from '../../../components/PageHeader'
import { PageSection } from '../../../components/PageSection'
import { RouterLinkButton } from '../../../components/RouterLinkButton'
import { LoanTemplate, LoanTemplateAttribute } from '../../../types'
import { getFileDataURI } from '../../../utils/getFileDataURI'
import { useFocusInvalidInput } from '../../../utils/useFocusInvalidInput'
import { useMetadata } from '../../../utils/useMetadata'
import { usePoolAccess, useSuitableAccounts } from '../../../utils/usePermissions'
import { usePool, usePoolMetadata } from '../../../utils/usePools'
import { combine, max, maxLength, min, positiveNumber, required } from '../../../utils/validation'
import { validate } from '../../IssuerCreatePool/validate'
import { PricingInput } from './PricingInput'

export default function IssuerCreateLoanPage() {
  return (
    <LayoutBase>
      <DataProtocolAuthGuard>
        <IssuerCreateLoan />
      </DataProtocolAuthGuard>
    </LayoutBase>
  )
}

export type CreateLoanFormValues = {
  image: File | null
  description: string
  assetName: string
  attributes: Record<string, string | number>
  pricing: {
    valuationMethod: 'discountedCashFlow' | 'outstandingDebt' | 'oracle' | 'cash'
    maxBorrowAmount: 'upToTotalBorrowed' | 'upToOutstandingDebt'
    maturity: 'fixed' | 'none' | 'fixedWithExtension'
    value: number | ''
    maturityDate: string
    maturityExtensionDays: number
    advanceRate: number | ''
    interestRate: number | ''
    probabilityOfDefault: number | ''
    lossGivenDefault: number | ''
    discountRate: number | ''
    maxBorrowQuantity: number | ''
    isin: string
    notional: number | ''
    withLinearPricing: boolean
    oracleSource: 'isin' | 'assetSpecific'
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
          symbol={input.unit}
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
  if (!pid) throw new Error('Pool not found')
  const pool = usePool(pid)
  const [redirect, setRedirect] = React.useState<string>()
  const navigate = useNavigate()
  const centrifuge = useCentrifuge()
  const { session, initSessionAndAddKey } = useDataProtocol()
  const { data: poolMetadata } = usePoolMetadata(pool)

  const peerId = poolMetadata?.pod?.peerId

  const {
    loans: { loanDeposit },
    chainSymbol,
  } = useCentrifugeConsts()
  const api = useCentrifugeApi()
  const [account] = useSuitableAccounts({ poolId: pid, poolRole: ['Borrower'], proxyType: ['Borrow'] })
  const { assetOriginators } = usePoolAccess(pid)
  const collateralCollectionId = assetOriginators.find((ao) => ao.address === account?.actingAddress)
    ?.collateralCollections[0]?.id
  const balances = useBalances(account?.actingAddress)
  const { mutateAsync } = useMutation(
    async (args: [documentId: number, documentVersion: number, properties: object]) => {
      const [documentId, documentVersion, properties] = args
      console.log('store doc mutate, session', session)
      if (!session) throw new Error('No session')
      session.storeDocumentAtPeer(peerId!, documentId, documentVersion, properties)
    }
  )

  const { isLoading: isTxLoading, execute: doTransaction } = useCentrifugeTransaction(
    'Create asset',
    (cent) =>
      (
        [collectionId, nftId, owner, metadataUri, pricingInfo, documentId, documentVersion, documentHash]: [
          string,
          string,
          string,
          string,
          LoanInfoInput,
          number | undefined,
          number | undefined,
          string | undefined,
          any
        ],
        options
      ) => {
        return combineLatest([
          centrifuge.pools.createLoan([pid, collectionId, nftId, pricingInfo], { batch: true }),
          centrifuge.nfts.mintNft(
            [collectionId, nftId, owner, metadataUri, documentId, documentVersion, documentHash],
            { batch: true }
          ),
          from(initSessionAndAddKey(true)),
        ]).pipe(
          switchMap(([createTx, mintBatch, addKeyTx]) => {
            const tx = api.tx.utility.batchAll([...mintBatch.method.args[0], createTx, addKeyTx].filter(Boolean))
            return cent.wrapSignAndSend(api, tx, options)
          })
        )
      },
    {
      onSuccess: async (args, result) => {
        const [, , , , , documentId, documentVersion, , properties] = args
        const event = result.events.find(({ event }) => api.events.loans.Created.is(event))
        console.log('documentId', documentId, documentVersion, properties)
        if (documentId && documentVersion) {
          await mutateAsync([documentId, documentVersion, properties])
        }

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
        valuationMethod: 'oracle',
        maxBorrowAmount: 'upToTotalBorrowed',
        maturity: 'fixed',
        value: '',
        maturityDate: '',
        maturityExtensionDays: 0,
        advanceRate: '',
        interestRate: '',
        probabilityOfDefault: '',
        lossGivenDefault: '',
        discountRate: '',
        maxBorrowQuantity: '',
        isin: '',
        notional: 100,
        withLinearPricing: false,
        oracleSource: 'isin',
      },
    },
    onSubmit: async (values, { setSubmitting }) => {
      if (!collateralCollectionId || !account || !templateMetadata) return
      const { decimals } = pool.currency
      let pricingInfo: LoanInfoInput
      if (values.pricing.valuationMethod === 'cash') {
        pricingInfo = {
          valuationMethod: values.pricing.valuationMethod,
          advanceRate: Rate.fromPercent(100),
          interestRate: Rate.fromPercent(0),
          value: new BN(2).pow(new BN(128)).subn(1), // max uint128
          maxBorrowAmount: 'upToOutstandingDebt' as const,
          maturityDate: values.pricing.maturity !== 'none' ? new Date(values.pricing.maturityDate) : null,
        }
      } else if (values.pricing.valuationMethod === 'oracle') {
        const loanId = await firstValueFrom(centrifuge.pools.getNextLoanId([pid]))
        pricingInfo = {
          valuationMethod: values.pricing.valuationMethod,
          maxPriceVariation: Rate.fromPercent(9999),
          maxBorrowAmount: values.pricing.maxBorrowQuantity ? Price.fromFloat(values.pricing.maxBorrowQuantity) : null,
          priceId:
            values.pricing.oracleSource === 'isin'
              ? { isin: values.pricing.isin }
              : { poolLoanId: [pid, loanId.toString()] satisfies [string, string] },
          maturityDate: values.pricing.maturity !== 'none' ? new Date(values.pricing.maturityDate) : null,
          interestRate: Rate.fromPercent(values.pricing.notional === 0 ? 0 : values.pricing.interestRate),
          notional: CurrencyBalance.fromFloat(values.pricing.notional, decimals),
          withLinearPricing: values.pricing.withLinearPricing,
        }
      } else if (values.pricing.valuationMethod === 'outstandingDebt') {
        pricingInfo = {
          valuationMethod: values.pricing.valuationMethod,
          maxBorrowAmount: values.pricing.maxBorrowAmount,
          value: CurrencyBalance.fromFloat(values.pricing.value, decimals),
          maturityDate: values.pricing.maturity !== 'none' ? new Date(values.pricing.maturityDate) : null,
          maturityExtensionDays:
            values.pricing.maturity === 'fixedWithExtension' ? values.pricing.maturityExtensionDays : null,
          advanceRate: Rate.fromPercent(values.pricing.advanceRate),
          interestRate: Rate.fromPercent(values.pricing.interestRate),
        }
      } else {
        pricingInfo = {
          valuationMethod: values.pricing.valuationMethod,
          maxBorrowAmount: values.pricing.maxBorrowAmount,
          value: CurrencyBalance.fromFloat(values.pricing.value, decimals),
          maturityDate: values.pricing.maturity !== 'none' ? new Date(values.pricing.maturityDate) : null,
          maturityExtensionDays:
            values.pricing.maturity === 'fixedWithExtension' ? values.pricing.maturityExtensionDays : null,
          advanceRate: Rate.fromPercent(values.pricing.advanceRate),
          interestRate: Rate.fromPercent(values.pricing.interestRate),
          probabilityOfDefault: Rate.fromPercent(values.pricing.probabilityOfDefault || 0),
          lossGivenDefault: Rate.fromPercent(values.pricing.lossGivenDefault || 0),
          discountRate: Rate.fromPercent(values.pricing.discountRate || 0),
        }
      }
      const properties =
        values.pricing.valuationMethod === 'cash'
          ? {}
          : { ...valuesToProperties(values.attributes, templateMetadata as any), _template: templateId! }
      const publicAttributes = new Set(
        Object.entries(templateMetadata.attributes!)
          .filter(([, attr]) => attr.public)
          .map(([key]) => key)
      )
      publicAttributes.add('_template')
      const publicProperties = Object.fromEntries(
        Object.entries(properties).filter(([key]) => publicAttributes.has(key))
      ) as Record<string, string>

      const metadataValues: NFTMetadataInput = {
        name: values.assetName,
        description: values.description,
        properties: publicProperties,
      }

      if (values.image) {
        const fileDataUri = await getFileDataURI(values.image)
        const imageMetadataHash = await lastValueFrom(centrifuge.metadata.pinFile(fileDataUri))
        metadataValues.image = imageMetadataHash.uri
      }

      const metadataHash = await lastValueFrom(centrifuge.metadata.pinJson(metadataValues))
      const nftId = await centrifuge.nfts.getAvailableNftId(collateralCollectionId)

      let docId, docHash
      if (peerId) {
        docId = await firstValueFrom(centrifuge.nfts.getAvailableDocumentId())
        docHash = await centrifuge.dataProtocol.hashDocument(properties)
      }
      console.log('docId', docId, docHash, peerId)

      doTransaction(
        [
          collateralCollectionId,
          nftId,
          account.actingAddress,
          metadataHash.uri,
          pricingInfo,
          docId ?? undefined,
          1,
          docHash,
          properties,
        ],
        {
          account,
          forceProxyType: 'Borrow',
        }
      )
      setSubmitting(false)
    },
  })

  const templateIds = poolMetadata?.loanTemplates?.map((s) => s.id) ?? []
  const templateId = templateIds.at(-1)
  const templateMetadata = useMetadata<LoanTemplate>(templateId).data

  const formRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(form, formRef)

  React.useEffect(() => {
    if (form.values.pricing.maturity === 'none' && form.values.pricing.valuationMethod === 'discountedCashFlow') {
      form.setFieldValue('pricing.maturity', 'fixed', false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values])

  if (redirect) {
    return <Navigate to={redirect} />
  }

  const isPending = isTxLoading || form.isSubmitting

  const balanceDec = balances?.native.balance.toDecimal()
  const balanceLow = balanceDec?.lt(loanDeposit.toDecimal())

  const errorMessage = balanceLow ? `The AO account needs at least ${formatBalance(loanDeposit, chainSymbol, 1)}` : null

  return (
    <FormikProvider value={form}>
      <Form ref={formRef} noValidate>
        <Stack>
          <PageHeader title="Create asset" subtitle={poolMetadata?.pool?.name} />
          <PageSection>
            {!templateId && form.values.pricing.valuationMethod !== 'cash' && (
              <Shelf
                gap={2}
                mb={3}
                py={2}
                borderWidth={0}
                borderBottomWidth={1}
                borderColor="borderPrimary"
                borderStyle="solid"
              >
                <Text>Asset template is missing. Please create one first.</Text>
                <RouterLinkButton to={`/issuer/${pid}/configuration/create-asset-template`} small>
                  Create template
                </RouterLinkButton>
              </Shelf>
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
              <Field name="pricing.valuationMethod">
                {({ field, meta, form }: FieldProps) => (
                  <Select
                    {...field}
                    label="Asset type"
                    onChange={(event) => form.setFieldValue('pricing.valuationMethod', event.target.value, false)}
                    errorMessage={meta.touched && meta.error ? meta.error : undefined}
                    options={[
                      { value: 'discountedCashFlow', label: 'Non-fungible asset - DCF' },
                      { value: 'outstandingDebt', label: 'Non-fungible asset - at par' },
                      { value: 'oracle', label: 'Fungible asset - external pricing' },
                      { value: 'cash', label: 'Cash' },
                    ]}
                    placeholder="Choose asset type"
                  />
                )}
              </Field>
            </Grid>
          </PageSection>
          <PageSection title="Pricing">
            <PricingInput poolId={pid} />
          </PageSection>
          {form.values.pricing.valuationMethod !== 'cash' &&
            templateMetadata?.sections?.map((section) => (
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

          {form.values.pricing.valuationMethod !== 'cash' &&
            (templateMetadata?.options?.image || templateMetadata?.options?.description) && (
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
        </Stack>
        <Box position="sticky" bottom={0} backgroundColor="backgroundPage" zIndex={3}>
          <PageSection>
            <Shelf gap={1} justifyContent="end">
              {errorMessage && <Text color="criticalPrimary">{errorMessage}</Text>}
              <Button variant="secondary" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isPending}
                disabled={!templateMetadata || !account || !collateralCollectionId || balanceLow}
              >
                Create
              </Button>
            </Shelf>
          </PageSection>
        </Box>
      </Form>
    </FormikProvider>
  )
}

function valuesToProperties(values: CreateLoanFormValues['attributes'], template: LoanTemplate) {
  return Object.fromEntries(
    template.sections.flatMap((section) =>
      section.attributes.map((key) => {
        const attr = template.attributes[key]
        // if (!attr.public) return undefined as never
        const value = values[key]
        switch (attr.input.type) {
          case 'date':
            return [key, new Date(value).toISOString()]
          case 'currency': {
            return [
              key,
              attr.input.decimals ? CurrencyBalance.fromFloat(value, attr.input.decimals).toString() : String(value),
            ]
          }
          case 'number':
            return [
              key,
              attr.input.decimals ? CurrencyBalance.fromFloat(value, attr.input.decimals).toString() : String(value),
            ]
          default:
            return [key, String(value)]
        }
      })
    )
  )
}
