import { aprToFee, toPerquintill } from '@centrifuge/centrifuge-js'
import { Box, FileUpload, Grid, NumberInput, Select, Shelf, Text, TextAreaInput, TextInput } from '@centrifuge/fabric'
import { BN } from 'bn.js'
import { Field, FieldProps, Form, Formik, FormikErrors, setIn } from 'formik'
import * as React from 'react'
import { useCentrifuge } from '../../components/CentrifugeProvider'
import { FieldWithErrorMessage } from '../../components/form/formik/FieldWithErrorMessage'
import { PageHeader } from '../../components/PageHeader'
import { PageSection } from '../../components/PageSection'
import { PageWithSideBar } from '../../components/PageWithSideBar'
import { RouterLinkButton } from '../../components/RouterLinkButton'
import { getFileDataURI } from '../../utils/getFileDataURI'
import { useAddress } from '../../utils/useAddress'
import { useCentrifugeTransaction } from '../../utils/useCentrifugeTransaction'
import { pinPoolMetadata } from './pinPoolMetadata'
import { RiskGroupsInput } from './RiskGroupsInput'
import { SubmitButton } from './SubmitButton'
import { TrancheInput } from './TrancheInput'
import { validate } from './validate'
import { WriteOffInput } from './WriteOffInput'

export const CURRENCIES = [
  {
    label: 'AIR',
    value: 'Native',
  },
  {
    label: 'kUSD',
    value: 'Usd',
  },
]
const DEFAULT_CURRENCY = 'Native'
const ASSET_CLASSES = ['Art NFT'].map((label) => ({
  label,
  value: label,
}))
const DEFAULT_ASSET_CLASS = 'Art NFT'

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
  interestRate: number | ''
  minRiskBuffer: number | ''
  minInvestment: number | ''
}
export interface RiskGroup {
  groupName: string
  advanceRate: number | ''
  fee: number | ''
  probabilityOfDefault: number | ''
  lossGivenDefault: number | ''
  discountRate: number | ''
}
export interface WriteOffGroup {
  days: number | ''
  writeOff: number | ''
}
export interface PoolFormValues {
  // details
  poolIcon: File | null
  poolName: string
  assetClass: string
  currency: string
  maxReserve: number | ''
  epochDuration: number | ''
  challengeTime: number | ''

  // issuer
  issuerName: string
  issuerLogo: File | null
  issuerDescription: string

  executiveSummary: File | null
  website: string
  forum: string
  email: string

  // tranche
  tranches: Tranche[]
  riskGroups: RiskGroup[]
  writeOffGroups: WriteOffGroup[]
}

export const createEmptyTranche = (junior?: boolean): Tranche => ({
  tokenName: '',
  symbolName: '',
  interestRate: junior ? '' : 0,
  minRiskBuffer: junior ? '' : 0,
  minInvestment: '',
})

export const createEmptyRiskGroup = (): RiskGroup => ({
  groupName: '',
  advanceRate: '',
  fee: '',
  probabilityOfDefault: '',
  lossGivenDefault: '',
  discountRate: '',
})

export const createEmptyWriteOffGroup = (): WriteOffGroup => ({
  days: '',
  writeOff: '',
})

const initialValues: PoolFormValues = {
  poolIcon: null,
  poolName: '',
  assetClass: DEFAULT_ASSET_CLASS,
  currency: DEFAULT_CURRENCY,
  maxReserve: 0,
  epochDuration: 24, // in hours
  challengeTime: 30, // in minutes

  issuerName: '',
  issuerLogo: null,
  issuerDescription: '',

  executiveSummary: null,
  website: '',
  forum: '',
  email: '',

  tranches: [createEmptyTranche(true)],
  riskGroups: [createEmptyRiskGroup()],
  writeOffGroups: [createEmptyWriteOffGroup()],
}

const PoolIcon: React.FC<{ icon?: File | null }> = ({ children, icon }) => {
  const [dataUri, setDataUri] = React.useState('')

  React.useEffect(() => {
    if (icon && icon.type === 'image/svg+xml') {
      getFileDataURI(icon).then((d) => setDataUri(d))
    } else {
      setDataUri('')
    }
  }, [icon])

  return dataUri ? (
    <img src={dataUri} width={40} height={40} alt="" />
  ) : (
    <Shelf width={40} height={40} borderRadius="card" backgroundColor="accentSecondary" justifyContent="center">
      <Text variant="body1">{children}</Text>
    </Shelf>
  )
}

