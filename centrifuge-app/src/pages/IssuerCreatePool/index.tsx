import { CurrencyBalance, Perquintill, Rate } from '@centrifuge/centrifuge-js'
import { PoolMetadataInput } from '@centrifuge/centrifuge-js/dist/modules/pools'
import {
  Box,
  Button,
  CurrencyInput,
  FileUpload,
  Grid,
  Select,
  Text,
  TextInput,
  TextWithPlaceholder,
  Thumbnail,
} from '@centrifuge/fabric'
import { Field, FieldProps, Form, FormikErrors, FormikProvider, setIn, useFormik } from 'formik'
import * as React from 'react'
import { useQueryClient } from 'react-query'
import { useHistory } from 'react-router'
import { filter, lastValueFrom } from 'rxjs'
import { useCentrifuge } from '../../components/CentrifugeProvider'
import { PreimageHashDialog } from '../../components/Dialogs/PreimageHashDialog'
import { FieldWithErrorMessage } from '../../components/FieldWithErrorMessage'
import { PageHeader } from '../../components/PageHeader'
import { PageSection } from '../../components/PageSection'
import { PageWithSideBar } from '../../components/PageWithSideBar'
import { Tooltips } from '../../components/Tooltips'
import { config } from '../../config'
import { formatBalance } from '../../utils/formatting'
import { getFileDataURI } from '../../utils/getFileDataURI'
import { useAddress } from '../../utils/useAddress'
import { useBalances } from '../../utils/useBalances'
import { useCentrifugeTransaction } from '../../utils/useCentrifugeTransaction'
import { usePoolCurrencies } from '../../utils/useCurrencies'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { usePools } from '../../utils/usePools'
import { useProposalEstimate } from '../../utils/useProposalEstimate'
import { truncate } from '../../utils/web3'
import { IssuerInput } from './IssuerInput'
import { RiskGroupsSection } from './RiskGroupsInput'
import { TrancheSection } from './TrancheInput'
import { useStoredIssuer } from './useStoredIssuer'
import { validate } from './validate'

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
export interface RiskGroupInput {
  groupName: string
  advanceRate: number | ''
  fee: number | ''
  probabilityOfDefault: number | ''
  lossGivenDefault: number | ''
  discountRate: number | ''
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

export const createEmptyRiskGroup = (): RiskGroupInput => ({
  groupName: '',
  advanceRate: '',
  fee: '',
  probabilityOfDefault: '',
  lossGivenDefault: '',
  discountRate: '',
})

export type CreatePoolValues = Omit<PoolMetadataInput, 'poolIcon' | 'issuerLogo' | 'executiveSummary'> & {
  poolIcon: File | null
  issuerLogo: File | null
  executiveSummary: File | null
}

const initialValues: CreatePoolValues = {
  poolIcon: null,
  poolName: '',
  assetClass: DEFAULT_ASSET_CLASS,
  currency: '',
  maxReserve: '',
  epochHours: 23, // in hours
  epochMinutes: 50, // in minutes
  podEndpoint: config.defaultPodUrl ?? '',

  issuerName: '',
  issuerLogo: null,
  issuerDescription: '',

  executiveSummary: null,
  website: '',
  forum: '',
  email: '',

  tranches: [createEmptyTranche(true)],
  riskGroups: [createEmptyRiskGroup()],
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

const CreatePoolForm: React.VFC = () => {
  const address = useAddress()
  const centrifuge = useCentrifuge()
  const currencies = usePoolCurrencies()
  const pools = usePools()
  const history = useHistory()
  const balances = useBalances(address)
  const queryClient = useQueryClient()
  const { data: storedIssuer, isLoading: isStoredIssuerLoading } = useStoredIssuer()
  const [waitingForStoredIssuer, setWaitingForStoredIssuer] = React.useState(true)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [preimageHash, setPreimageHash] = React.useState('')
  const [createdPoolId, setCreatedPoolId] = React.useState('')

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
    txMessage[config.poolCreationType || 'immediate'],
    (cent) => cent.pools.createPool,
    {
      onSuccess: (args) => {
        const [, poolId] = args
        if (config.poolCreationType === 'immediate') {
          setCreatedPoolId(poolId)
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

      return errors
    },
    validateOnMount: true,
    onSubmit: async (values, { setSubmitting }) => {
      if (!currencies) return
      const metadataValues: PoolMetadataInput = { ...values } as any
      if (!address) return

      const currency = currencies.find((c) => c.symbol === values.currency)!

      const poolId = await centrifuge.pools.getAvailablePoolId()
      const collectionId = await centrifuge.nfts.getAvailableCollectionId()
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

      // tranches must be reversed (most junior is the first in the UI but the last in the API)
      const nonJuniorTranches = metadataValues.tranches.slice(1)
      const tranches = [
        {}, // most junior tranche
        ...nonJuniorTranches.map((tranche) => ({
          interestRatePerSec: Rate.fromAprPercent(tranche.interestRate),
          minRiskBuffer: Perquintill.fromPercent(tranche.minRiskBuffer),
        })),
      ]

      // const epochSeconds = ((values.epochHours as number) * 60 + (values.epochMinutes as number)) * 60

      createPoolTx(
        [
          address,
          poolId,
          collectionId,
          tranches,
          currency.key,
          CurrencyBalance.fromFloat(values.maxReserve, currency.decimals),
          metadataValues,
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

  React.useEffect(() => {
    if (config.poolCreationType === 'notePreimage') {
      const $events = centrifuge
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
  }, [centrifuge])

  const formRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(form, formRef)

  const { proposeFee } = useProposalEstimate(form?.values)

  return (
    <>
      <PreimageHashDialog preimageHash={preimageHash} open={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
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
            actions={
              <>
                {proposeFee && (
                  <Text variant="body3">
                    Deposit required: ~{formatBalance(proposeFee, balances?.native.currency.symbol, 1)}
                  </Text>
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
                      variant="small"
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

          <TrancheSection />

          <RiskGroupsSection />
        </Form>
      </FormikProvider>
    </>
  )
}
