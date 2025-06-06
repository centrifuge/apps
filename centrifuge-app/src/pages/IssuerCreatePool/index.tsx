import {
  AddFee,
  CurrencyBalance,
  CurrencyKey,
  FileType,
  isSameAddress,
  Perquintill,
  PoolFeesCreatePool,
  PoolMetadataInput,
  Rate,
  TrancheCreatePool,
  TransactionOptions,
} from '@centrifuge/centrifuge-js'
import { Box, Button, Dialog, Step, Stepper, Text } from '@centrifuge/fabric'
import { createKeyMulti, sortAddresses } from '@polkadot/util-crypto'
import BN from 'bn.js'
import { Form, FormikProvider, useFormik } from 'formik'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { combineLatest, firstValueFrom, switchMap, tap } from 'rxjs'
import styled, { useTheme } from 'styled-components'
import {
  useAddress,
  useCentrifuge,
  useCentrifugeApi,
  useCentrifugeConsts,
  useCentrifugeTransaction,
  useWallet,
} from '../../../../centrifuge-react'
import { useDebugFlags } from '../../../src/components/DebugFlags'
import { PreimageHashDialog } from '../../../src/components/Dialogs/PreimageHashDialog'
import { ShareMultisigDialog } from '../../../src/components/Dialogs/ShareMultisigDialog'
import { Dec } from '../../../src/utils/Decimal'
import { useCreatePoolFee } from '../../../src/utils/useCreatePoolFee'
import { usePoolCurrencies } from '../../../src/utils/useCurrencies'
import { useIsAboveBreakpoint } from '../../../src/utils/useIsAboveBreakpoint'
import { usePools } from '../../../src/utils/usePools'
import { config } from '../../config'
import { PoolDetailsSection } from './PoolDetailsSection'
import { PoolSetupSection } from './PoolSetupSection'
import { Line, PoolStructureSection } from './PoolStructureSection'
import { createEmptyTranche, createPoolFee, CreatePoolValues } from './types'
import { pinFileIfExists, pinFiles } from './utils'
import { validateValues } from './validate'

const PROPOSAL_URL = 'https://centrifuge.subsquare.io/democracy/referenda'

const StyledBox = styled(Box)`
  padding: 48px 80px 0px 80px;
  @media (max-width: ${({ theme }) => theme.breakpoints.S}) {
    padding: 12px;
  }
`

const stepFields: { [key: number]: string[] } = {
  1: ['assetClass', 'assetDenomination', 'subAssetClass', 'tranches'],
  2: [
    'poolName',
    'poolIcon',
    'investorType',
    'maxReserve',
    'poolType',
    'issuerName',
    'issuerShortDescription',
    'issuerDescription',
  ],
  3: ['assetOriginators', 'adminMultisig'],
}

const txMessage = {
  immediate: 'Create pool',
  propose: 'Submit pool proposal',
  notePreimage: 'Note preimage',
}