const CreatePoolForm: React.VFC = () => {
  const address = useAddress()
  const centrifuge = useCentrifuge()

  const { execute: createPoolTx } = useCentrifugeTransaction('Create pool', (cent) => cent.pools.createPool)

  return (
    <Formik
      initialValues={initialValues}
      validate={(values) => {
        let errors: FormikErrors<any> = {}
        const tokenNames = new Set<string>()
        const tokenSymbols = new Set<string>()
        let prevInterest = Infinity
        let prevRiskBuffer = 0
        values.tranches.forEach((t, i) => {
          if (tokenNames.has(t.tokenName)) {
            errors = setIn(errors, `tranches.${i}.tokenName`, 'Tranche names must be unique')
          }
          tokenNames.add(t.tokenName)

          if (tokenSymbols.has(t.symbolName)) {
            errors = setIn(errors, `tranches.${i}.symbolName`, 'Token symbols must be unique')
          }
          tokenSymbols.add(t.symbolName)

          if (t.interestRate !== '') {
            if (t.interestRate > prevInterest) {
              errors = setIn(errors, `tranches.${i}.interestRate`, "Can't be higher than a more junior tranche")
            }
            prevInterest = t.interestRate
          }

          if (t.minRiskBuffer !== '') {
            if (t.minRiskBuffer < prevRiskBuffer) {
              errors = setIn(errors, `tranches.${i}.minRiskBuffer`, "Can't be lower than a more junior tranche")
            }
            prevRiskBuffer = t.minRiskBuffer
          }
        })
        return errors
      }}
      onSubmit={async (values, { setSubmitting }) => {
        console.log('submit', values)
        if (!address) return
        // validation passed, submit
        const metadataHash = await pinPoolMetadata(values)

        const poolId = await centrifuge.pools.getAvailablePoolId()
        const collectionId = await centrifuge.nfts.getAvailableCollectionId()

        // tranches must be reversed (most junior is the first in the UI but the last in the API)
        const noJuniorTranches = values.tranches.slice(1)
        const tranches = [
          {}, // most junior tranche
          ...noJuniorTranches.map((tranche) => ({
            interestPerSec: aprToFee((tranche.interestRate as number) / 100),
            minRiskBuffer: toPerquintill((tranche.minRiskBuffer as number) / 100),
          })),
        ]

        createPoolTx([
          address,
          poolId,
          collectionId,
          tranches,
          DEFAULT_CURRENCY,
          new BN(values.maxReserve as number).mul(new BN(10).pow(new BN(18))),
          metadataHash,
          (values.epochDuration as number) * 60 * 60, // convert to seconds
          (values.challengeTime as number) * 60, // convert to seconds
        ])

        setSubmitting(false)
      }}
    >
      {(form) => (
        <Form>
          <PageHeader
            icon={<PoolIcon icon={form.values.poolIcon}>{(form.values.poolName || 'New Pool')[0]}</PoolIcon>}
            title={form.values.poolName || 'New Pool'}
            subtitle="by The Pool Guys LLC"
            actions={
              <>
                <RouterLinkButton variant="outlined" to="/issuers/managed-pools">
                  Cancel
                </RouterLinkButton>

                <SubmitButton />
              </>
            }
          />
          <PageSection title="Details">
            <Grid columns={[6]} equalColumns gap={2} rowGap={3}>
              <Box gridColumn="span 3" width="100%">
                <Field name="poolIcon" validate={validate.poolIcon}>
                  {({ field, meta, form }: FieldProps) => (
                    <FileUpload
                      file={field.value}
                      onFileChange={(file) => {
                        form.setFieldTouched('poolIcon', true, false)
                        form.setFieldValue('poolIcon', file)
                      }}
                      label="Pool icon (SVG, square format)"
                      placeholder="Choose pool icon"
                      errorMessage={meta.touched && meta.error ? meta.error : undefined}
                      accept="image/svg+xml"
                    />
                  )}
                </Field>
              </Box>
              <Box gridColumn="span 3">
                <FieldWithErrorMessage
                  validate={validate.poolName}
                  name="poolName"
                  as={TextInput}
                  label="Pool name"
                  placeholder="New pool"
                  maxLength={100}
                />
              </Box>
              <Box gridColumn="span 3">
                <Field name="assetClass" validate={validate.assetClass}>
                  {({ field, meta, form }: FieldProps) => (
                    <Select
                      label="Asset class"
                      onSelect={(v) => form.setFieldValue('assetClass', v)}
                      onBlur={field.onBlur}
                      errorMessage={meta.touched && meta.error ? meta.error : undefined}
                      value={field.value}
                      options={ASSET_CLASSES}
                      placeholder="Select..."
                    />
                  )}
                </Field>
              </Box>
              <Box gridColumn="span 3">
                <Field name="currency" validate={validate.currency}>
                  {({ field, form, meta }: FieldProps) => (
                    <Select
                      label="Currency"
                      onSelect={(v) => form.setFieldValue('currency', v)}
                      onBlur={field.onBlur}
                      errorMessage={meta.touched && meta.error ? meta.error : undefined}
                      value={field.value}
                      options={CURRENCIES}
                      placeholder="Select..."
                    />
                  )}
                </Field>
              </Box>
              <Box gridColumn="span 2">
                <FieldWithErrorMessage
                  validate={validate.maxReserve}
                  name="maxReserve"
                  as={NumberInput}
                  label="Initial maximum reserve"
                  placeholder="0"
                  rightElement={CURRENCIES.find((c) => c.value === form.values.currency)?.label}
                />
              </Box>
              <Box gridColumn="span 2">
                <FieldWithErrorMessage
                  validate={validate.epochDuration}
                  name="epochDuration"
                  as={NumberInput}
                  label="Minimum epoch duration"
                  placeholder="0"
                  rightElement="hrs"
                />
              </Box>
              <Box gridColumn="span 2">
                <FieldWithErrorMessage
                  validate={validate.challengeTime}
                  name="challengeTime"
                  as={NumberInput}
                  label="Challenge time"
                  placeholder="0"
                  rightElement="min"
                />
              </Box>
            </Grid>
          </PageSection>
          <PageSection title="Issuer">
            <Grid columns={[6]} equalColumns gap={2} rowGap={3}>
              <Box gridColumn="span 3">
                <FieldWithErrorMessage
                  validate={validate.issuerName}
                  name="issuerName"
                  as={TextInput}
                  label="Issuer name"
                  placeholder="Name..."
                  maxLength={100}
                />
              </Box>
              <Box gridColumn="span 3" width="100%">
                <Field name="issuerLogo" validate={validate.issuerLogo}>
                  {({ field, meta, form }: FieldProps) => (
                    <FileUpload
                      file={field.value}
                      onFileChange={(file) => {
                        form.setFieldTouched('issuerLogo', true, false)
                        form.setFieldValue('issuerLogo', file)
                      }}
                      label="Issuer logo (JPG/PNG/SVG, 480x480 px)"
                      placeholder="Choose issuer logo"
                      errorMessage={meta.touched && meta.error ? meta.error : undefined}
                      accept="image/*"
                    />
                  )}
                </Field>
              </Box>
              <Box gridColumn="span 6">
                <FieldWithErrorMessage
                  validate={validate.issuerDescription}
                  name="issuerDescription"
                  as={TextAreaInput}
                  label="Description"
                  placeholder="Description..."
                  maxLength={800}
                />
              </Box>
              <Box gridColumn="span 6">
                <Text>Links</Text>
              </Box>
              <Box gridColumn="span 3">
                <Field name="executiveSummary" validate={validate.executiveSummary}>
                  {({ field, meta, form }: FieldProps) => (
                    <FileUpload
                      file={field.value}
                      onFileChange={(file) => {
                        form.setFieldTouched('executiveSummary', true, false)
                        form.setFieldValue('executiveSummary', file)
                      }}
                      accept="application/pdf"
                      label="Executive summary PDF (required)"
                      placeholder="Choose file"
                      errorMessage={meta.touched && meta.error ? meta.error : undefined}
                    />
                  )}
                </Field>
              </Box>
              <Box gridColumn="span 3">
                <FieldWithErrorMessage
                  name="website"
                  as={TextInput}
                  label="Website"
                  placeholder="https://..."
                  validate={validate.website}
                />
              </Box>
              <Box gridColumn="span 3">
                <FieldWithErrorMessage
                  name="forum"
                  as={TextInput}
                  label="Governance forum"
                  placeholder="https://..."
                  validate={validate.forum}
                />
              </Box>
              <Box gridColumn="span 3">
                <FieldWithErrorMessage
                  name="email"
                  as={TextInput}
                  label="Email"
                  placeholder=""
                  validate={validate.email}
                />
              </Box>
            </Grid>
          </PageSection>

          <TrancheInput />

          <RiskGroupsInput />

          <WriteOffInput />
        </Form>
      )}
    </Formik>
  )
}
