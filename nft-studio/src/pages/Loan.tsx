import { Loan as LoanType } from '@centrifuge/centrifuge-js'
import { Box, Button, Card, Grid, IconNft, Shelf, Stack, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import { Form, FormikErrors, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { useParams } from 'react-router'
import styled from 'styled-components'
import { CardHeader } from '../components/CardHeader'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { RadioButton } from '../components/form/formik/RadioButton'
import { TextInput } from '../components/form/formik/TextInput'
import { LabelValueList } from '../components/LabelValueList'
import { LabelValueStack } from '../components/LabelValueStack'
import LoanLabel from '../components/LoanLabel'
import { PageHeader } from '../components/PageHeader'
import { PageSummary } from '../components/PageSummary'
import { PageWithSideBar } from '../components/shared/PageWithSideBar'
import { useWeb3 } from '../components/Web3Provider'
import { nftMetadataSchema } from '../schemas'
import { formatDate } from '../utils/date'
import { parseMetadataUrl } from '../utils/parseMetadataUrl'
import { useCentrifugeTransaction } from '../utils/useCentrifugeTransaction'
import { useLoan } from '../utils/useLoans'
import { useMetadata } from '../utils/useMetadata'
import { useNFT } from '../utils/useNFTs'
import { usePermissions } from '../utils/usePermissions'
import { usePool, usePoolMetadata } from '../utils/usePools'

const e27 = new BN(10).pow(new BN(27))
const e18 = new BN(10).pow(new BN(18))

export const LoanPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <Loan />
    </PageWithSideBar>
  )
}

const Loan: React.FC = () => {
  const { pid, aid } = useParams<{ pid: string; aid: string }>()
  const { data: pool } = usePool(pid)
  const { data: loan, refetch } = useLoan(pid, aid)
  const { data: poolMetadata } = usePoolMetadata(pool)
  const nft = useNFT(loan?.asset.collectionId, loan?.asset.nftId)
  const { data: nftMetadata } = useMetadata(nft?.metadataUri, nftMetadataSchema)
  const centrifuge = useCentrifuge()
  const { selectedAccount } = useWeb3()
  const { data: permissions } = usePermissions(selectedAccount?.address)

  const canPrice = permissions?.[pid]?.roles.includes('PricingAdmin')

  const name = truncate(nftMetadata?.name || 'Unnamed asset', 30)
  const imageUrl = nftMetadata?.image ? parseMetadataUrl(nftMetadata.image) : ''

  return (
    <Stack gap={3} flex={1}>
      <PageHeader
        title={name}
        titleAddition={loan && <LoanLabel loan={loan} />}
        parent={{ to: `/pools/${pid}/assets`, label: 'Assets' }}
        subtitle={truncate(nftMetadata?.description ?? '', 30)}
        subtitleLink={{ label: poolMetadata?.pool?.name ?? '', to: `/pools/${pid}` }}
      />
      {loan &&
        (loan.status !== 'Created' ? (
          <>
            <PageSummary>
              <LabelValueStack label="Loan type" value={loan?.loanInfo.type} />
              <LabelValueStack
                label="Total borrowed amount"
                value={`${centrifuge.utils.formatCurrencyAmount(loan?.financedAmount)}`}
              />
              <LabelValueStack
                label="Current debt"
                value={`${centrifuge.utils.formatCurrencyAmount(loan?.outstandingDebt)}`}
              />
            </PageSummary>
            <Card p={3}>
              <Stack gap={3}>
                <CardHeader title={name} />
                <Grid columns={[1, 2]} equalColumns gap={5}>
                  <LabelValueList
                    items={
                      [
                        { label: 'Value', value: `${centrifuge.utils.formatCurrencyAmount(loan.loanInfo.value)}` },
                        'maturityDate' in loan.loanInfo && {
                          label: 'Maturity date',
                          value: formatDate(loan.loanInfo.maturityDate),
                        },
                        'probabilityOfDefault' in loan.loanInfo && {
                          label: 'Probability of default',
                          value: `${centrifuge.utils.formatPercentage(loan.loanInfo.probabilityOfDefault, e27)}`,
                        },
                        'lossGivenDefault' in loan.loanInfo && {
                          label: 'Loss given default',
                          value: `${centrifuge.utils.formatPercentage(loan.loanInfo.lossGivenDefault, e27)}`,
                        },
                        { label: 'Financing fee', value: `${centrifuge.utils.feeToApr(loan.financingFee)}%` },
                        {
                          label: 'Advance rate',
                          value: `${centrifuge.utils.formatPercentage(loan.loanInfo.advanceRate, e27)}`,
                        },
                      ].filter(Boolean) as any
                    }
                  />
                  <Box display="flex" alignItems="center" justifyContent="center">
                    {imageUrl ? (
                      <Box as="img" maxHeight="300px" src={imageUrl} />
                    ) : (
                      <IconNft color="backgroundSecondary" size="250px" />
                    )}
                  </Box>
                </Grid>
              </Stack>
            </Card>
          </>
        ) : canPrice ? (
          <PricingForm loan={loan} refetch={refetch} />
        ) : (
          <Shelf justifyContent="center" textAlign="center">
            <Text variant="heading2" color="textSecondary">
              You don&rsquo;t have permission to price assets for this pool
            </Text>
          </Shelf>
        ))}
    </Stack>
  )
}

