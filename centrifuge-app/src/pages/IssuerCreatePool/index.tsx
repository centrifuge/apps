import Centrifuge, { CurrencyBalance, Perquintill, Rate } from '@centrifuge/centrifuge-js'
import {
  Box,
  Button,
  CurrencyInput,
  FileUpload,
  Grid,
  Select,
  Text,
  TextAreaInput,
  TextInput,
  Thumbnail,
} from '@centrifuge/fabric'
import { BN } from 'bn.js'
import { Field, FieldProps, Form, FormikErrors, FormikProvider, setIn, useFormik } from 'formik'
import * as React from 'react'
import { useHistory } from 'react-router'
import { combineLatest, filter, map, of, Subject, switchMap } from 'rxjs'
import { useCentrifuge } from '../../components/CentrifugeProvider'
import { PreimageHashDialog } from '../../components/Dialogs/PreimageHashDialog'
import { FieldWithErrorMessage } from '../../components/FieldWithErrorMessage'
import { PageHeader } from '../../components/PageHeader'
import { PageSection } from '../../components/PageSection'
import { PageWithSideBar } from '../../components/PageWithSideBar'
import { TextWithPlaceholder } from '../../components/TextWithPlaceholder'
import { Tooltips } from '../../components/Tooltips'
import { useWeb3 } from '../../components/Web3Provider'
import { config } from '../../config'
import { formatBalance } from '../../utils/formatting'
import { getFileDataURI } from '../../utils/getFileDataURI'
import { useAddress } from '../../utils/useAddress'
import { useBalances } from '../../utils/useBalances'
import { useCentrifugeTransaction } from '../../utils/useCentrifugeTransaction'
import { useCurrencies } from '../../utils/useCurrencies'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { truncate } from '../../utils/web3'
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

const PoolIcon: React.FC<{ icon?: File | null; children: string }> = ({ children, icon }) => {
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
    <Thumbnail label={children} type="pool" size="large" />
  )
}

type CreatePoolArgs = Parameters<Centrifuge['pools']['createPool']>[0]

