import { Accordion, Box, Divider, IconHelpCircle, RadioButton, Text, TextInput } from '@centrifuge/fabric'
import { Field, FieldProps, useFormikContext } from 'formik'
import { tooltipText } from 'src/components/Tooltips'
import { useTheme } from 'styled-components'
import { useAssetsContext } from './AssetsContext'
import { CreateAssetFormValues } from './CreateAssetsDrawer'
import { CustomAssetForm } from './CustomAssetForm'
import { FundSharesForm } from './FundSharesForm'
import { LiquidAssetsForm } from './LiquidAssetsForm'
import { SecurityDataForm } from './SecurityDataForm'

const assetTypes = [
  { label: 'Cash', tooltip: 'cashAsset', id: 'cash' },
  { label: 'Liquid assets', tooltip: 'liquidAsset', id: 'liquid' },
  { label: 'Fund shares', tooltip: 'fundShares', id: 'fund' },
  { label: 'Custom assets', tooltip: 'customAsset', id: 'custom' },
]

export function CreateAssetsForm() {
  const theme = useTheme()
  const { selectedPool: pool, canCreateAssets } = useAssetsContext()
  const form = useFormikContext<CreateAssetFormValues>()
  const hasTemplates = !!pool?.meta?.loanTemplates?.length

  const renderBody = () => {
    switch (form.values.assetType) {
      case 'liquid':
        return <LiquidAssetsForm />
      case 'fund':
        return <FundSharesForm />
      case 'custom':
        return <CustomAssetForm />
    }
  }

  return (
    <Box>
      <Box
        backgroundColor="backgroundSecondary"
        borderRadius={8}
        p={2}
        mt={3}
        border={`1px solid ${theme.colors.borderPrimary}`}
      >
        <Box>
          <Text variant="heading4">Select asset type*</Text>
          {assetTypes.map((asset) => (
            <RadioButton
              height={40}
              name="assetType"
              label={asset.label}
              icon={<IconHelpCircle size="iconSmall" color={theme.colors.textSecondary} />}
              onChange={() => form.setFieldValue('assetType', asset.id)}
              checked={form.values.assetType === asset.id}
              id={asset.tooltip as keyof typeof tooltipText}
            />
          ))}
        </Box>
        <Box mt={3}>
          <Field name="assetName">
            {({ field, form }: FieldProps) => (
              <TextInput
                name="assetName"
                label="Asset name*"
                value={field.value}
                onChange={(event) => {
                  form.setFieldValue('assetName', event.target.value)
                }}
              />
            )}
          </Field>
        </Box>
      </Box>
      {hasTemplates && canCreateAssets && form.values.assetType !== 'cash' && (
        <Box mt={3}>
          <Accordion
            items={[
              {
                title: 'Pricing',
                body: renderBody(),
              },
              {
                title: 'Security data',
                body: <SecurityDataForm />,
              },
            ]}
            hideBorder
          />
          <Divider color="backgroundSecondary" />
        </Box>
      )}
    </Box>
  )
}