type PricingFormValues = {
  loanType: 'BulletLoan' | 'CreditLine' | 'CreditLineWithMaturity'
  value: number | string
  maturityDate: string
  advanceRate: number | string
  probabilityOfDefault: number | string
  lossGivenDefault: number | string
  discountRate: number | string
  interestRate: number | string
}

type LoanInfoKey =
  | 'value'
  | 'maturityDate'
  | 'probabilityOfDefault'
  | 'lossGivenDefault'
  | 'discountRate'
  | 'advanceRate'

const LOAN_TYPES = [
  { id: 'BulletLoan', label: 'Bullet loan' },
  { id: 'CreditLine', label: 'Credit line' },
  { id: 'CreditLineWithMaturity', label: 'Credit line with maturity' },
]

const LOAN_FIELDS = {
  BulletLoan: ['advanceRate', 'probabilityOfDefault', 'lossGivenDefault', 'value', 'discountRate', 'maturityDate'],
  CreditLine: ['advanceRate', 'value'],
  CreditLineWithMaturity: [
    'advanceRate',
    'probabilityOfDefault',
    'lossGivenDefault',
    'value',
    'discountRate',
    'maturityDate',
  ],
}

function validateNumberInput(value: number | string, min: number, max?: number) {
  if (value === '') {
    return 'Not a valid number'
  }
  if (max && value > max) {
    return 'Value too large'
  }
  if (value < min) {
    return 'Value too small'
  }
}

