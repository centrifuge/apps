import { AnchorButton, Button, Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import { Form, Formik, FormikHelpers } from 'formik'
import * as React from 'react'
import { FileInput } from '../../components/FileInput'
import { RadioButton } from '../../components/form/formik/RadioButton'
import { TextInput } from '../../components/form/formik/TextInput'
import { PageWithSideBar } from '../../components/shared/PageWithSideBar'
import { createPool } from './createPool'
import { TrancheInput } from './TrancheInput'

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
            <TextInput label="Pool name" placeholder="Untitled pool" id="poolName" name="poolName" />

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

            <TextInput label="Max reserve" placeholder="0" id="maxReserve" name="maxReserve" />
          </Stack>
          {/* <Stack gap="4" gridColumn="6 / 9" marginTop="9">
            <Text variant="heading3">Tranches</Text>

            <TextInput
              label="Token name"
              placeholder="SEN"
              value={tokenName}
              onChange={(ev) => {
                setTokenName(ev.target.value)
              }}
            />
            <TextInput
              label="Interest rate"
              placeholder="0.00%"
              value={interestRate}
              onChange={(ev) => {
                setInterestRate(ev.target.value)
              }}
            />
            <TextInput
              label="Minimum risk buffer"
              placeholder="0.00%"
              value={minRiskBuffer}
              onChange={(ev) => {
                setMinRiskBuffer(ev.target.value)
              }}
            />

            <Box borderBottomWidth="1px" borderBottomStyle="solid" borderBottomColor="borderPrimary" />

            <Box>
              <Button variant="text" icon={<IconPlus />}>
                Add another tranche
              </Button>
            </Box>
          </Stack> */}
          <TrancheInput />
          <Stack gap="3" gridColumn="9 / 11">
            <Shelf gap="2">
              <AnchorButton variant="outlined" href="/managed-pools">
                Cancel
              </AnchorButton>
              <Button variant="contained" type="submit">
                Create
              </Button>
            </Shelf>
          </Stack>
        </Grid>
      </Form>
    </Formik>
  )
}
