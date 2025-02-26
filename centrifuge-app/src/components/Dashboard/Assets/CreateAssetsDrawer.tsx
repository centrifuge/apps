import { CurrencyBalance, LoanInfoInput, NFTMetadataInput, Price, Rate } from '@centrifuge/centrifuge-js'
import {
  useCentrifuge,
  useCentrifugeApi,
  useCentrifugeTransaction,
  wrapProxyCallsForAccount,
} from '@centrifuge/centrifuge-react'
import { Box, Divider, Drawer, Select } from '@centrifuge/fabric'
import { BN } from 'bn.js'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import { useState } from 'react'
import { Navigate } from 'react-router'
import { firstValueFrom, lastValueFrom, switchMap } from 'rxjs'
import { LoanTemplate } from '../../../types'
import { useSelectedPools } from '../../../utils/contexts/SelectedPoolsContext'
import { getFileDataURI } from '../../../utils/getFileDataURI'
import { useMetadata } from '../../../utils/useMetadata'
import { useFilterPoolsByUserRole, usePoolAccess, useSuitableAccounts } from '../../../utils/usePermissions'
import { LoadBoundary } from '../../LoadBoundary'
import { PoolWithMetadata, valuesToNftProperties } from '../utils'
import { CreateAssetsForm } from './CreateAssetForm'
import { FooterActionButtons } from './FooterActionButtons'
import { UploadAssetTemplateForm } from './UploadAssetTemplateForm'

export type UploadedTemplate = {
  id: string
  createdAt: string
}
interface CreateAssetsDrawerProps {
  open: boolean
  setOpen: (open: boolean) => void
  type: 'create-asset' | 'upload-template'
  setType: (type: 'create-asset' | 'upload-template') => void
}

export type CreateAssetFormValues = {
  image: File | null
  description: string
  attributes: Record<string, string | number>
  assetType: 'cash' | 'liquid' | 'fund' | 'custom'
  assetName: string
  customType: 'atPar' | 'discountedCashFlow'
  selectedPool: PoolWithMetadata
  maxBorrowQuantity: number | ''
  uploadedTemplates: UploadedTemplate[]
  oracleSource: 'isin' | 'assetSpecific'
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
  isin: string
  notional: number | ''
  withLinearPricing: boolean
}

