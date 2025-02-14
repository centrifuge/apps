import { Pool, PoolMetadata } from '@centrifuge/centrifuge-js'
import { Accordion, Box, Divider, Drawer, Select } from '@centrifuge/fabric'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import { LoadBoundary } from '../../../../src/components/LoadBoundary'
import { useCanBorrow, usePoolAdmin } from '../../../../src/utils/usePermissions'
import { IssuerDetailsSection } from './IssuerDetailsSection'
import { PoolDescriptionSection } from './PoolDescriptionSection'

export type PoolWithMetadata = Pool & { meta: PoolMetadata }

type PoolConfigurationDrawerProps = {
  open: boolean
  setOpen: (open: boolean) => void
  pools: PoolWithMetadata[]
}

export type CreatePoolFormValues = {
  pool: {
    id: string
    poolName: string
    investorType: string
    poolIcon: string
    assetDenomination: string
    assetClass: string
    subAssetClass: string
    issuerName: string
    repName: string
  }
}

export function PoolConfigurationDrawer({ open, setOpen, pools }: PoolConfigurationDrawerProps) {
  const form = useFormik<CreatePoolFormValues>({
    initialValues: {
      pool: {
        poolName: pools?.[0]?.meta?.pool?.name ?? '',
        investorType: pools?.[0]?.meta?.pool?.investorType ?? '',
        id: pools?.[0]?.id ?? '',
        poolIcon: pools?.[0]?.meta?.pool?.icon?.uri ?? '',
        assetDenomination: pools?.[0]?.currency.symbol ?? 'USDC',
        assetClass: pools?.[0]?.meta?.pool?.asset.class ?? '',
        subAssetClass: pools?.[0]?.meta?.pool?.asset.subClass ?? '',
        issuerName: pools?.[0]?.meta?.pool?.issuer?.name ?? '',
        repName: pools?.[0]?.meta?.pool?.issuer?.repName ?? '',
      },
    },
    onSubmit: (values) => {
      console.log(values)
    },
  })

  const isPoolAdmin = !!usePoolAdmin(form.values.pool.id)
  const isBorrower = useCanBorrow(form.values.pool.id)

  const resetToDefault = () => {
    form.resetForm()
    setOpen(false)
  }

  return (
    <LoadBoundary>
      <Drawer isOpen={open} onClose={resetToDefault} title="Edit configuration">
        <Divider color="backgroundSecondary" />
        <FormikProvider value={form}>
          <Form noValidate>
            <Box px={1}>
              <Field name="poolId">
                {({ field, form }: FieldProps) => (
                  <Select
                    name="poolId"
                    label="Select pool"
                    value={field.value}
                    options={pools?.map((pool) => ({ label: pool?.meta?.pool?.name, value: pool.id }))}
                    onChange={(event) => {
                      const selectedPool = pools.find((pool) => pool.id === event.target.value)
                      console.log(selectedPool)
                      form.setFieldValue('pool', {
                        id: selectedPool?.id ?? '',
                        poolName: selectedPool?.meta?.pool?.name ?? '',
                        investorType: selectedPool?.meta?.pool?.investorType ?? '',
                        poolIcon: selectedPool?.meta?.pool?.icon?.uri ?? '',
                        assetDenomination: selectedPool?.currency.symbol ?? 'USDC',
                        assetClass: selectedPool?.meta?.pool?.asset.class ?? '',
                        subAssetClass: selectedPool?.meta?.pool?.asset.subClass ?? '',
                        issuerName: selectedPool?.meta?.pool?.issuer?.name ?? '',
                        repName: selectedPool?.meta?.pool?.issuer?.repName ?? '',
                      })
                    }}
                  />
                )}
              </Field>
            </Box>
            {isPoolAdmin && isBorrower && (
              <Box mt={2}>
                <Accordion
                  items={[
                    {
                      title: 'Pool description',
                      body: <PoolDescriptionSection />,
                    },
                    {
                      title: 'Issuer details',
                      body: <IssuerDetailsSection />,
                    },
                  ]}
                />
              </Box>
            )}
          </Form>
        </FormikProvider>
      </Drawer>
    </LoadBoundary>
  )
}
