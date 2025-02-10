import { Box, Divider, Drawer, Select } from '@centrifuge/fabric'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import { LoadBoundary } from '../../../../src/components/LoadBoundary'
import { usePoolAdmin } from '../../../utils/usePermissions'
import { useAssetsContext } from './AssetsContext'
import { CreateAssetsForm } from './CreateAssetForm'
import { FooterActionButtons } from './FooterActionButtons'
import { UploadAssetTemplateForm } from './UploadAssetTemplateForm'

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

export function CreateAssetsDrawer() {
  const { open, type, setOpen, setType, poolsMetadata, selectedPool, addSelectedPool } = useAssetsContext()
  const poolAdmin = usePoolAdmin(selectedPool?.id ?? '')

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
                    onChange={(event) => {
                      form.setFieldValue('poolId', event.target.value)
                      addSelectedPool(event.target.value)
                    }}
                  />
                )}
              </Field>
            </Box>
            {type === 'create-asset' && <CreateAssetsForm />}
            {type === 'upload-template' && !!poolAdmin && <UploadAssetTemplateForm />}
            <FooterActionButtons />
          </Form>
        </FormikProvider>
      </Drawer>
    </LoadBoundary>
  )
}
