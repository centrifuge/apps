import { Pool, PoolMetadata } from '@centrifuge/centrifuge-js'
import { Box, Divider, Drawer, Select } from '@centrifuge/fabric'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import { useMemo } from 'react'
import { LoadBoundary } from '../../../../src/components/LoadBoundary'
import { usePoolAdmin, usePoolsThatAnyConnectedAddressHasPermissionsFor } from '../../../utils/usePermissions'
import { CreateAssetsForm } from './CreateAssetForm'
import { FooterActionButtons } from './FooterActionButtons'
import { UploadAssetTemplateForm } from './UploadAssetTemplateForm'
import { usePoolMetadataMap } from './utils'

export type PoolWithMetadata = Pool & { meta: PoolMetadata }
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
}

export function CreateAssetsDrawer({ open, setOpen, type, setType }: CreateAssetsDrawerProps) {
  const pools = usePoolsThatAnyConnectedAddressHasPermissionsFor() || []
  const metas = usePoolMetadataMap(pools || [])

  const poolsMetadata = useMemo(() => {
    return pools?.map((pool) => {
      const meta = metas.get(pool.id)
      return {
        ...pool,
        meta,
      }
    })
  }, [pools, metas])

  const form = useFormik({
    initialValues: {
      poolId: poolsMetadata[0]?.id,
      assetType: 'cash',
      assetName: '',
      oracleSource: 'isin',
      maturity: 'fixed',
      interestRate: 0,
      linearPricing: false,
      customType: 'atPar',
    },
    onSubmit: (values) => {
      console.log(values)
    },
  })

  const selectedPool = poolsMetadata.find((pool) => pool.id === form.values.poolId)
  const templateIds = selectedPool?.meta?.loanTemplates?.map((s) => s.id) || []
  const templateId = templateIds.at(-1)

  const poolAdmin = usePoolAdmin(selectedPool?.id ?? '')

  const handleButtonClick = () => {
    console.log('clicked')
    if (type === 'create-asset') {
      setType('upload-template')
    }
  }

  if (!poolsMetadata?.length) return null

  return (
    <LoadBoundary>
      <Drawer
        isOpen={open}
        onClose={() => setOpen(false)}
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
                    onChange={(event) => form.setFieldValue('poolId', event.target.value)}
                  />
                )}
              </Field>
            </Box>
            {type === 'create-asset' && (
              <CreateAssetsForm selectedPool={selectedPool as PoolWithMetadata} templateId={templateId} />
            )}
            {type === 'upload-template' && !!poolAdmin && (
              <UploadAssetTemplateForm selectedPool={selectedPool as PoolWithMetadata} templateIds={templateIds} />
            )}
            <FooterActionButtons
              pool={selectedPool as PoolWithMetadata}
              type={type}
              setType={setType}
              setOpen={setOpen}
            />
          </Form>
        </FormikProvider>
      </Drawer>
    </LoadBoundary>
  )
}
