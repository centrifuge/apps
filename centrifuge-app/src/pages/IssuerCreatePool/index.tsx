import { CurrencyBalance, isSameAddress, Perquintill, Rate, TransactionOptions } from '@centrifuge/centrifuge-js'
import {
  AddFee,
  CurrencyKey,
  FeeTypes,
  PoolMetadataInput,
  TrancheInput,
} from '@centrifuge/centrifuge-js/dist/modules/pools'
import {
  useBalances,
  useCentrifuge,
  useCentrifugeConsts,
  useCentrifugeTransaction,
  useWallet,
} from '@centrifuge/centrifuge-react'
import {
  Box,
  Button,
  CurrencyInput,
  FileUpload,
  Grid,
  Select,
  Shelf,
  Text,
  TextInput,
  TextWithPlaceholder,
  Thumbnail,
} from '@centrifuge/fabric'
import { createKeyMulti, sortAddresses } from '@polkadot/util-crypto'
import BN from 'bn.js'
import { Field, FieldProps, Form, FormikErrors, FormikProvider, setIn, useFormik } from 'formik'
import * as React from 'react'
import { useHistory } from 'react-router'
import { combineLatest, firstValueFrom, lastValueFrom, switchMap, tap } from 'rxjs'
import { useDebugFlags } from '../../components/DebugFlags'
import { PreimageHashDialog } from '../../components/Dialogs/PreimageHashDialog'
import { ShareMultisigDialog } from '../../components/Dialogs/ShareMultisigDialog'
import { FieldWithErrorMessage } from '../../components/FieldWithErrorMessage'
import { LayoutBase } from '../../components/LayoutBase'
import { PageHeader } from '../../components/PageHeader'
import { PageSection } from '../../components/PageSection'
import { Tooltips } from '../../components/Tooltips'
import { config } from '../../config'
import { isSubstrateAddress } from '../../utils/address'
import { Dec } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { getFileDataURI } from '../../utils/getFileDataURI'
import { useAddress } from '../../utils/useAddress'
import { useCreatePoolFee } from '../../utils/useCreatePoolFee'
import { usePoolCurrencies } from '../../utils/useCurrencies'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { usePools } from '../../utils/usePools'
import { truncate } from '../../utils/web3'
import { AdminMultisigSection } from './AdminMultisig'
import { IssuerInput } from './IssuerInput'
import { PoolFeeSection } from './PoolFeeInput'
import { PoolReportsInput } from './PoolReportsInput'
import { TrancheSection } from './TrancheInput'
import { useStoredIssuer } from './useStoredIssuer'
import { validate } from './validate'

const ASSET_CLASSES = Object.keys(config.assetClasses).map((key) => ({
  label: key,
  value: key,
}))

export default function IssuerCreatePoolPage() {
  return (
    <LayoutBase>
      <CreatePoolForm />
    </LayoutBase>
  )
}

export interface Tranche {
  tokenName: string
  symbolName: string
  interestRate: number | ''
  minRiskBuffer: number | ''
  minInvestment: number | ''
}
export interface WriteOffGroupInput {
  days: number | ''
  writeOff: number | ''
  penaltyInterest: number | ''
}

export const createEmptyTranche = (junior?: boolean): Tranche => ({
  tokenName: '',
  symbolName: '',
  interestRate: junior ? '' : 0,
  minRiskBuffer: junior ? '' : 0,
  minInvestment: 0,
})

export type CreatePoolValues = Omit<
  PoolMetadataInput,
  'poolIcon' | 'issuerLogo' | 'executiveSummary' | 'adminMultisig' | 'poolFees' | 'poolReport'
