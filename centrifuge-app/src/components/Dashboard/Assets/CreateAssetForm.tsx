import {
  Accordion,
  Box,
  Button,
  Divider,
  IconHelpCircle,
  ImageUpload,
  RadioButton,
  Tabs,
  TabsItem,
  Text,
  TextAreaInput,
  TextInput,
} from '@centrifuge/fabric'
import { Field, FieldProps, useFormikContext } from 'formik'
import { useState } from 'react'
import { useTheme } from 'styled-components'
import { validate } from '../../../pages/IssuerCreatePool/validate'
import { LoanTemplate } from '../../../types'
import { useMetadata } from '../../../utils/useMetadata'
import { useSuitableAccounts } from '../../../utils/usePermissions'
import { FieldWithErrorMessage } from '../../FieldWithErrorMessage'
import { Tooltips, tooltipText } from '../../Tooltips'
import { AssetTemplateSection } from './AssetTemplateSection'
import { CreateAssetFormValues } from './CreateAssetsDrawer'
import { PricingSection } from './PricingSection'

const assetTypes = [
  { label: 'Cash', tooltip: 'cashAsset', id: 'cash' },
  { label: 'Liquid assets', tooltip: 'liquidAsset', id: 'liquid' },
  { label: 'Fund shares', tooltip: 'fundShares', id: 'fund' },
  { label: 'Custom assets', tooltip: 'customAsset', id: 'custom' },
]

export function CreateAssetsForm() {
  const theme = useTheme()
  const form = useFormikContext<CreateAssetFormValues>()
  const pool = form.values.selectedPool
  const templateIds = pool?.meta?.loanTemplates?.map((s: { id: string }) => s.id) || []
  const templateId = templateIds.at(-1)
  const hasTemplates = !!pool?.meta?.loanTemplates?.length
  const { data: templateMetadata } = useMetadata<LoanTemplate>(templateId)
  const sectionsName = templateMetadata?.sections?.map((s) => s.name) ?? []
  const [selectedTabIndex, setSelectedTabIndex] = useState(0)

  const canCreateAssets =
    useSuitableAccounts({ poolId: pool?.id, poolRole: ['Borrower', 'PoolAdmin'], proxyType: ['Borrow', 'PoolAdmin'] })
      .length > 0

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
    return (
      <Box
        p={2}
        backgroundColor="backgroundSecondary"
        borderRadius={8}
        border={`1px solid ${theme.colors.borderPrimary}`}
        mb={2}
      >
        {sectionsAttrs.map((section) => {
          if (section.index === index) {
            const name = `attributes.${section.attr}`
            if (!attrs[section.attr]) return <></>
            return (
              <Box mt={2} mb={2}>
                <AssetTemplateSection label={attrs[section.attr].label} input={attrs[section.attr].input} name={name} />
              </Box>
            )
          } else return <></>
        })}
      </Box>
    )
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
                  placement="left"
                />
              }
              onChange={() => form.setFieldValue('assetType', asset.id)}
              checked={form.values.assetType === asset.id}
              styles={{ padding: '0px 8px', margin: '8px 0px' }}
              border
              disabled={!canCreateAssets}
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
        <>
          <Box mt={3}>
            {form.values.assetType === 'custom' && (
              <Box mt={2} mb={2}>
                <Tabs selectedIndex={selectedTabIndex} onChange={(index) => setSelectedTabIndex(index)}>
                  <TabsItem styleOverrides={{ padding: '8px' }} showBorder>
                    <Button
                      iconRight={
                        <Tooltips
                          type="atPar"
                          label={
                            <Box ml={1}>{<IconHelpCircle size="iconSmall" color={theme.colors.textSecondary} />}</Box>
                          }
                        />
                      }
                      type="button"
                      variant="tertiary"
                      onClick={() => {
                        form.setFieldValue('customType', 'atPar', false)
                      }}
                      small
                    >
                      At par
                    </Button>
                  </TabsItem>
                  <TabsItem styleOverrides={{ padding: '8px' }} showBorder>
                    <Button
                      type="button"
                      onClick={() => {
                        form.setFieldValue('customType', 'discountedCashFlow', false)
                      }}
                      small
                      variant="tertiary"
                      iconRight={
                        <Tooltips
                          type="discountedCashFlow"
                          label={
                            <Box ml={1}>{<IconHelpCircle size="iconSmall" color={theme.colors.textSecondary} />}</Box>
                          }
                        />
                      }
                    >
                      Discounted cash flow
                    </Button>
                  </TabsItem>
                </Tabs>
              </Box>
            )}
            <Accordion
              items={[
                {
                  title: 'Pricing',
                  body: <PricingSection />,
                },
                ...(sectionsName &&
                  sectionsName.map((section, index) => ({
                    title: section,
                    body: renderBody(index),
                  }))),
              ]}
            />
            {(templateMetadata?.options?.image || templateMetadata?.options?.description) && (
              <Box mb={2}>
                <Divider color="backgroundSecondary" />
              </Box>
            )}
            {templateMetadata?.options?.image && (
              <Box
                backgroundColor="backgroundSecondary"
                borderRadius={8}
                border={`1px solid ${theme.colors.borderPrimary}`}
                padding={2}
                mb={2}
              >
                <Field name="image" validate={validate.nftImage}>
                  {({ field, meta, form }: FieldProps) => (
                    <ImageUpload
                      file={field.value}
                      onFileChange={(file) => {
                        form.setFieldTouched('image', true, false)
                        form.setFieldValue('image', file)
                      }}
                      accept="JPG/PNG/SVG, max 1MB"
                      label="Asset image"
                      errorMessage={meta.touched ? meta.error : undefined}
                    />
                  )}
                </Field>
              </Box>
            )}
            {templateMetadata?.options?.description && (
              <Box
                backgroundColor="backgroundSecondary"
                borderRadius={8}
                border={`1px solid ${theme.colors.borderPrimary}`}
                padding={2}
                mb={2}
              >
                <FieldWithErrorMessage
                  name="description"
                  as={TextAreaInput}
                  label="Description"
                  placeholder="Add asset description paragraph..."
                  maxLength={100}
                />
              </Box>
            )}
          </Box>
          <Box mb={2}>
            <Divider color="backgroundSecondary" />
          </Box>
        </>
      )}
    </Box>
  )
}
