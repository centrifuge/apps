import { AnchorButton, Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import { Form, Formik, FormikHelpers } from 'formik'
import * as React from 'react'
import { FileInput } from '../../components/FileInput'
import { RadioButton } from '../../components/form/formik/RadioButton'
import { TextInput } from '../../components/form/formik/TextInput'
import { PageWithSideBar } from '../../components/shared/PageWithSideBar'
import { createPool } from './createPool'
import { SubmitButton } from './SubmitButton'
import { TrancheInput } from './TrancheInput'
import { validate } from './validate'

const isImageFile = (file: File): boolean => !!file.type.match(/^image\//)

const validateImageFile = (file: File) => {
  if (!isImageFile(file)) {
    console.error(`Only image files are allowed (selected file of type ${file.type})`)
    return false
  }
  return true
}

const DEFAULT_CURRENCY = 'Usd'
const ASSET_CLASS = ['Real Estate', 'Revenue Based Financing', 'Invoice Factoring'].map((label) => ({
  label,
  id: label,
}))

export const PoolFormPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <CreatePoolForm />
    </PageWithSideBar>
  )
}

export interface Tranche {
  tokenName: string
  symbolName: string
  interestRate: string
  minRiskBuffer: string
}
export interface PoolFormValues {
  poolName: string
  currency: string
  assetClass: string
  maxReserve: string
  tranches: Tranche[]
}

export const createEmptyTranche = (): Tranche => ({
  tokenName: '',
  symbolName: '',
  interestRate: '0',
  minRiskBuffer: '0',
})

const initialValues = {
  poolName: '',
  currency: DEFAULT_CURRENCY,
  assetClass: '',
  maxReserve: '',
  tranches: [createEmptyTranche()],
}

const CreatePoolForm: React.FC = () => {
  const [issuerLogoFile, setIssuerLogoFile] = React.useState<File>()

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={(values: PoolFormValues, { setSubmitting }: FormikHelpers<PoolFormValues>) => {
        // validate

        // all valid, submit
        console.log('Submitting:', values)
        createPool({
          poolFormData: values,
          issuerLogoFile,
        })
        setTimeout(() => {
          alert(JSON.stringify(values, null, 2))
          setSubmitting(false)
        }, 500)
      }}
    >
      <Form>
        <Grid columns={[10]} equalColumns gap={['gutterMobile', 'gutterTablet', 'gutterDesktop']}>
          <Stack gap="3" gridColumn="1 / 5">
            <TextInput
              label="Pool name"
              placeholder="Untitled pool"
              id="poolName"
              name="poolName"
              validate={validate.poolName}
            />

            <Stack gap="1">
              <Text variant="label1">Asset class</Text>
              <Shelf gap="4">
                {ASSET_CLASS.map(({ label, id }) => (
                  <RadioButton key={id} label={label} value={id} id={id} name="assetClass" />
                ))}
              </Shelf>
            </Stack>

            <Stack gap="1">
              <Text variant="label1">Issuer logo</Text>
              <FileInput
                onFileUpdate={(file) => {
                  setIssuerLogoFile(file)
                }}
                onBeforeFileUpdate={validateImageFile}
              />
            </Stack>

            <TextInput
              label="Max reserve"
              placeholder="0"
              id="maxReserve"
              name="maxReserve"
              validate={validate.maxReserve}
            />
          </Stack>

          <TrancheInput />
          <Stack gap="3" gridColumn="9 / 11">
            <Shelf gap="2">
              <AnchorButton variant="outlined" href="/managed-pools">
                Cancel
              </AnchorButton>

              <SubmitButton />
            </Shelf>
          </Stack>
        </Grid>
      </Form>
    </Formik>
  )
}