const CreatePoolForm: React.VFC = () => {
  const address = useAddress()
  const centrifuge = useCentrifuge()
  const currencies = useCurrencies()
  const history = useHistory()
  const balances = useBalances(address)
  const { selectedAccount } = useWeb3()
  const { data: storedIssuer, isLoading: isStoredIssuerLoading } = useStoredIssuer()
  const [waitingForStoredIssuer, setWaitingForStoredIssuer] = React.useState(true)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [preimageHash, setPreimageHash] = React.useState('')
  const [metadataHash, setMetadataHash] = React.useState('')
  const [proposeFee, setProposeFee] = React.useState<CurrencyBalance | null>(null)

  // Retrieve the submittable with data currently in the form to see how much the transaction would cost
  // Only for when the pool creation goes via democracy
  const [$proposeFee, feeSubject] = React.useMemo(() => {
    const subject = new Subject<CreatePoolArgs>()
    const $fee = subject.pipe(
      switchMap((args) => {
        if (!selectedAccount) return of(null)
        const connectedCent = centrifuge.connect(selectedAccount?.address, selectedAccount?.signer as any)
        return combineLatest([centrifuge.getApi(), connectedCent.pools.createPool(args, { batch: true })]).pipe(
          map(([api, submittable]) => {
            const { minimumDeposit, preimageByteDeposit } = api.consts.democracy
            const feeBN = hexToBN(minimumDeposit.toHex()).add(
              hexToBN(preimageByteDeposit.toHex()).mul(new BN((submittable as any).encodedLength))
            )
            return new CurrencyBalance(feeBN, api.registry.chainDecimals as any)
          })
        )
      })
    )
    return [$fee, subject] as const
  }, [centrifuge, selectedAccount])

  React.useEffect(() => {
    const sub = $proposeFee.subscribe({
      next: (val) => {
        setProposeFee(val)
      },
    })
    return () => {
      sub.unsubscribe()
    }
  }, [$proposeFee])

  React.useEffect(() => {
    // If the hash can't be found on Pinata the request can take a long time to time out
    // During which the name/description can't be edited
    // Set a deadline for how long we're willing to wait on a stored issuer
    setTimeout(() => setWaitingForStoredIssuer(false), 10000)
  }, [])

  const cent = useCentrifuge()

  const txMessage = {
    immediate: 'Create pool',
    propose: 'Submit pool proposal',
    notePreimage: 'Note preimage',
  }
  const { execute: createPoolTx, isLoading: transactionIsPending } = useCentrifugeTransaction(
    txMessage[config.poolCreationType || 'immediate'],
    (cent) => cent.pools.createPool,
    {
      onSuccess: (args) => {
        const [, poolId] = args
        if (config.poolCreationType === 'immediate') {
          history.push(`/issuer/${poolId}`)
        }
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

      const currency = values.currency === 'PermissionedEur' ? { permissioned: 'PermissionedEur' } : values.currency
      const currencyDecimals = currencies.find(values.currency as any)!.decimals

      const poolId = await centrifuge.pools.getAvailablePoolId()
      const collectionId = await centrifuge.nfts.getAvailableCollectionId()

      const metadataHash = await pinPoolMetadata(values, poolId, currencyDecimals)

      console.log('Pool metadata hash', metadataHash)
      setMetadataHash(metadataHash)

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

      createPoolTx(
        [
          address,
          poolId,
          collectionId,
          tranches,
          currency,
          CurrencyBalance.fromFloat(values.maxReserve, currencyDecimals),
          metadataHash,
          writeOffGroups,
        ],
        { createType: config.poolCreationType }
      )

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getProposeFee = React.useCallback(
    debounce((values: PoolFormValues) => {
      if (!address) return

      const noJuniorTranches = values.tranches.slice(1)
      const tranches = [
        {},
        ...noJuniorTranches.map((tranche) => ({
          interestRatePerSec: Rate.fromAprPercent(tranche.interestRate || 0),
          minRiskBuffer: Perquintill.fromPercent(tranche.minRiskBuffer || 0),
        })),
      ]

      const writeOffGroups = values.writeOffGroups.map((g) => ({
        overdueDays: g.days as number,
        percentage: Rate.fromPercent(g.writeOff || 0),
      }))

      const currency = values.currency === 'PermissionedEur' ? { permissioned: 'PermissionedEur' } : values.currency

      // Complete the data in the form with some dummy data for things like poolId and metadata hash
      feeSubject.next([
        address,
        '1234567890',
        '1234567890',
        tranches,
        currency,
        CurrencyBalance.fromFloat(values.maxReserve || 0, 18),
        'x'.repeat(46),
        writeOffGroups,
      ])
    }, 1000),
    []
  )

  React.useEffect(() => {
    if (config.poolCreationType !== 'immediate') {
      getProposeFee(form.values)
    }
  }, [form.values, getProposeFee])

  React.useEffect(() => {
    if (config.poolCreationType === 'notePreimage') {
      const $events = cent
        .getEvents()
        .pipe(
          filter(({ api, events }) => {
            const event = events.find(({ event }) => api.events.democracy.PreimageNoted.is(event))
            const parsedEvent = event?.toJSON() as any
            // the events api returns a few events for the event PreimageNoted where the data looks different everytime
            // when data is a tuple and the length is 3, it may be safe to extract the first value as the preimage hash
            if (parsedEvent?.event?.data?.length === 3) {
              console.info('Preimage hash: ', parsedEvent.event.data[0])
              setPreimageHash(parsedEvent.event.data[0])
              setIsDialogOpen(true)
            }
            return !!event
          })
        )
        .subscribe()
      return () => $events.unsubscribe()
    }
  }, [cent])

  const formRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(form, formRef)

  return (
    <>
      <PreimageHashDialog
        preimageHash={preimageHash}
        metadataHash={metadataHash}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
      <FormikProvider value={form}>
        <Form ref={formRef}>
          <PageHeader
            icon={<PoolIcon icon={form.values.poolIcon}>{(form.values.poolName || 'New Pool')[0]}</PoolIcon>}
            title={form.values.poolName || 'New Pool'}
            subtitle={
              <TextWithPlaceholder isLoading={waitingForStoredIssuer} width={15}>
                by {form.values.issuerName || (address && truncate(address))}
              </TextWithPlaceholder>
            }
            actions={
              <>
                {proposeFee && (
                  <Text variant="body3">Deposit required: {formatBalance(proposeFee, balances?.native.symbol)}</Text>
                )}
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
                    <Tooltips
                      type="poolDescription"
                      variant="secondary"
                      label="Description (minimum 100 characters)*"
                    />
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
    </>
  )
}

function hexToBN(value: string | number) {
  if (typeof value === 'number') return new BN(value)
  return new BN(value.toString().substring(2), 'hex')
}

function debounce<T extends Function>(cb: T, wait = 20) {
  let h: any
  function callable(...args: any) {
    clearTimeout(h)
    h = setTimeout(() => cb(...args), wait)
  }
  return callable as any as T
}
