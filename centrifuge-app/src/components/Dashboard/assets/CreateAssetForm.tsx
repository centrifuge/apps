import {
  Accordion,
  Box,
  Divider,
  IconHelpCircle,
  RadioButton,
  Tabs,
  TabsItem,
  Text,
  TextInput,
} from '@centrifuge/fabric'
import { Field, FieldProps, useFormikContext } from 'formik'
import { useState } from 'react'
import { useTheme } from 'styled-components'
import { Tooltips, tooltipText } from '../../../../src/components/Tooltips'
import { LoanTemplate } from '../../../../src/types'
import { useMetadata } from '../../../../src/utils/useMetadata'
import { AssetTemplateSection } from './AssetTemplateSection'
import { useAssetsContext } from './AssetsContext'
import { CreateAssetFormValues } from './CreateAssetsDrawer'

const assetTypes = [
  { label: 'Cash', tooltip: 'cashAsset', id: 'cash' },
  { label: 'Liquid assets', tooltip: 'liquidAsset', id: 'liquid' },
  { label: 'Fund shares', tooltip: 'fundShares', id: 'fund' },
  { label: 'Custom assets', tooltip: 'customAsset', id: 'custom' },
]

export function CreateAssetsForm() {
  const theme = useTheme()
  const { selectedPool: pool, canCreateAssets, templatesData } = useAssetsContext()
  const form = useFormikContext<CreateAssetFormValues>()
  const hasTemplates = !!pool?.meta?.loanTemplates?.length
  const templateIds = templatesData.map((s) => s.id) ?? []
  const templateId = templateIds.at(-1)
  const { data: templateMetadata } = useMetadata<LoanTemplate>(templateId)
  const sectionsName = templateMetadata?.sections?.map((s) => s.name) ?? []
  const [selectedTabIndex, setSelectedTabIndex] = useState(0)

  const renderBody = (index: number) => {
    const sectionsAttrs =
      templateMetadata?.sections
        ?.map((s, i) => {
          return s.attributes.map((attr) => ({
            index: i,
            attr,
          }))
        })
        .flat() ?? []
    const attrs = { ...templateMetadata?.attributes }
    return sectionsAttrs.map((section) => {
      if (section.index === index) {
        const name = `attributes.${section.attr}`
        return (
          <Box mt={2} mb={2}>
            <AssetTemplateSection label={attrs[section.attr].label} input={attrs[section.attr].input} name={name} />
          </Box>
        )
      }
    })
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
              icon={
                <Tooltips
                  type={asset.tooltip as keyof typeof tooltipText}
                  label={<IconHelpCircle size="iconSmall" color={theme.colors.textSecondary} />}
                />
              }
              onChange={() => form.setFieldValue('assetType', asset.id)}
              checked={form.values.assetType === asset.id}
              styles={{ padding: '0px 8px', margin: '8px 0px' }}
              border
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
          {form.values.assetType === 'custom' && (
            <Tabs selectedIndex={selectedTabIndex} onChange={(index) => setSelectedTabIndex(index)}>
              <TabsItem styleOverrides={{ padding: '8px' }} showBorder>
                <Field name="customType">
                  {({ field, form }: FieldProps) => (
                    <Box display="flex" alignItems="center" onClick={() => form.setFieldValue('customType', 'atPar')}>
                      <Text>At par</Text>
                      <Tooltips
                        type="atPar"
                        label={
                          <Box ml={1}>{<IconHelpCircle size="iconSmall" color={theme.colors.textSecondary} />}</Box>
                        }
                      />
                    </Box>
                  )}
                </Field>
              </TabsItem>
              <TabsItem styleOverrides={{ padding: '8px' }} showBorder>
                <Field name="customType">
                  {({ field, form }: FieldProps) => (
                    <Box
                      display="flex"
                      alignItems="center"
                      onClick={() => form.setFieldValue('customType', 'discountedCashFlow')}
                    >
                      <Text>Discounted cash flow</Text>
                      <Tooltips
                        type="discountedCashFlow"
                        label={
                          <Box ml={1}>{<IconHelpCircle size="iconSmall" color={theme.colors.textSecondary} />}</Box>
                        }
                      />
                    </Box>
                  )}
                </Field>
              </TabsItem>
            </Tabs>
          )}
          <Accordion
            items={[
              ...(sectionsName &&
                sectionsName.map((section, index) => ({
                  title: section,
                  body: renderBody(index),
                }))),
            ]}
          />
          <Divider color="backgroundSecondary" mt={2} />
        </Box>
      )}
    </Box>
  )
}