const PricingForm: React.VFC<{ loan: LoanType; refetch: () => void }> = ({ loan, refetch }) => {
  const centrifuge = useCentrifuge()
  const { execute: doTransaction, isLoading } = useCentrifugeTransaction(
    'Create asset',
    (cent) => cent.pools.priceLoan as any,
    {
      onSuccess: () => {
        refetch()
      },
    }
  )

  const form = useFormik<PricingFormValues>({
    initialValues: {
      loanType: 'BulletLoan',
      value: '',
      maturityDate: '',
      probabilityOfDefault: '',
      lossGivenDefault: '',
      discountRate: '',
      advanceRate: '',
      interestRate: '',
    },
    onSubmit: (values, { setSubmitting }) => {
      const loanInfoValues = {
        value: new BN(values.value).mul(e18).toString(),
        maturityDate: new Date(form.values.maturityDate).getTime().toString(),
        probabilityOfDefault: centrifuge.utils.toRate((values.probabilityOfDefault as number) / 100),
        lossGivenDefault: centrifuge.utils.toRate((values.lossGivenDefault as number) / 100),
        discountRate: centrifuge.utils.toRate((values.discountRate as number) / 100),
        advanceRate: centrifuge.utils.toRate((values.advanceRate as number) / 100),
      }
      const loanInfoFields = LOAN_FIELDS[values.loanType] as LoanInfoKey[]
      const loanInfo = loanInfoFields.map((key) => loanInfoValues[key])
      const ratePerSec = centrifuge.utils.aprToFee((values.interestRate as number) / 100)

      console.log('loanInfo', loanInfo)

      doTransaction([loan.poolId, loan.id, ratePerSec, values.loanType, loanInfo])
      setSubmitting(false)
    },
    validate: (values) => {
      const shownFields = LOAN_FIELDS[values.loanType]
      const errors: FormikErrors<PricingFormValues> = {}

      if (validateNumberInput(values.interestRate, 0, 100)) {
        errors.interestRate = validateNumberInput(values.interestRate, 0, 100)
      }
      if (shownFields.includes('value') && validateNumberInput(values.value, 0)) {
        errors.value = validateNumberInput(values.value, 0)
      }
      console.log('values', values)
      if (shownFields.includes('maturityDate')) {
        if (!values.maturityDate) {
          errors.maturityDate = 'Required'
        } else if (!/\d{4}-\d{2}-\d{2}/.test(values.maturityDate)) {
          // Date input not natively supported, let user enter manually in required format
          errors.maturityDate = 'Maturity date must be in format yyyy-mm-dd'
        } else if (new Date(values.maturityDate) < new Date()) {
          errors.maturityDate = 'Maturity date must be in the future'
        }
      }
      if (shownFields.includes('probabilityOfDefault') && validateNumberInput(values.probabilityOfDefault, 1, 100)) {
        errors.probabilityOfDefault = validateNumberInput(values.probabilityOfDefault, 1, 100)
      }
      if (shownFields.includes('lossGivenDefault') && validateNumberInput(values.lossGivenDefault, 0, 100)) {
        errors.lossGivenDefault = validateNumberInput(values.lossGivenDefault, 0, 100)
      }
      if (shownFields.includes('discountRate') && validateNumberInput(values.discountRate, 0, 100)) {
        errors.discountRate = validateNumberInput(values.discountRate, 0, 100)
      }
      if (shownFields.includes('advanceRate') && validateNumberInput(values.advanceRate, 0, 100)) {
        errors.advanceRate = validateNumberInput(values.advanceRate, 0, 100)
      }
      return errors
    },
    validateOnMount: true,
  })

  const shownFields = LOAN_FIELDS[form.values.loanType]

  // prettier-ignore
  const fields = {
    value: <NumberInput label="Value (kUSD)" min={0} placeholder="Value" id="value" name="value" />,
    maturityDate: <TextInput label="Maturity date" type="date" min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)} id="maturityDate" name="maturityDate" />,
    probabilityOfDefault: <NumberInput label="Probability of default (%)" min={1} max={100} placeholder="1-100" id="probabilityOfDefault" name="probabilityOfDefault" />,
    lossGivenDefault: <NumberInput label="Loss given default (%)" min={0} max={100} placeholder="0-100" id="lossGivenDefault" name="lossGivenDefault" />,
    discountRate: <NumberInput label="Discount rate (%)" min={0} max={100} placeholder="0-100" id="discountRate" name="discountRate" />,
    advanceRate: <NumberInput label="Advance rate (%)" min={0} max={100} placeholder="0-100" id="advanceRate" name="advanceRate" />,
  }

  return (
    <FormikProvider value={form}>
      <Form>
        <Card p={3}>
          <Stack gap={5}>
            <CardHeader title="Price" />

            <Stack gap={1}>
              <Text variant="label1">Loan type</Text>
              <Shelf gap={4}>
                {LOAN_TYPES.map(({ label, id }) => (
                  <RadioButton key={id} label={label} value={id} id={id} name="loanType" />
                ))}
              </Shelf>
            </Stack>
            <Grid columns={2} gap={3} rowGap={5}>
              {Object.entries(fields)
                .filter(([key]) => shownFields.includes(key))
                .map(([, el]) => el)}
              <NumberInput
                label="Financing fee (%)"
                type="number"
                min={0}
                max={100}
                step={1}
                placeholder="1-100"
                id="interestRate"
                name="interestRate"
              />
            </Grid>
            <div>
              <Button type="submit" disabled={!form.isValid} loading={isLoading}>
                Price
              </Button>
            </div>
          </Stack>
        </Card>
      </Form>
    </FormikProvider>
  )
}

const NumberInput = styled(TextInput)`
  -moz-appearance: textfield;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`
NumberInput.defaultProps = {
  type: 'number',
}

function truncate(txt: string, num: number) {
  if (txt.length > num) {
    return `${txt.slice(0, num)}...`
  }
  return txt
}