const IssuerCreatePoolPage = () => {
  const theme = useTheme()
  const formRef = useRef<HTMLFormElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isSmall = useIsAboveBreakpoint('S')
  const address = useAddress('substrate')
  const navigate = useNavigate()
  const currencies = usePoolCurrencies()
  const centrifuge = useCentrifuge()
  const api = useCentrifugeApi()
  const { poolCreationType } = useDebugFlags()
  const consts = useCentrifugeConsts()
  const { chainDecimals } = useCentrifugeConsts()
  const pools = usePools()
  const createType = (poolCreationType as TransactionOptions['createType']) || config.poolCreationType || 'immediate'
  const { substrate } = useWallet()

  const [step, setStep] = useState(1)
  const [stepCompleted, setStepCompleted] = useState({ 1: false, 2: false, 3: false })
  const [multisigData, setMultisigData] = useState<{ hash: string; callData: string }>()
  const [isMultisigDialogOpen, setIsMultisigDialogOpen] = useState(false)
  const [createdModal, setCreatedModal] = useState(false)
  const [preimageHash, setPreimageHash] = useState('')
  const [isPreimageDialogOpen, setIsPreimageDialogOpen] = useState(false)
  const [proposalId, setProposalId] = useState<string | null>(null)
  const [poolId, setPoolId] = useState<string | null>(null)

  useEffect(() => {
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

  useEffect(() => {
    if (poolId && pools?.find((p) => p.id === poolId)) {
      // Redirecting only when we find the newly created pool in the data from usePools
      // Otherwise the Issue Overview page will throw an error when it can't find the pool
      // It can take a second for the new data to come in after creating the pool
      navigate(`/pools/${poolId}`)
    }
  }, [poolId, pools, navigate])

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

  const { execute: createPoolTx, isLoading: transactionIsPending } = useCentrifugeTransaction(
    `${txMessage[createType]} 2/2`,
    (cent) =>
      (
        args: [
          values: CreatePoolValues,
          transferToMultisig: BN,
          aoProxy: string,
          adminProxy: string,
          poolId: string,
          tranches: TrancheCreatePool[],
          currency: CurrencyKey,
          maxReserve: BN,
          metadata: PoolMetadataInput,
          poolFees: PoolFeesCreatePool[]
        ],
        options
      ) => {
        const [values, transferToMultisig, aoProxy, adminProxy, , , , , { adminMultisig, assetOriginators }] = args
        const multisigAddr = adminMultisig && createKeyMulti(adminMultisig.signers, adminMultisig.threshold)
        const poolArgs = args.slice(3) as any
        return combineLatest([
          cent.getApi(),
          cent.pools.createPool(poolArgs, { createType: options?.createType, batch: true }),
        ]).pipe(
          switchMap(([api, poolSubmittable]) => {
            const adminProxyDelegates = multisigAddr
              ? [multisigAddr]
              : (adminMultisig && values.adminMultisig?.signers?.filter((addr) => addr !== address)) ?? []
            const otherMultisigSigners =
              multisigAddr && sortAddresses(adminMultisig.signers.filter((addr) => !isSameAddress(addr, address!)))
            const proxiedPoolCreate = api.tx.proxy.proxy(adminProxy, undefined, poolSubmittable)
            const submittable = api.tx.utility.batchAll(
              [
                api.tx.balances.transferKeepAlive(adminProxy, consts.proxy.proxyDepositFactor.add(transferToMultisig)),
                api.tx.balances.transferKeepAlive(
                  aoProxy,
                  consts.proxy.proxyDepositFactor
                    .add(consts.uniques.collectionDeposit)
                    .add(consts.proxy.proxyDepositFactor.mul(new BN(assetOriginators.length * 4)))
                ),
                adminProxyDelegates.length > 0 &&
                  api.tx.proxy.proxy(
                    adminProxy,
                    undefined,
                    api.tx.utility.batchAll(
                      [
                        ...adminProxyDelegates.map((addr) => api.tx.proxy.addProxy(addr, 'Any', 0)),
                        multisigAddr ? api.tx.proxy.removeProxy(address, 'Any', 0) : null,
                      ].filter(Boolean)
                    )
                  ),
                api.tx.proxy.proxy(
                  aoProxy,
                  undefined,
                  api.tx.utility.batchAll(
                    [
                      api.tx.proxy.addProxy(adminProxy, 'Any', 0),
                      ...assetOriginators.map((addr) => [
                        api.tx.proxy.addProxy(addr, 'Borrow', 0),
                        api.tx.proxy.addProxy(addr, 'Invest', 0),
                        api.tx.proxy.addProxy(addr, 'Transfer', 0),
                        api.tx.proxy.addProxy(addr, 'PodOperation', 0),
                      ]),
                      api.tx.proxy.removeProxy(address, 'Any', 0),
                    ].flat()
                  )
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
      onSuccess: (args, result) => {
        if (form.values.adminMultisigEnabled && form.values.adminMultisig.threshold > 1) {
          setIsMultisigDialogOpen(true)
        }
        const [, , , , poolId] = args
        if (createType === 'immediate') {
          setPoolId(poolId)
        } else {
          const event = result.events.find(({ event }) => api.events.democracy.Proposed.is(event))
          if (event) {
            const eventData = event.toHuman() as any
            const proposalId = eventData.event.data.proposalIndex.replace(/\D/g, '')
            setCreatedModal(true)
            setProposalId(proposalId)
          }
        }
      },
    }
  )

  const form = useFormik<CreatePoolValues>({
    initialValues: {
      // pool structure
      poolStructure: 'revolving',
      assetClass: 'Private credit',
      assetDenomination: 'USDC',
      subAssetClass: '',
      tranches: [createEmptyTranche('Junior')],
      // pool details section
      poolName: '',
      poolIcon: null,
      maxReserve: 1000000,
      investorType: '',
      issuerName: null,
      issuerRepName: '',
      issuerLogo: null,
      issuerDescription: '',
      issuerShortDescription: '',
      issuerCategories: [{ type: '', value: '' }],
      poolRatings: [{ agency: '', value: '', reportUrl: '', reportFile: null }],
      executiveSummary: null,
      website: '',
      forum: '',
      email: '',
      details: [],
      report: {
        author: {
          name: '',
          title: '',
          avatar: null,
        },
        url: '',
      },
      assetOriginators: [''],
      adminMultisig: {
        signers: [substrate?.selectedAddress ?? ''],
        threshold: 1,
      },
      adminMultisigEnabled: false,
      poolFees: [createPoolFee()],
      poolType: 'open',
      onboarding: {
        tranches: {},
        taxInfoRequired: false,
      },
      onboardingExperience: 'none',
    },
    validate: (values) => validateValues(values),
    validateOnMount: true,
    onSubmit: async (values, { setSubmitting }) => {
      const poolId = await centrifuge.pools.getAvailablePoolId()

      if (!currencies || !address || step !== 3) return

      const metadataValues: PoolMetadataInput = { ...values } as any

      // Find the currency (asset denomination in UI)
      const currency = currencies.find((c) => c.symbol.toLowerCase() === values.assetDenomination.toLowerCase())!

      // Handle pining files for ipfs
      if (!values.poolIcon) return

      const filesToPin = {
        poolIcon: values.poolIcon,
        issuerLogo: values.issuerLogo,
        executiveSummary: values.executiveSummary,
        authorAvatar: values.report.author.avatar,
      }

      const pinnedFiles = await pinFiles(centrifuge, filesToPin)
      if (pinnedFiles.poolIcon) metadataValues.poolIcon = pinnedFiles.poolIcon as FileType
      if (pinnedFiles.issuerLogo) metadataValues.issuerLogo = pinnedFiles.issuerLogo as FileType
      if (pinnedFiles.executiveSummary) metadataValues.executiveSummary = pinnedFiles.executiveSummary

      // Pool ratings
      if (values.poolRatings[0].agency === '') {
        metadataValues.poolRatings = []
      } else {
        const newRatingReports = await Promise.all(
          values.poolRatings.map((rating) => pinFileIfExists(centrifuge, rating.reportFile ?? null))
        )
        const ratings = values.poolRatings.map((rating, index) => {
          const pinnedReport = newRatingReports[index]
          return {
            agency: rating.agency,
            value: rating.value,
            reportUrl: rating.reportUrl,
            reportFile: pinnedReport ? { uri: pinnedReport.uri, mime: rating.reportFile?.type ?? '' } : null,
          }
        })
        metadataValues.poolRatings = ratings
      }

      // Tranches
      const tranches: TrancheCreatePool[] = metadataValues.tranches.map((tranche, index) => {
        const trancheType =
          index === 0
            ? 'Residual'
            : {
                NonResidual: {
                  interestRatePerSec: Rate.fromAprPercent(tranche.interestRate).toString(),
                  minRiskBuffer: Perquintill.fromPercent(tranche.minRiskBuffer).toString(),
                },
              }

        return {
          trancheType,
          metadata: {
            tokenName:
              metadataValues.tranches.length > 1 ? `${metadataValues.poolName} ${tranche.tokenName}` : 'Junior',
            tokenSymbol: tranche.symbolName,
          },
        }
      })

      // Pool fees
      const feeId = await firstValueFrom(centrifuge.pools.getNextPoolFeeId())
      const poolFees: AddFee['fee'][] = values.poolFees.map((fee) => {
        return {
          name: fee.name,
          destination: fee.walletAddress,
          amount: Rate.fromPercent(fee.percentOfNav),
          feeType: fee.feeType,
          limit: 'ShareOfPortfolioValuation',
          account: fee.feeType === 'chargedUpTo' ? fee.walletAddress : undefined,
          feePosition: fee.feePosition,
        }
      })
      metadataValues.poolFees = poolFees.map((fee, i) => ({
        name: fee.name,
        id: feeId + i,
        feePosition: fee.feePosition,
        feeType: fee.feeType,
      }))

      const feeInput = poolFees.map((fee) => {
        return [
          'Top',
          {
            destination: fee.destination,
            editor: fee?.account ? { account: fee.account } : 'Root',
            feeType: { [fee.feeType]: { limit: { [fee.limit]: fee?.amount } } },
          },
        ]
      })

      // Multisign
      metadataValues.adminMultisig =
        values.adminMultisigEnabled && values.adminMultisig.threshold > 1
          ? {
              ...values.adminMultisig,
              signers: sortAddresses(values.adminMultisig.signers),
            }
          : undefined

      if (metadataValues.adminMultisig && metadataValues.adminMultisig.threshold > 1) {
        substrate.addMultisig(metadataValues.adminMultisig)
      }

      // Onboarding
      if (metadataValues.onboardingExperience === 'none') {
        metadataValues.onboarding = {
          taxInfoRequired: metadataValues.onboarding?.taxInfoRequired,
          tranches: {},
        }
      }

      // Issuer categories
      if (values.issuerCategories[0].value === '') {
        metadataValues.issuerCategories = []
      }

      createProxies([
        (aoProxy, adminProxy) => {
          createPoolTx(
            [
              values,
              CurrencyBalance.fromFloat(createDeposit, chainDecimals),
              aoProxy,
              adminProxy,
              poolId,
              tranches,
              currency.key,
              CurrencyBalance.fromFloat(values.maxReserve, currency.decimals),
              metadataValues,
              feeInput,
            ],
            { createType }
          )
        },
      ])

      setSubmitting(false)
    },
  })

  const { proposeFee, poolDeposit, proxyDeposit, collectionDeposit } = useCreatePoolFee(form?.values)

  const createDeposit = (proposeFee?.toDecimal() ?? Dec(0))
    .add(poolDeposit.toDecimal())
    .add(collectionDeposit.toDecimal())

  const deposit = createDeposit.add(proxyDeposit.toDecimal())

  const { values, errors } = form

  const checkStepCompletion = useCallback(
    (stepNumber: number) => {
      const fields = stepFields[stepNumber]

      let isValid = fields.every((field) => {
        const value = values[field as keyof typeof values]
        const error = errors[field as keyof typeof errors]
        return value !== null && value !== '' && !error
      })

      if (values.issuerCategories.length > 1 && errors.issuerCategories) {
        isValid = false
      }

      if (values.poolRatings.length > 1 && errors.poolRatings) {
        isValid = false
      }

      return isValid
    },
    [values, errors]
  )

  useEffect(() => {
    setStepCompleted((prev) => ({
      ...prev,
      [step]: checkStepCompletion(step),
    }))
  }, [values, errors, step, checkStepCompletion])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [step, containerRef])

  return (
    <div ref={containerRef} style={{ maxHeight: '100vh', overflowY: 'auto' }}>
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
      <Box padding={3}>
        <Text variant="heading2">New pool setup</Text>
      </Box>
      <Box
        backgroundColor={theme.colors.backgroundSecondary}
        padding={isSmall ? '32px 208px' : '12px'}
        borderTop={`1px solid ${theme.colors.borderPrimary}`}
        borderBottom={`1px solid ${theme.colors.borderPrimary}`}
      >
        <Stepper activeStep={step} setActiveStep={setStep} direction="row">
          <Step label="Pool structure" isStepCompleted={stepCompleted[1] && step !== 1} />
          <Step label="Pool details" isStepCompleted={stepCompleted[2] && step !== 2} />
          <Step label="Pool setup" />
        </Stepper>
      </Box>
      <FormikProvider value={form}>
        <Form ref={formRef} noValidate>
          {step === 1 && (
            <Box px={2} py={2} display="flex" justifyContent="center" backgroundColor="statusInfoBg">
              <Text variant="body3">
                A deposit of <b>{deposit.toNumber()} CFG</b> is required to create this pool. Please make sure you have
                sufficient funds in your wallet.
              </Text>
            </Box>
          )}
          <StyledBox padding="48px 80px 0px 80px">
            {step === 1 && <PoolStructureSection />}
            {step === 2 && <PoolDetailsSection />}
            {step === 3 && <PoolSetupSection />}
            <Line />
            <Box display="flex" justifyContent="flex-end" mt={2} mb={4}>
              {step !== 1 && (
                <Button
                  style={{ width: 163, marginRight: 8 }}
                  small
                  onClick={() => setStep(step - 1)}
                  variant="inverted"
                >
                  Previous
                </Button>
              )}
              {step === 3 ? (
                <Button
                  style={{ width: 163 }}
                  small
                  onClick={() => form.handleSubmit()}
                  loading={createProxiesIsPending || transactionIsPending || form.isSubmitting}
                  disabled={Object.keys(errors).length > 0}
                >
                  Create pool
                </Button>
              ) : (
                <Button style={{ width: 163 }} small onClick={() => setStep((prevStep) => prevStep + 1)}>
                  Next
                </Button>
              )}
            </Box>
          </StyledBox>
        </Form>
      </FormikProvider>
      {createdModal && (
        <Dialog isOpen={createdModal} onClose={() => setCreatedModal(false)} width={426} hideButton>
          <Box display="flex" justifyContent="center" flexDirection="column" alignItems="center">
            <Text variant="heading1">Your pool is almost ready!</Text>
            <Text variant="body2" style={{ marginTop: 24 }}>
              A governance proposal to launch this pool has been submitted on your behalf. Once the proposal is
              approved, your pool will go live.
            </Text>
            <Box mt={2} display="flex" justifyContent="center">
              <Button onClick={() => setCreatedModal(false)} variant="inverted" style={{ width: 140, marginRight: 16 }}>
                Close
              </Button>
              <Button style={{ width: 160 }} onClick={() => navigate(`${PROPOSAL_URL}/${proposalId}`)}>
                See proposal
              </Button>
            </Box>
          </Box>
        </Dialog>
      )}
    </div>
  )
}

export default IssuerCreatePoolPage
