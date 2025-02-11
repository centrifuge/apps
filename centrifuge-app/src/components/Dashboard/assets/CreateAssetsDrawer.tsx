import { Pool, PoolMetadata } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Box, Divider, Drawer, Select } from '@centrifuge/fabric'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import { useMemo, useState } from 'react'
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
  poolId: string
  assetType: string
  assetName: string
  oracleSource: string
  maturity: string
  interestRate: number
  linearPricing: number
  customType: string
  maturityDate: string
  maturityExtensionDays: number
  advanceRate: number
  discountedCashFlow: string
  uploadedTemplates: UploadedTemplate[]
  selectedPool: PoolWithMetadata
}

export function CreateAssetsDrawer({ open, setOpen, type, setType }: CreateAssetsDrawerProps) {
  const cent = useCentrifuge()
  const filteredPools = useFilterPoolsByUserRole(['Borrower', 'PoolAdmin'])
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
      oracleSource: 'isin',
      maturity: 'fixed',
      interestRate: 0,
      linearPricing: false,
      customType: 'atPar',
      uploadedTemplates: poolsMetadata[0]?.meta?.loanTemplates || ([] as UploadedTemplate[]),
      selectedPool: poolsMetadata[0],
    },
    onSubmit: (values) => {
      console.log(values)
    },
  })

  const poolAdmin = usePoolAdmin(form.values.selectedPool?.id ?? '')

  const resetToDefault = () => {
    setOpen(false)
    setType('create-asset')
    setIsUploadingTemplates(false)
    form.resetForm()
  }

  if (!poolsMetadata?.length) return null

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
