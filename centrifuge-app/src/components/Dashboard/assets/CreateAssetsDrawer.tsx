import { CurrencyBalance, LoanInfoInput, Pool, PoolMetadata, Price, Rate } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Box, Divider, Drawer, Select } from '@centrifuge/fabric'
import { BN } from 'bn.js'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import { useMemo, useState } from 'react'
import { firstValueFrom } from 'rxjs'
import { LoadBoundary } from '../../../../src/components/LoadBoundary'
import { useFilterPoolsByUserRole, usePoolAdmin } from '../../../utils/usePermissions'
import { CreateAssetsForm } from './CreateAssetForm'
import { FooterActionButtons } from './FooterActionButtons'
import { UploadAssetTemplateForm } from './UploadAssetTemplateForm'
import { usePoolMetadataMap } from './utils'

export type PoolWithMetadata = Pool & { meta: PoolMetadata }

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
  const centrifuge = useCentrifuge()
  const filteredPools = useFilterPoolsByUserRole(type === 'upload-template' ? ['PoolAdmin'] : ['Borrower', 'PoolAdmin'])
  const metas = usePoolMetadataMap(filteredPools || [])
  const [isUploadingTemplates, setIsUploadingTemplates] = useState(false)

  const poolsMetadata = useMemo(() => {
    return (
      filteredPools?.map((pool) => {
        const meta = metas.get(pool.id)
        return {
          ...pool,
          meta,
        }
      }) || []
    )
  }, [filteredPools, metas])

  const form = useFormik({
    initialValues: {
      assetType: 'cash',
      assetName: '',
      customType: 'atPar',
      selectedPool: poolsMetadata[0],
      uploadedTemplates: poolsMetadata[0]?.meta?.loanTemplates || ([] as UploadedTemplate[]),
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
      const decimals = form.values.selectedPool.currency.decimals
      let pricingInfo: LoanInfoInput
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
          return
        case 'liquid':
        case 'fund':
          const pid = form.values.selectedPool.id
          const loanId = await firstValueFrom(centrifuge.pools.getNextLoanId([pid]))
          pricingInfo = {
            valuationMethod: 'oracle',
            maxPriceVariation: Rate.fromPercent(9999),
            maxBorrowAmount: values.maxBorrowQuantity ? Price.fromFloat(values.maxBorrowQuantity) : null,
            priceId:
              values.oracleSource === 'isin'
                ? { isin: values.isin }
                : { poolLoanId: [pid, loanId.toString()] satisfies [string, string] },
            maturityDate: values.maturity !== 'none' ? new Date(values.maturityDate) : null,
            interestRate: Rate.fromPercent(values.notional === 0 ? 0 : values.interestRate),
            notional: CurrencyBalance.fromFloat(values.notional, decimals),
            withLinearPricing: values.withLinearPricing,
          }
          return
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
          return
        default:
          return
      }
    },
  })

  const poolAdmin = usePoolAdmin(form.values.selectedPool?.id ?? '')

  const resetToDefault = () => {
    setOpen(false)
    setType('create-asset')
    setIsUploadingTemplates(false)
    form.resetForm()
  }

  if (!filteredPools?.length) return null

  return (
    <LoadBoundary>
      <Drawer
        isOpen={open}
        onClose={resetToDefault}
        title={type === 'upload-template' ? 'Upload asset template' : 'Create asset'}
      >
        <Divider color="backgroundSecondary" />
        <FormikProvider value={form}>
          <Form>
            <Box mb={2}>
              <Field name="poolId">
                {({ field, form }: FieldProps) => (
                  <Select
                    name="poolId"
                    label="Select pool"
                    value={field.value}
                    options={poolsMetadata?.map((pool) => ({ label: pool?.meta?.pool?.name, value: pool.id }))}
                    onChange={(event) => {
                      const selectedPool = poolsMetadata.find((pool) => pool.id === event.target.value)
                      form.setFieldValue('selectedPool', selectedPool)
                      form.setFieldValue('uploadedTemplates', selectedPool?.meta?.loanTemplates || [])
                    }}
                  />
                )}
              </Field>
            </Box>
            {type === 'create-asset' && <CreateAssetsForm />}
            {type === 'upload-template' && !!poolAdmin && (
              <UploadAssetTemplateForm setIsUploadingTemplates={setIsUploadingTemplates} />
            )}
            <FooterActionButtons
              type={type}
              setType={setType}
              setOpen={resetToDefault}
              isUploadingTemplates={isUploadingTemplates}
              resetToDefault={resetToDefault}
            />
          </Form>
        </FormikProvider>
      </Drawer>
    </LoadBoundary>
  )
}
