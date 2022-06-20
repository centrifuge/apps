import { Balance, Perquintill, Rate } from '@centrifuge/centrifuge-js'
import {
  Box,
  Button,
  CurrencyInput,
  FileUpload,
  Grid,
  Select,
  Shelf,
  Text,
  TextAreaInput,
  TextInput,
} from '@centrifuge/fabric'
import { Field, FieldProps, Form, FormikErrors, FormikProvider, setIn, useFormik } from 'formik'
import * as React from 'react'
import { useHistory } from 'react-router'
import { useCentrifuge } from '../../components/CentrifugeProvider'
import { FieldWithErrorMessage } from '../../components/FieldWithErrorMessage'
import { PageHeader } from '../../components/PageHeader'
import { PageSection } from '../../components/PageSection'
import { PageWithSideBar } from '../../components/PageWithSideBar'
import { TextWithPlaceholder } from '../../components/TextWithPlaceholder'
import { Tooltips } from '../../components/Tooltips'
import { config } from '../../config'
import { getFileDataURI } from '../../utils/getFileDataURI'
import { useAddress } from '../../utils/useAddress'
import { useCentrifugeTransaction } from '../../utils/useCentrifugeTransaction'
import { useCurrencies } from '../../utils/useCurrencies'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { pinPoolMetadata } from './pinPoolMetadata'
import { RiskGroupsInput } from './RiskGroupsInput'
import { TrancheInput } from './TrancheInput'
import { useStoredIssuer } from './useStoredIssuer'
import { validate } from './validate'
import { WriteOffInput } from './WriteOffInput'

const DEFAULT_CURRENCY = 'Native'

const ASSET_CLASSES = config.assetClasses.map((label) => ({
  label,
  value: label,
}))
const DEFAULT_ASSET_CLASS = config.defaultAssetClass

export const IssuerCreatePoolPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <CreatePoolForm />
    </PageWithSideBar>
  )
}

export interface Tranche {
  tokenName: string
  symbolName: string
  interestRate: number | ''
  minRiskBuffer: number | ''
  minInvestment: number | ''
}
export interface RiskGroup {
  groupName: string
  advanceRate: number | ''
  fee: number | ''
  probabilityOfDefault: number | ''
  lossGivenDefault: number | ''
  discountRate: number | ''
}
export interface WriteOffGroup {
  days: number | ''
  writeOff: number | ''
}
export interface PoolFormValues {
  // details
  poolIcon: File | null
  poolName: string
  assetClass: string
  currency: string
  maxReserve: number | ''
  epochHours: number | ''
  epochMinutes: number | ''

  // issuer
  issuerName: string
  issuerLogo: File | null
  issuerDescription: string

  executiveSummary: File | null
  website: string
  forum: string
  email: string

  // tranche
  tranches: Tranche[]
  riskGroups: RiskGroup[]
  writeOffGroups: WriteOffGroup[]
}

export const createEmptyTranche = (junior?: boolean): Tranche => ({
  tokenName: '',
  symbolName: '',
  interestRate: junior ? '' : 0,
  minRiskBuffer: junior ? '' : 0,
  minInvestment: 0,
})

export const createEmptyRiskGroup = (): RiskGroup => ({
  groupName: '',
  advanceRate: '',
  fee: '',
  probabilityOfDefault: '',
  lossGivenDefault: '',
  discountRate: '',
})

export const createEmptyWriteOffGroup = (): WriteOffGroup => ({
  days: '',
  writeOff: '',
})

const initialValues: PoolFormValues = {
  poolIcon: null,
  poolName: '',
  assetClass: DEFAULT_ASSET_CLASS,
  currency: DEFAULT_CURRENCY,
  maxReserve: '',
  epochHours: 23, // in hours
  epochMinutes: 50, // in minutes

  issuerName: '',
  issuerLogo: null,
  issuerDescription: '',

  executiveSummary: null,
  website: '',
  forum: '',
  email: '',

  tranches: [createEmptyTranche(true)],
  riskGroups: [createEmptyRiskGroup()],
  writeOffGroups: [createEmptyWriteOffGroup()],
}