> & {
  poolIcon: File | null
  issuerLogo: File | null
  executiveSummary: File | null
  reportAuthorName: string
  reportAuthorTitle: string
  reportAuthorAvatar: File | null
  reportUrl: string
  adminMultisigEnabled: boolean
  adminMultisig: Exclude<PoolMetadataInput['adminMultisig'], undefined>
  poolFees: {
    id?: number
    name: string
    feeType: FeeTypes
    percentOfNav: number | ''
    walletAddress: string
    feePosition: 'Top of waterfall'
  }[]
  poolType: 'open' | 'closed'
}

const initialValues: CreatePoolValues = {
  poolIcon: null,
  poolName: '',
  assetClass: 'Private credit',
  subAssetClass: '',
  currency: '',
  maxReserve: '',
  epochHours: 23, // in hours
  epochMinutes: 50, // in minutes
  podEndpoint: config.defaultPodUrl ?? '',
  listed: !import.meta.env.REACT_APP_DEFAULT_UNLIST_POOLS,

  issuerName: '',
  issuerRepName: '',
  issuerLogo: null,
  issuerDescription: '',

  executiveSummary: null,
  website: '',
  forum: '',
  email: '',
  details: [],
  reportAuthorName: '',
  reportAuthorTitle: '',
  reportAuthorAvatar: null,
  reportUrl: '',

  tranches: [createEmptyTranche(true)],
  adminMultisig: {
    signers: [],
    threshold: 1,
  },
  adminMultisigEnabled: false,
  poolFees: [],
  poolType: 'open',
}

const PoolIcon: React.FC<{ icon?: File | null; children: string }> = ({ children, icon }) => {
  const [uri, setUri] = React.useState('')
  React.useEffect(() => {
    ;(async () => {
      if (!icon) return
      const uri = await getFileDataURI(icon)
      setUri(uri)
    })()
  }, [icon])
  return uri ? <img src={uri} width={40} height={40} alt="" /> : <Thumbnail label={children} type="pool" size="large" />
}