export function CreateAssetsDrawer({ open, setOpen, type, setType }: CreateAssetsDrawerProps) {
  const api = useCentrifugeApi()
  const centrifuge = useCentrifuge()
  const filteredPools = useFilterPoolsByUserRole(type === 'upload-template' ? ['PoolAdmin'] : ['Borrower', 'PoolAdmin'])
  const { poolsWithMetadata } = useSelectedPools()
  const [isUploadingTemplates, setIsUploadingTemplates] = useState(false)
  const [redirect, setRedirect] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [pid, setPid] = useState<string>(poolsWithMetadata?.[0]?.id ?? '')
  const [account] = useSuitableAccounts({ poolId: pid, poolRole: ['Borrower'], proxyType: ['Borrow'] })
  const { assetOriginators } = usePoolAccess(pid)

  const collateralCollectionId = assetOriginators.find((ao) => ao.address === account?.actingAddress)
    ?.collateralCollections[0]?.id

  const templateIds =
    poolsWithMetadata.find((pool) => pool.id === pid)?.meta?.loanTemplates?.map((s: { id: string }) => s.id) ?? []
  const templateId = templateIds.at(-1)
  const { data: template } = useMetadata<LoanTemplate>(templateId)

  const { isLoading: isTxLoading, execute: doTransaction } = useCentrifugeTransaction(
    'Create asset',
    (cent) =>
      (
        [collectionId, nftId, owner, metadataUri, pricingInfo]: [string, string, string, string, LoanInfoInput],
        options
      ) => {
        return centrifuge.pools.createLoan([pid, collectionId, nftId, pricingInfo], { batch: true }).pipe(
          switchMap((createTx) => {
            const tx = api.tx.utility.batchAll([
              wrapProxyCallsForAccount(api, api.tx.uniques.mint(collectionId, nftId, owner), account, 'PodOperation'),
              wrapProxyCallsForAccount(
                api,
                api.tx.uniques.setMetadata(collectionId, nftId, metadataUri, false),
                account,
                'PodOperation'
              ),
              wrapProxyCallsForAccount(api, createTx, account, 'Borrow'),
            ])
            return cent.wrapSignAndSend(api, tx, { ...options, proxies: undefined })
          })
        )
      },
    {
      onSuccess: (_, result) => {
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

  const form = useFormik({
    initialValues: {
      image: null,
      description: '',
      attributes: {},
      assetType: 'cash',
      assetName: '',
      customType: 'atPar',
      selectedPool: poolsWithMetadata[0],
      uploadedTemplates: poolsWithMetadata[0]?.meta?.loanTemplates || ([] as UploadedTemplate[]),
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
    onSubmit: async (values) => {
      if (!pid || !collateralCollectionId || !template || !account) return
      setIsLoading(true)
      const decimals = form.values.selectedPool.currency.decimals
      let pricingInfo: LoanInfoInput | undefined
      switch (values.assetType) {
        case 'cash':
          pricingInfo = {
            valuationMethod: 'cash',
            advanceRate: Rate.fromPercent(100),
            interestRate: Rate.fromPercent(0),
            value: new BN(2).pow(new BN(128)).subn(1), // max uint128
            maxBorrowAmount: 'upToOutstandingDebt' as const,
            maturityDate: null,
          }
          break
        case 'liquid':
        case 'fund': {
          const loanId = await firstValueFrom(centrifuge.pools.getNextLoanId([pid]))
          pricingInfo = {
            valuationMethod: 'oracle',
            maxPriceVariation: Rate.fromPercent(9999),
            maxBorrowAmount: values.maxBorrowQuantity ? Price.fromFloat(values.maxBorrowQuantity) : null,
            priceId:
              values.oracleSource === 'isin'
                ? { isin: values.isin }
                : { poolLoanId: [pid, loanId.toString()] as [string, string] },
            maturityDate: values.maturity !== 'none' ? new Date(values.maturityDate) : null,
            interestRate: Rate.fromPercent(values.notional === 0 ? 0 : values.interestRate),
            notional: CurrencyBalance.fromFloat(values.notional, decimals),
            withLinearPricing: values.withLinearPricing,
          }
          break
        }
        case 'custom':
          if (values.customType === 'atPar') {
            pricingInfo = {
              valuationMethod: 'outstandingDebt',
              maxBorrowAmount: 'upToOutstandingDebt',
              value: CurrencyBalance.fromFloat(values.value, decimals),
              maturityDate: values.maturity !== 'none' ? new Date(values.maturityDate) : null,
              maturityExtensionDays: values.maturity === 'fixedWithExtension' ? values.maturityExtensionDays : null,
              advanceRate: Rate.fromPercent(values.advanceRate),
              interestRate: Rate.fromPercent(values.interestRate),
            }
          } else if (values.customType === 'discountedCashFlow') {
            pricingInfo = {
              valuationMethod: 'discountedCashFlow',
              maxBorrowAmount: 'upToTotalBorrowed',
              value: CurrencyBalance.fromFloat(values.value, decimals),
              maturityDate: values.maturity !== 'none' ? new Date(values.maturityDate) : null,
              maturityExtensionDays: values.maturity === 'fixedWithExtension' ? values.maturityExtensionDays : null,
              advanceRate: Rate.fromPercent(values.advanceRate),
              interestRate: Rate.fromPercent(values.interestRate),
              probabilityOfDefault: Rate.fromPercent(values.probabilityOfDefault || 0),
              lossGivenDefault: Rate.fromPercent(values.lossGivenDefault || 0),
              discountRate: Rate.fromPercent(values.discountRate || 0),
            }
          }
          break
        default:
          break
      }

      if (!pricingInfo) {
        throw new Error(`Pricing information is not set for asset type: ${values.assetType}`)
      }

      const properties =
        values.valuationMethod === 'cash'
          ? {}
          : { ...(valuesToNftProperties(values.attributes, template as any) as any), _template: templateId }

      const metadataValues: NFTMetadataInput = {
        name: values.assetName,
        description: values.description,
        properties,
      }

      if (values.image) {
        const fileDataUri = await getFileDataURI(values.image)
        const imageMetadataHash = await lastValueFrom(centrifuge.metadata.pinFile(fileDataUri))
        metadataValues.image = imageMetadataHash.uri
      }

      const metadataHash = await lastValueFrom(centrifuge.metadata.pinJson(metadataValues))
      const nftId = await centrifuge.nfts.getAvailableNftId(collateralCollectionId)

      doTransaction([collateralCollectionId, nftId, account.actingAddress, metadataHash.uri, pricingInfo], {
        account,
        forceProxyType: 'Borrow',
      })
      setIsLoading(false)
    },
  })

  const resetToDefault = () => {
    setOpen(false)
    setType('create-asset')
    setIsUploadingTemplates(false)
    form.resetForm()
  }

  if (redirect) {
    return <Navigate to={redirect} />
  }

  if (!filteredPools?.length || !poolsWithMetadata.length) return null

  return (
    <LoadBoundary>
      <Drawer
        isOpen={open}
        onClose={resetToDefault}
        title={type === 'upload-template' ? 'Upload asset template' : 'Create asset'}
      >
        <Divider color="backgroundSecondary" />
        <FormikProvider value={form}>
          <Form noValidate>
            <Box mb={2}>
              <Field name="poolId">
                {({ field, form }: FieldProps) => (
                  <Select
                    name="poolId"
                    label="Select pool"
                    value={field.value}
                    options={poolsWithMetadata?.map((pool) => ({ label: pool?.meta?.pool?.name, value: pool.id }))}
                    onChange={(event) => {
                      const selectedPool = poolsWithMetadata.find((pool) => pool.id === event.target.value)
                      form.setFieldValue('selectedPool', selectedPool)
                      form.setFieldValue('uploadedTemplates', selectedPool?.meta?.loanTemplates || [])
                      setPid(selectedPool?.id ?? '')
                    }}
                  />
                )}
              </Field>
            </Box>
            {type === 'create-asset' && <CreateAssetsForm />}
            {type === 'upload-template' && (
              <UploadAssetTemplateForm setIsUploadingTemplates={setIsUploadingTemplates} />
            )}
            <FooterActionButtons
              type={type}
              setType={setType}
              setOpen={resetToDefault}
              isUploadingTemplates={isUploadingTemplates}
              resetToDefault={resetToDefault}
              isLoading={isLoading || isTxLoading}
            />
          </Form>
        </FormikProvider>
      </Drawer>
    </LoadBoundary>
  )
}