const PoolIcon: React.FC<{ icon?: File | null }> = ({ children, icon }) => {
  const [dataUri, setDataUri] = React.useState('')

  React.useEffect(() => {
    if (icon && icon.type === 'image/svg+xml') {
      getFileDataURI(icon).then((d) => setDataUri(d))
    } else {
      setDataUri('')
    }
  }, [icon])

  return dataUri ? (
    <img src={dataUri} width={40} height={40} alt="" />
  ) : (
    <Shelf width={40} height={40} borderRadius="card" backgroundColor="backgroundThumbnail" justifyContent="center">
      <Text variant="body1">{children}</Text>
    </Shelf>
  )
}

const CreatePoolForm: React.VFC = () => {
  const address = useAddress()
  const centrifuge = useCentrifuge()
  const currencies = useCurrencies(useAddress())
  const history = useHistory()
  const { data: storedIssuer, isLoading: isStoredIssuerLoading } = useStoredIssuer()
  const [waitingForStoredIssuer, setWaitingForStoredIssuer] = React.useState(true)

  React.useEffect(() => {
    // If the hash can't be find on Pinata the request can take a long time to time out
    // During which the name/description can't be edited
    // Set a deadline for how long we're willing to wait on a stored issuer
    setTimeout(() => setWaitingForStoredIssuer(false), 10000)
  }, [])

  const { execute: createPoolTx, isLoading: transactionIsPending } = useCentrifugeTransaction(
    'Create pool',
    (cent) => cent.pools.createPool,
    {
      onSuccess: (args) => {
        const [, poolId] = args
        history.push(`/issuer/${poolId}`)
      },
    }
  )

  const form = useFormik({
    initialValues,
    validate: (values) => {
      let errors: FormikErrors<any> = {}

      const tokenNames = new Set<string>()
      const commonTokenSymbolStart = values.tranches[0].symbolName.slice(0, 3)
      const tokenSymbols = new Set<string>()
      let prevInterest = Infinity
      let prevRiskBuffer = 0
      values.tranches.forEach((t, i) => {
        if (tokenNames.has(t.tokenName)) {
          errors = setIn(errors, `tranches.${i}.tokenName`, 'Tranche names must be unique')
        }
        tokenNames.add(t.tokenName)

        if (tokenSymbols.has(t.symbolName)) {
          errors = setIn(errors, `tranches.${i}.symbolName`, 'Token symbols must be unique')
        }
        tokenSymbols.add(t.symbolName)

        if (t.symbolName.slice(0, 3) !== commonTokenSymbolStart) {
          errors = setIn(errors, `tranches.${i}.symbolName`, 'Token symbols must all start with the same 3 characters')
        }

        if (t.interestRate !== '') {
          if (t.interestRate > prevInterest) {
            errors = setIn(errors, `tranches.${i}.interestRate`, "Can't be higher than a more junior tranche")
          }
          prevInterest = t.interestRate
        }

        if (t.minRiskBuffer !== '') {
          if (t.minRiskBuffer < prevRiskBuffer) {
            errors = setIn(errors, `tranches.${i}.minRiskBuffer`, "Can't be lower than a more junior tranche")
          }
          prevRiskBuffer = t.minRiskBuffer
        }
      })

      const writeOffGroups = values.writeOffGroups
        .filter((g) => typeof g.days === 'number')
        .sort((a, b) => (a.days as number) - (b.days as number))
      let highestWriteOff = 0
      let previousDays = -1
      writeOffGroups.forEach((g) => {
        if (g.writeOff <= highestWriteOff) {
          const index = values.writeOffGroups.findIndex((gr) => gr.days === g.days && gr.writeOff === g.writeOff)
          errors = setIn(
            errors,
            `writeOffGroups.${index}.writeOff`,
            'Write-off percentage must increase as days increase'
          )
        } else {
          highestWriteOff = g.writeOff as number
        }
        if (g.days === previousDays) {
          const index = values.writeOffGroups.findIndex((gr) => gr.days === g.days && gr.writeOff === g.writeOff)
          errors = setIn(errors, `writeOffGroups.${index}.days`, 'Days must be unique')
        }
        previousDays = g.days as number
      })
      if (highestWriteOff !== 100) {
        errors = setIn(
          errors,
          `writeOffGroups.${values.writeOffGroups.length - 1}.writeOff`,
          'Must have one group with 100% write-off'
        )
      }

      return errors
    },
    validateOnMount: true,
    onSubmit: async (values, { setSubmitting }) => {
      if (!address) return

      const poolId = await centrifuge.pools.getAvailablePoolId()
      const collectionId = await centrifuge.nfts.getAvailableCollectionId()

      const metadataHash = await pinPoolMetadata(values, poolId)

      // tranches must be reversed (most junior is the first in the UI but the last in the API)
      const noJuniorTranches = values.tranches.slice(1)
      const tranches = [
        {}, // most junior tranche
        ...noJuniorTranches.map((tranche) => ({
          interestRatePerSec: Rate.fromAprPercent(tranche.interestRate),
          minRiskBuffer: Perquintill.fromPercent(tranche.minRiskBuffer),
        })),
      ]

      const writeOffGroups = values.writeOffGroups.map((g) => ({
        overdueDays: g.days as number,
        percentage: Rate.fromPercent(g.writeOff),
      }))

      // const epochSeconds = ((values.epochHours as number) * 60 + (values.epochMinutes as number)) * 60

      const currency = values.currency === 'PermissionedEur' ? { permissioned: 'PermissionedEur' } : values.currency

      createPoolTx([
        address,
        poolId,
        collectionId,
        tranches,
        currency,
        Balance.fromFloat(values.maxReserve),
        metadataHash,
        writeOffGroups,
      ])

      setSubmitting(false)
    },
  })

  React.useEffect(() => {
    if (!isStoredIssuerLoading && storedIssuer && waitingForStoredIssuer) {
      if (storedIssuer.name) {
        form.setFieldValue('issuerName', storedIssuer.name, false)
      }
      if (storedIssuer.description) {
        form.setFieldValue('issuerDescription', storedIssuer.description, false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStoredIssuerLoading])

  const formRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(form, formRef)

  return (
    <FormikProvider value={form}>
      <Form ref={formRef}>
        <PageHeader
          icon={<PoolIcon icon={form.values.poolIcon}>{(form.values.poolName || 'New Pool')[0]}</PoolIcon>}
          title={form.values.poolName || 'New Pool'}
          subtitle={
            <TextWithPlaceholder isLoading={waitingForStoredIssuer} width={15}>
              by {form.values.issuerName || address}
            </TextWithPlaceholder>
          }
          actions={
            <>
              <Button variant="secondary" onClick={() => history.goBack()}>
                Cancel
              </Button>

              <Button loading={form.isSubmitting || transactionIsPending} type="submit">
                Create
              </Button>
            </>
          }
        />
        <PageSection title="Details">
          <Grid columns={[4]} equalColumns gap={2} rowGap={3}>
            <Box gridColumn="span 2">
              <FieldWithErrorMessage
                validate={validate.poolName}
                name="poolName"
                as={TextInput}
                label="Pool name*"
                placeholder="New pool"
                maxLength={100}
              />
            </Box>
            <Box gridColumn="span 2" width="100%">
              <Field name="poolIcon" validate={validate.poolIcon}>
                {({ field, meta, form }: FieldProps) => (
                  <FileUpload
                    file={field.value}
                    onFileChange={(file) => {
                      form.setFieldTouched('poolIcon', true, false)
                      form.setFieldValue('poolIcon', file)
                    }}
                    label="Pool icon: SVG in square size*"
                    placeholder="Choose pool icon"
                    errorMessage={meta.touched && meta.error ? meta.error : undefined}
                    accept="image/svg+xml"
                  />
                )}
              </Field>
            </Box>
            <Box gridColumn="span 2">
              <Field name="assetClass" validate={validate.assetClass}>
                {({ field, meta, form }: FieldProps) => (
                  <Select
                    label={<Tooltips type="assetClass" label="Asset class*" variant="secondary" />}
                    onSelect={(v) => form.setFieldValue('assetClass', v)}
                    onBlur={field.onBlur}
                    errorMessage={meta.touched && meta.error ? meta.error : undefined}
                    value={field.value}
                    options={ASSET_CLASSES}
                    placeholder="Select..."
                  />
                )}
              </Field>
            </Box>
            <Box gridColumn="span 2">
              <Field name="currency" validate={validate.currency}>
                {({ field, form, meta }: FieldProps) => (
                  <Select
                    label={<Tooltips type="currency" label="Currency*" variant="secondary" />}
                    onSelect={(v) => form.setFieldValue('currency', v)}
                    onBlur={field.onBlur}
                    errorMessage={meta.touched && meta.error ? meta.error : undefined}
                    value={field.value}
                    options={currencies}
                    placeholder="Select..."
                  />
                )}
              </Field>
            </Box>
            <Box gridColumn="span 2">
              <Field name="maxReserve" validate={validate.maxReserve}>
                {({ field, form }: FieldProps) => (
                  <CurrencyInput
                    {...field}
                    name="maxReserve"
                    label="Initial maximum reserve*"
                    placeholder="0"
                    currency={currencies.find((c) => c.value === form.values.currency)?.label}
                    variant="small"
                    onChange={(value) => form.setFieldValue('maxReserve', value)}
                  />
                )}
              </Field>
            </Box>
            {/* <Box gridColumn="span 1">
              <FieldWithErrorMessage
                validate={validate.epochHours}
                name="epochHours"
                as={NumberInput}
                label="Minimum epoch duration"
                placeholder="0"
                rightElement="hrs"
              />
            </Box>
            <Box gridColumn="span 1">
              <FieldWithErrorMessage
                validate={validate.epochMinutes}
                name="epochMinutes"
                as={NumberInput}
                label={<Text color="transparent">.</Text>}
                placeholder="0"
                rightElement="min"
              />
            </Box> */}
          </Grid>
        </PageSection>
        <PageSection title="Issuer">
          <Grid columns={[6]} equalColumns gap={2} rowGap={3}>
            <Box gridColumn="span 3">
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
            <Box gridColumn="span 3" width="100%">
              <Field name="issuerLogo" validate={validate.issuerLogo}>
                {({ field, meta, form }: FieldProps) => (
                  <FileUpload
                    file={field.value}
                    onFileChange={(file) => {
                      form.setFieldTouched('issuerLogo', true, false)
                      form.setFieldValue('issuerLogo', file)
                    }}
                    label="Issuer logo (JPG/PNG/SVG, 480x480 px)"
                    placeholder="Choose issuer logo"
                    errorMessage={meta.touched && meta.error ? meta.error : undefined}
                    accept="image/*"
                  />
                )}
              </Field>
            </Box>
            <Box gridColumn="span 6">
              <FieldWithErrorMessage
                validate={validate.issuerDescription}
                name="issuerDescription"
                as={TextAreaInput}
                label={
                  <Tooltips type="poolDescription" variant="secondary" label="Description (minimum 100 characters)*" />
                }
                placeholder="Description..."
                maxLength={1000}
                disabled={waitingForStoredIssuer}
              />
            </Box>
            <Box gridColumn="span 6">
              <Text>Links</Text>
            </Box>
            <Box gridColumn="span 3">
              <Field name="executiveSummary" validate={validate.executiveSummary}>
                {({ field, meta, form }: FieldProps) => (
                  <FileUpload
                    file={field.value}
                    onFileChange={(file) => {
                      form.setFieldTouched('executiveSummary', true, false)
                      form.setFieldValue('executiveSummary', file)
                    }}
                    accept="application/pdf"
                    label="Executive summary PDF*"
                    placeholder="Choose file"
                    errorMessage={meta.touched && meta.error ? meta.error : undefined}
                  />
                )}
              </Field>
            </Box>
            <Box gridColumn="span 3">
              <FieldWithErrorMessage
                name="website"
                as={TextInput}
                label="Website"
                placeholder="https://..."
                validate={validate.website}
              />
            </Box>
            <Box gridColumn="span 3">
              <FieldWithErrorMessage
                name="forum"
                as={TextInput}
                label="Governance forum"
                placeholder="https://..."
                validate={validate.forum}
              />
            </Box>
            <Box gridColumn="span 3">
              <FieldWithErrorMessage
                name="email"
                as={TextInput}
                label="Email"
                placeholder=""
                validate={validate.email}
              />
            </Box>
          </Grid>
        </PageSection>

        <TrancheInput />

        <RiskGroupsInput />

        <WriteOffInput />
      </Form>
    </FormikProvider>
  )
}