function CreatePoolForm() {
  const address = useAddress('substrate')
  const {
    substrate: { addMultisig },
  } = useWallet()
  const centrifuge = useCentrifuge()
  const currencies = usePoolCurrencies()
  const { chainDecimals } = useCentrifugeConsts()
  const pools = usePools()
  const history = useHistory()
  const balances = useBalances(address)
  const { data: storedIssuer, isLoading: isStoredIssuerLoading } = useStoredIssuer()
  const [waitingForStoredIssuer, setWaitingForStoredIssuer] = React.useState(true)
  const [isPreimageDialogOpen, setIsPreimageDialogOpen] = React.useState(false)
  const [isMultisigDialogOpen, setIsMultisigDialogOpen] = React.useState(false)
  const [preimageHash, setPreimageHash] = React.useState('')
  const [createdPoolId, setCreatedPoolId] = React.useState('')
  const [multisigData, setMultisigData] = React.useState<{ hash: string; callData: string }>()
  const { poolCreationType } = useDebugFlags()
  const consts = useCentrifugeConsts()
  const createType = (poolCreationType as TransactionOptions['createType']) || config.poolCreationType || 'immediate'

  React.useEffect(() => {
    // If the hash can't be found on Pinata the request can take a long time to time out
    // During which the name/description can't be edited
    // Set a deadline for how long we're willing to wait on a stored issuer
    setTimeout(() => setWaitingForStoredIssuer(false), 10000)
  }, [])

  React.useEffect(() => {
    if (storedIssuer) setWaitingForStoredIssuer(false)
  }, [storedIssuer])

  React.useEffect(() => {
    if (createdPoolId && pools?.find((p) => p.id === createdPoolId)) {
      // Redirecting only when we find the newly created pool in the data from usePools
      // Otherwise the Issue Overview page will throw an error when it can't find the pool
      // It can take a second for the new data to come in after creating the pool
      history.push(`/issuer/${createdPoolId}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pools, createdPoolId])

  const txMessage = {
    immediate: 'Create pool',
    propose: 'Submit pool proposal',
    notePreimage: 'Note preimage',
  }
  const { execute: createPoolTx, isLoading: transactionIsPending } = useCentrifugeTransaction(
    `${txMessage[createType]} 2/2`,
    (cent) =>
      (
        args: [
          transferToMultisig: BN,
          aoProxy: string,
          adminProxy: string,
          poolId: string,
          tranches: TrancheInput[],
          currency: CurrencyKey,
          maxReserve: BN,
          metadata: PoolMetadataInput,
          poolFees: AddFee['fee'][]
        ],
        options
      ) => {
        const [transferToMultisig, aoProxy, adminProxy, , , , , { adminMultisig }] = args
        const multisigAddr = adminMultisig && createKeyMulti(adminMultisig.signers, adminMultisig.threshold)
        const poolArgs = args.slice(2) as any
        return combineLatest([
          cent.getApi(),
          cent.pools.createPool(poolArgs, { createType: options?.createType, batch: true }),
        ]).pipe(
          switchMap(([api, poolSubmittable]) => {
            const adminProxyDelegate = multisigAddr ?? address
            const otherMultisigSigners =
              multisigAddr && sortAddresses(adminMultisig.signers.filter((addr) => !isSameAddress(addr, address!)))
            const proxiedPoolCreate = api.tx.proxy.proxy(adminProxy, undefined, poolSubmittable)
            const submittable = api.tx.utility.batchAll(
              [
                api.tx.balances.transfer(adminProxy, consts.proxy.proxyDepositFactor.add(transferToMultisig)),
                api.tx.balances.transfer(
                  aoProxy,
                  consts.proxy.proxyDepositFactor.add(consts.uniques.collectionDeposit)
                ),
                adminProxyDelegate !== address &&
                  api.tx.proxy.proxy(
                    adminProxy,
                    undefined,
                    api.tx.utility.batchAll([
                      api.tx.proxy.addProxy(adminProxyDelegate, 'Any', 0),
                      api.tx.proxy.removeProxy(address, 'Any', 0),
                    ])
                  ),
                api.tx.proxy.proxy(
                  aoProxy,
                  undefined,
                  api.tx.utility.batchAll([
                    api.tx.proxy.addProxy(adminProxy, 'Any', 0),
                    api.tx.proxy.removeProxy(address, 'Any', 0),
                  ])
                ),
                multisigAddr
                  ? api.tx.multisig.asMulti(adminMultisig.threshold, otherMultisigSigners, null, proxiedPoolCreate, 0)
                  : proxiedPoolCreate,
              ].filter(Boolean)
            )
            setMultisigData({ callData: proxiedPoolCreate.method.toHex(), hash: proxiedPoolCreate.method.hash.toHex() })
            return cent.wrapSignAndSend(api, submittable, { ...options, multisig: undefined, proxies: undefined })
          })
        )
      },
    {
      onSuccess: (args) => {
        if (form.values.adminMultisigEnabled) setIsMultisigDialogOpen(true)
        const [, , , poolId] = args
        if (createType === 'immediate') {
          setCreatedPoolId(poolId)
        }
      },
    }
  )

  const { execute: createProxies, isLoading: createProxiesIsPending } = useCentrifugeTransaction(
    `${txMessage[createType]} 1/2`,
    (cent) => {
      return (_: [nextTx: (adminProxy: string, aoProxy: string) => void], options) =>
        cent.getApi().pipe(
          switchMap((api) => {
            const submittable = api.tx.utility.batchAll([
              api.tx.proxy.createPure('Any', 0, 0),
              api.tx.proxy.createPure('Any', 0, 1),
            ])
            return cent.wrapSignAndSend(api, submittable, options)
          })
        )
    },
    {
      onSuccess: async ([nextTx], result) => {
        const api = await centrifuge.getApiPromise()
        const events = result.events.filter(({ event }) => api.events.proxy.PureCreated.is(event))
        if (!events) return
        const { pure } = (events[0].toHuman() as any).event.data
        const { pure: pure2 } = (events[1].toHuman() as any).event.data

        nextTx(pure, pure2)
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

      values.poolFees.forEach((fee, i) => {
        if (fee.name === '') {
          errors = setIn(errors, `poolFees.${i}.name`, 'Name is required')
        }
        if (fee.percentOfNav === '' || fee.percentOfNav < 0.0001 || fee.percentOfNav > 10) {
          errors = setIn(errors, `poolFees.${i}.percentOfNav`, 'Percentage between 0.0001 and 10 is required')
        }
        if (fee.walletAddress === '') {
          errors = setIn(errors, `poolFees.${i}.walletAddress`, 'Wallet address is required')
        }
        if (!isSubstrateAddress(fee?.walletAddress)) {
          errors = setIn(errors, `poolFees.${i}.walletAddress`, 'Invalid address')
        }
      })

      values.tranches.forEach((t, i) => {
        if (tokenNames.has(t.tokenName)) {
          errors = setIn(errors, `tranches.${i}.tokenName`, 'Tranche names must be unique')
        }
        tokenNames.add(t.tokenName)

        // matches any character thats not alphanumeric or -
        if (/[^a-z^A-Z^0-9^-]+/.test(t.symbolName)) {
          errors = setIn(errors, `tranches.${i}.symbolName`, 'Invalid character detected')
        }

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
      if (values.reportUrl) {
        if (!values.reportAuthorName) {
          errors = setIn(errors, 'reportAuthorName', 'Required')
        }
        if (!values.reportAuthorTitle) {
          errors = setIn(errors, 'reportAuthorTitle', 'Required')
        }
      }

      return errors
    },
    validateOnMount: true,
    onSubmit: async (values, { setSubmitting }) => {
      if (!currencies || !address) return

      const metadataValues: PoolMetadataInput = { ...values } as any

      metadataValues.adminMultisig = values.adminMultisigEnabled
        ? {
            ...values.adminMultisig,
            signers: sortAddresses(values.adminMultisig.signers),
          }
        : undefined

      const currency = currencies.find((c) => c.symbol === values.currency)!

      const poolId = await centrifuge.pools.getAvailablePoolId()
      if (!values.poolIcon || !values.executiveSummary) {
        return
      }
      const [pinnedPoolIcon, pinnedIssuerLogo, pinnedExecSummary] = await Promise.all([
        lastValueFrom(centrifuge.metadata.pinFile(await getFileDataURI(values.poolIcon))),
        values.issuerLogo ? lastValueFrom(centrifuge.metadata.pinFile(await getFileDataURI(values.issuerLogo))) : null,
        lastValueFrom(centrifuge.metadata.pinFile(await getFileDataURI(values.executiveSummary))),
      ])

      metadataValues.issuerLogo = pinnedIssuerLogo?.uri
        ? { uri: pinnedIssuerLogo.uri, mime: values?.issuerLogo?.type || '' }
        : null
      metadataValues.executiveSummary = { uri: pinnedExecSummary.uri, mime: values.executiveSummary.type }
      metadataValues.poolIcon = { uri: pinnedPoolIcon.uri, mime: values.poolIcon.type }

      if (values.reportUrl) {
        let avatar = null
        if (values.reportAuthorAvatar) {
          const pinned = await lastValueFrom(
            centrifuge.metadata.pinFile(await getFileDataURI(values.reportAuthorAvatar))
          )
          avatar = { uri: pinned.uri, mime: values.reportAuthorAvatar.type }
        }
        metadataValues.poolReport = {
          authorAvatar: avatar,
          authorName: values.reportAuthorName,
          authorTitle: values.reportAuthorTitle,
          url: values.reportUrl,
        }
      }

      // tranches must be reversed (most junior is the first in the UI but the last in the API)
      const nonJuniorTranches = metadataValues.tranches.slice(1)
      const tranches = [
        {}, // most junior tranche
        ...nonJuniorTranches.map((tranche) => ({
          interestRatePerSec: Rate.fromAprPercent(tranche.interestRate),
          minRiskBuffer: Perquintill.fromPercent(tranche.minRiskBuffer),
        })),
      ]

      const feeId = await firstValueFrom(centrifuge.pools.getNextPoolFeeId())
      const poolFees: AddFee['fee'][] = values.poolFees.map((fee, i) => {
        return {
          name: fee.name,
          destination: fee.walletAddress,
          amount: Rate.fromPercent(fee.percentOfNav),
          feeType: fee.feeType,
          limit: 'ShareOfPortfolioValuation',
          feeId: feeId + i,
          account: fee.feeType === 'chargedUpTo' ? fee.walletAddress : undefined,
          feePosition: fee.feePosition,
        }
      })
      metadataValues.poolFees = poolFees.map((fee) => ({
        name: fee.name,
        id: fee.feeId,
        feePosition: fee.feePosition,
        feeType: fee.feeType,
      }))

      // const epochSeconds = ((values.epochHours as number) * 60 + (values.epochMinutes as number)) * 60

      if (metadataValues.adminMultisig) {
        addMultisig(metadataValues.adminMultisig)
      }

      createProxies([
        (aoProxy, adminProxy) => {
          createPoolTx(
            [
              CurrencyBalance.fromFloat(createDeposit, chainDecimals),
              aoProxy,
              adminProxy,
              poolId,
              tranches,
              currency.key,
              CurrencyBalance.fromFloat(values.maxReserve, currency.decimals),
              metadataValues,
              poolFees,
            ],
            { createType }
          )
        },
      ])

      setSubmitting(false)
    },
  })

  React.useEffect(() => {
    if (!isStoredIssuerLoading && storedIssuer && waitingForStoredIssuer) {
      if (storedIssuer.name) {
        form.setFieldValue('issuerName', storedIssuer.name, false)
      }
      if (storedIssuer.repName) {
        form.setFieldValue('issuerRepName', storedIssuer.repName, false)
      }
      if (storedIssuer.description) {
        form.setFieldValue('issuerDescription', storedIssuer.description, false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStoredIssuerLoading])

  React.useEffect(() => {
    if (createType === 'notePreimage') {
      const $events = centrifuge
        .getEvents()
        .pipe(
          tap(({ api, events }) => {
            const event = events.find(({ event }) => api.events.preimage.Noted.is(event))
            const parsedEvent = event?.toJSON() as any
            if (!parsedEvent) return false
            console.info('Preimage hash: ', parsedEvent.event.data[0])
            setPreimageHash(parsedEvent.event.data[0])
            setIsPreimageDialogOpen(true)
          })
        )
        .subscribe()
      return () => $events.unsubscribe()
    }
  }, [centrifuge, createType])

  const formRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(form, formRef)

  const { proposeFee, poolDeposit, proxyDeposit, collectionDeposit } = useCreatePoolFee(form?.values)
  const createDeposit = (proposeFee?.toDecimal() ?? Dec(0))
    .add(poolDeposit.toDecimal())
    .add(collectionDeposit.toDecimal())
  const deposit = createDeposit.add(proxyDeposit.toDecimal())

  const subAssetClasses =
    config.assetClasses[form.values.assetClass]?.map((label) => ({
      label,
      value: label,
    })) ?? []

  return (
    <>
      <PreimageHashDialog
        preimageHash={preimageHash}
        open={isPreimageDialogOpen}
        onClose={() => setIsPreimageDialogOpen(false)}
      />
      {multisigData && (
        <ShareMultisigDialog
          hash={multisigData.hash}
          callData={multisigData.callData}
          multisig={form.values.adminMultisig}
          open={isMultisigDialogOpen}
          onClose={() => setIsMultisigDialogOpen(false)}
        />
      )}
      <FormikProvider value={form}>
        <Form ref={formRef} noValidate>
          <PageHeader
            icon={<PoolIcon icon={form.values.poolIcon}>{(form.values.poolName || 'New Pool')[0]}</PoolIcon>}
            title={form.values.poolName || 'New Pool'}
            subtitle={
              <TextWithPlaceholder isLoading={waitingForStoredIssuer} width={15}>
                by {form.values.issuerName || (address && truncate(address))}
              </TextWithPlaceholder>
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
              <Box gridColumn="span 2">
                <Field name="poolType" validate={validate.poolType}>
                  {({ field, form, meta }: FieldProps) => (
                    <Select
                      name="poolType"
                      label={<Tooltips type="poolType" variant="secondary" />}
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
              </Box>
              <Box gridColumn="span 2" width="100%">
                <Field name="poolIcon" validate={validate.poolIcon}>
                  {({ field, meta, form }: FieldProps) => (
                    <FileUpload
                      name="poolIcon"
                      file={field.value}
                      onFileChange={async (file) => {
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
                      name="assetClass"
                      label={<Tooltips type="assetClass" label="Asset class*" variant="secondary" />}
                      onChange={(event) => {
                        form.setFieldValue('assetClass', event.target.value)
                        form.setFieldValue('subAssetClass', '', false)
                      }}
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
                <Field name="subAssetClass" validate={validate.subAssetClass}>
                  {({ field, meta, form }: FieldProps) => (
                    <Select
                      name="subAssetClass"
                      label="Secondary asset class"
                      onChange={(event) => form.setFieldValue('subAssetClass', event.target.value)}
                      onBlur={field.onBlur}
                      errorMessage={meta.touched && meta.error ? meta.error : undefined}
                      value={field.value}
                      options={subAssetClasses}
                      placeholder="Select..."
                    />
                  )}
                </Field>
              </Box>
              <Box gridColumn="span 2">
                <Field name="currency" validate={validate.currency}>
                  {({ field, form, meta }: FieldProps) => (
                    <Select
                      name="currency"
                      label={<Tooltips type="currency" label="Currency*" variant="secondary" />}
                      onChange={(event) => form.setFieldValue('currency', event.target.value)}
                      onBlur={field.onBlur}
                      errorMessage={meta.touched && meta.error ? meta.error : undefined}
                      value={field.value}
                      options={currencies?.map((c) => ({ value: c.symbol, label: c.symbol })) ?? []}
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
                      currency={form.values.currency}
                      onChange={(value) => form.setFieldValue('maxReserve', value)}
                    />
                  )}
                </Field>
              </Box>
              <Box gridColumn="span 2">
                <FieldWithErrorMessage
                  validate={validate.podEndpoint}
                  name="podEndpoint"
                  as={TextInput}
                  label={`POD endpoint`}
                  placeholder="https://"
                />
              </Box>
            </Grid>
          </PageSection>
          <PageSection title="Issuer">
            <IssuerInput waitingForStoredIssuer={waitingForStoredIssuer} />
          </PageSection>
          <PageSection title="Pool analysis">
            <PoolReportsInput />
          </PageSection>

          <TrancheSection />
          <PoolFeeSection />

          <AdminMultisigSection />
          <Box position="sticky" bottom={0} backgroundColor="backgroundPage" zIndex={3}>
            <PageSection>
              <Shelf gap={1} justifyContent="end">
                <Text variant="body3">
                  Deposit required: {formatBalance(deposit, balances?.native.currency.symbol, 1)}
                </Text>
                <Button variant="secondary" onClick={() => history.goBack()}>
                  Cancel
                </Button>
                <Button
                  loading={form.isSubmitting || createProxiesIsPending || transactionIsPending}
                  type="submit"
                  loadingMessage={`Creating pool ${form.isSubmitting || createProxiesIsPending ? '1/2' : '2/2'}`}
                >
                  Create
                </Button>
              </Shelf>
            </PageSection>
          </Box>
        </Form>
      </FormikProvider>
    </>
  )
}
