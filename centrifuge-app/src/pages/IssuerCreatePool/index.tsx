import {
  AddFee,
  CurrencyKey,
  isSameAddress,
  PoolMetadataInput,
  TrancheInput,
  TransactionOptions,
} from '@centrifuge/centrifuge-js'
import { Box, Button, Step, Stepper, Text } from '@centrifuge/fabric'
import { createKeyMulti, sortAddresses } from '@polkadot/util-crypto'
import BN from 'bn.js'
import { Form, FormikProvider, useFormik } from 'formik'
import { useEffect, useRef, useState } from 'react'
import { combineLatest, switchMap } from 'rxjs'
import styled, { useTheme } from 'styled-components'
import {
  useAddress,
  useCentrifuge,
  useCentrifugeConsts,
  useCentrifugeTransaction,
  useWallet,
} from '../../../../centrifuge-react'
import { useDebugFlags } from '../../../src/components/DebugFlags'
import { Dec } from '../../../src/utils/Decimal'
import { useCreatePoolFee } from '../../../src/utils/useCreatePoolFee'
import { usePoolCurrencies } from '../../../src/utils/useCurrencies'
import { useIsAboveBreakpoint } from '../../../src/utils/useIsAboveBreakpoint'
import { config } from '../../config'
import { PoolDetailsSection } from './PoolDetailsSection'
import { PoolSetupSection } from './PoolSetupSection'
import { Line, PoolStructureSection } from './PoolStructureSection'
import { CreatePoolValues, initialValues } from './types'
import { validateValues } from './validate'

const StyledBox = styled(Box)`
  padding: 48px 80px 0px 80px;
  @media (max-width: ${({ theme }) => theme.breakpoints.S}) {
    padding: 12px;
  }
`

const stepFields: { [key: number]: string[] } = {
  1: ['assetClass', 'assetDenomination', 'subAssetClass'],
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
  3: ['investmentDetails', 'liquidityDetails'],
}

const txMessage = {
  immediate: 'Create pool',
  propose: 'Submit pool proposal',
  notePreimage: 'Note preimage',
}

const IssuerCreatePoolPage = () => {
  const theme = useTheme()
  const formRef = useRef<HTMLFormElement>(null)
  const isSmall = useIsAboveBreakpoint('S')
  const address = useAddress('substrate')
  const currencies = usePoolCurrencies()
  const centrifuge = useCentrifuge()
  const { poolCreationType } = useDebugFlags()
  const consts = useCentrifugeConsts()
  const { chainDecimals } = useCentrifugeConsts()
  const createType = (poolCreationType as TransactionOptions['createType']) || config.poolCreationType || 'immediate'
  const {
    substrate: { addMultisig },
  } = useWallet()

  const [step, setStep] = useState(1)
  const [stepCompleted, setStepCompleted] = useState({ 1: false, 2: false, 3: false })
  const [multisigData, setMultisigData] = useState<{ hash: string; callData: string }>()
  const [createdPoolId, setCreatedPoolId] = useState('')
  const [isMultisigDialogOpen, setIsMultisigDialogOpen] = useState(false)

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
          tranches: TrancheInput[],
          currency: CurrencyKey,
          maxReserve: BN,
          metadata: PoolMetadataInput,
          poolFees: AddFee['fee'][]
        ],
        options
      ) => {
        const [values, transferToMultisig, aoProxy, adminProxy, , , , , { adminMultisig }] = args
        const multisigAddr = adminMultisig && createKeyMulti(adminMultisig.signers, adminMultisig.threshold)
        const poolArgs = args.slice(3) as any
        return combineLatest([
          cent.getApi(),
          cent.pools.createPool(poolArgs, { createType: options?.createType, batch: true }),
        ]).pipe(
          switchMap(([api, poolSubmittable]) => {
            // BATCH https://polkadot.js.org/docs/kusama/extrinsics/#batchcalls-veccall
            api.tx.utlity.batch()

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
                  consts.proxy.proxyDepositFactor.add(consts.uniques.collectionDeposit)
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
        if (form.values.adminMultisigEnabled && form.values.adminMultisig.threshold > 1) setIsMultisigDialogOpen(true)
        const [, , , , poolId] = args
        if (createType === 'immediate') {
          setCreatedPoolId(poolId)
        }
      },
    }
  )

  const form = useFormik({
    initialValues,
    validate: (values) => validateValues(values),
    validateOnMount: true,
    onSubmit: async (values, { setSubmitting }) => {
      const poolId = await centrifuge.pools.getAvailablePoolId()
      if (!currencies || !address) return

      const metadataValues: PoolMetadataInput = { ...values } as any

      // find the currency (asset denomination in UI)
      const currency = currencies.find((c) => c.symbol === values.assetDenomination)!

      // Handle admin multisig
      metadataValues.adminMultisig =
        values.adminMultisigEnabled && values.adminMultisig.threshold > 1
          ? {
              ...values.adminMultisig,
              signers: sortAddresses(values.adminMultisig.signers),
            }
          : undefined

      // // Get the currency for the pool

      // // Pool ID and required assets
      // if (!values.poolIcon) {
      //   return
      // }

      // const pinFile = async (file: File): Promise<FileType> => {
      //   const pinned = await lastValueFrom(centrifuge.metadata.pinFile(await getFileDataURI(file)))
      //   return { uri: pinned.uri, mime: file.type }
      // }

      // // Handle pinning files (pool icon, issuer logo, and executive summary)
      // const promises = [pinFile(values.poolIcon)]

      // if (values.issuerLogo) {
      //   promises.push(pinFile(values.issuerLogo))
      // }

      // if (values.executiveSummary) {
      //   promises.push(pinFile(values.executiveSummary))
      // }

      // const [pinnedPoolIcon, pinnedIssuerLogo, pinnedExecSummary] = await Promise.all(promises)

      // metadataValues.issuerLogo = pinnedIssuerLogo?.uri
      //   ? { uri: pinnedIssuerLogo.uri, mime: values?.issuerLogo?.type || '' }
      //   : null

      // metadataValues.executiveSummary = values.executiveSummary
      //   ? { uri: pinnedExecSummary.uri, mime: values.executiveSummary.type }
      //   : null

      // metadataValues.poolIcon = { uri: pinnedPoolIcon.uri, mime: values.poolIcon.type }

      // // Handle pool report if available
      // if (values.reportUrl) {
      //   let avatar = null
      //   if (values.reportAuthorAvatar) {
      //     const pinned = await pinFile(values.reportAuthorAvatar)
      //     avatar = { uri: pinned.uri, mime: values.reportAuthorAvatar.type }
      //   }
      //   metadataValues.poolReport = {
      //     authorAvatar: avatar,
      //     authorName: values.reportAuthorName,
      //     authorTitle: values.reportAuthorTitle,
      //     url: values.reportUrl,
      //   }
      // }

      // // Handle pool ratings
      // if (values.poolRatings) {
      //   const newRatingReportPromise = await Promise.all(
      //     values.poolRatings.map((rating) => (rating.reportFile ? pinFile(rating.reportFile) : null))
      //   )
      //   const ratings = values.poolRatings.map((rating, index) => {
      //     let reportFile: FileType | null = rating.reportFile
      //       ? { uri: rating.reportFile.name, mime: rating.reportFile.type }
      //       : null
      //     if (rating.reportFile && newRatingReportPromise[index]?.uri) {
      //       reportFile = newRatingReportPromise[index] ?? null
      //     }
      //     return {
      //       agency: rating.agency ?? '',
      //       value: rating.value ?? '',
      //       reportUrl: rating.reportUrl ?? '',
      //       reportFile: reportFile ?? null,
      //     }
      //   })
      //   metadataValues.poolRatings = ratings
      // }

      // // Organize tranches
      // const nonJuniorTranches = metadataValues.tranches.slice(1)
      // const tranches = [
      //   {},
      //   ...nonJuniorTranches.map((tranche) => ({
      //     interestRatePerSec: Rate.fromAprPercent(tranche.interestRate),
      //     minRiskBuffer: Perquintill.fromPercent(tranche.minRiskBuffer),
      //   })),
      // ]

      // // Pool fees
      // const feeId = await firstValueFrom(centrifuge.pools.getNextPoolFeeId())
      // const poolFees: AddFee['fee'][] = values.poolFees.map((fee, i) => {
      //   return {
      //     name: fee.name,
      //     destination: fee.walletAddress,
      //     amount: Rate.fromPercent(fee.percentOfNav),
      //     feeType: fee.feeType,
      //     limit: 'ShareOfPortfolioValuation',
      //     account: fee.feeType === 'chargedUpTo' ? fee.walletAddress : undefined,
      //     feePosition: fee.feePosition,
      //   }
      // })
      // metadataValues.poolFees = poolFees.map((fee, i) => ({
      //   name: fee.name,
      //   id: feeId + i,
      //   feePosition: fee.feePosition,
      //   feeType: fee.feeType,
      // }))

      // if (metadataValues.adminMultisig && metadataValues.adminMultisig.threshold > 1) {
      //   addMultisig(metadataValues.adminMultisig)
      // }

      // createProxies([
      //   (aoProxy, adminProxy) => {
      //     createPoolTx(
      //       [
      //         values,
      //         CurrencyBalance.fromFloat(createDeposit, chainDecimals),
      //         aoProxy,
      //         adminProxy,
      //         poolId,
      //         tranches,
      //         currency.key,
      //         CurrencyBalance.fromFloat(values.maxReserve, currency.decimals),
      //         metadataValues,
      //         poolFees,
      //       ],
      //       { createType }
      //     )
      //   },
      // ])
    },
  })

  const { proposeFee, poolDeposit, proxyDeposit, collectionDeposit } = useCreatePoolFee(form?.values)

  const createDeposit = (proposeFee?.toDecimal() ?? Dec(0))
    .add(poolDeposit.toDecimal())
    .add(collectionDeposit.toDecimal())

  const deposit = createDeposit.add(proxyDeposit.toDecimal())

  const { values, errors } = form

  const checkStepCompletion = (stepNumber: number) => {
    const fields = stepFields[stepNumber]
    return fields.every(
      (field) =>
        values[field as keyof typeof values] !== null &&
        values[field as keyof typeof values] !== '' &&
        !errors[field as keyof typeof errors]
    )
  }

  const handleNextStep = () => {
    setStep((prevStep) => prevStep + 1)
  }

  useEffect(() => {
    setStepCompleted((prev) => ({
      ...prev,
      [step]: checkStepCompletion(step),
    }))
  }, [values, step])

  return (
    <>
      <FormikProvider value={form}>
        <Form ref={formRef} noValidate>
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
              <Step label="Pool structure" isStepCompleted={stepCompleted[1]} />
              <Step label="Pool details" isStepCompleted={stepCompleted[2]} />
              <Step label="Pool setup" />
            </Stepper>
          </Box>
          {step === 1 && (
            <Box px={2} py={2} display="flex" justifyContent="center" backgroundColor="statusInfoBg">
              <Text variant="body3">
                A deposit of <b>1100 CFG</b> is required to create this pool. Please make sure you have sufficient funds
                in your wallet.
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
              <Button style={{ width: 163 }} small onClick={handleNextStep}>
                {step === 3 ? 'Create pool' : 'Next'}
              </Button>
            </Box>
          </StyledBox>
        </Form>
      </FormikProvider>
    </>
  )
}

export default IssuerCreatePoolPage
