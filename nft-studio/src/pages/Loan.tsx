import { Loan as LoanType } from '@centrifuge/centrifuge-js'
import { Box, Button, Card, Grid, IconNft, Shelf, Stack, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { Field, Form, Formik, FormikErrors, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { useParams } from 'react-router'
import styled from 'styled-components'
import { CardHeader } from '../components/CardHeader'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { TextInput } from '../components/form/base/TextInput'
import { RadioButton } from '../components/form/formik/RadioButton'
import { TextInput as FormikTextInput } from '../components/form/formik/TextInput'
import { LabelValueList } from '../components/LabelValueList'
import { LabelValueStack } from '../components/LabelValueStack'
import LoanLabel from '../components/LoanLabel'
import { PageHeader } from '../components/PageHeader'
import { PageSummary } from '../components/PageSummary'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { ButtonTextLink } from '../components/TextLink'
import { nftMetadataSchema } from '../schemas'
import { formatDate } from '../utils/date'
import { Dec } from '../utils/Decimal'
import { parseMetadataUrl } from '../utils/parseMetadataUrl'
import { useAddress } from '../utils/useAddress'
import { useCentrifugeTransaction } from '../utils/useCentrifugeTransaction'
import { useLoan } from '../utils/useLoans'
import { useMetadata } from '../utils/useMetadata'
import { useLoanNft, useNFT } from '../utils/useNFTs'
import { usePermissions } from '../utils/usePermissions'
import { usePool, usePoolMetadata } from '../utils/usePools'
import { isSameAddress } from '../utils/web3'

const e27 = new BN(10).pow(new BN(27))
const e18 = new BN(10).pow(new BN(18))

export const LoanPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <Loan />
    </PageWithSideBar>
  )
}

const LOAN_TYPE_LABELS = {
  BulletLoan: 'Bullet loan',
  CreditLine: 'Credit line',
  CreditLineWithMaturity: 'Credit line with maturity',
}

const Loan: React.FC = () => {
  const { pid, aid } = useParams<{ pid: string; aid: string }>()
  const pool = usePool(pid)
  const loan = useLoan(pid, aid)
  const { data: poolMetadata } = usePoolMetadata(pool)
  const nft = useNFT(loan?.asset.collectionId, loan?.asset.nftId, false)
  const loanNft = useLoanNft(pid, aid)
  const { data: nftMetadata } = useMetadata(nft?.metadataUri, nftMetadataSchema)
  const centrifuge = useCentrifuge()
  const address = useAddress()
  const permissions = usePermissions(address)

  const canPrice = permissions?.[pid]?.roles.includes('PricingAdmin')
  const isLoanOwner = isSameAddress(loanNft?.owner, address)
  const canBorrow = permissions?.[pid]?.roles.includes('Borrower') && isLoanOwner

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
              <LabelValueStack label="Loan type" value={loan?.loanInfo.type && LOAN_TYPE_LABELS[loan.loanInfo.type]} />
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
                        'discountRate' in loan.loanInfo && {
                          label: 'Discount rate',
                          value: `${centrifuge.utils.feeToApr(loan.loanInfo.discountRate)}%`,
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
          <PricingForm loan={loan} />
        ) : (
          <Card p={3}>
            <Stack gap={3}>
              <CardHeader title="Price" />
              <Text variant="body2">You don&rsquo;t have permission to price assets for this pool</Text>
            </Stack>
          </Card>
        ))}
      {loan &&
        (loan.status === 'Active' && canBorrow ? (
          <FinanceForm loan={loan} />
        ) : loan.status === 'Active' ? (
          <Card p={3}>
            <Stack gap={3}>
              <CardHeader title="Finance &amp; Repay" />
              <Text variant="body2">You don&rsquo;t have permission to finance this asset</Text>
            </Stack>
          </Card>
        ) : loan.status === 'Created' ? (
          <Card p={3}>
            <Stack gap={3}>
              <CardHeader title="Finance &amp; Repay" />
              <Text variant="body2">Finance &amp; repay requires the asset to be priced first.</Text>
            </Stack>
          </Card>
        ) : null)}
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

function validateNumberInput(value: number | string, min: number | Decimal, max?: number | Decimal) {
  if (value === '') {
    return 'Not a valid number'
  }
  if (max && Dec(value).greaterThan(Dec(max))) {
    return 'Value too large'
  }
  if (Dec(value).lessThan(Dec(min))) {
    return 'Value too small'
  }
}

const PricingForm: React.VFC<{ loan: LoanType }> = ({ loan }) => {
  const centrifuge = useCentrifuge()
  const { execute: doTransaction, isLoading } = useCentrifugeTransaction(
    'Price asset',
    (cent) => cent.pools.priceLoan as any
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
        maturityDate: Math.floor(new Date(form.values.maturityDate).getTime() / 1000).toString(),
        probabilityOfDefault: centrifuge.utils.toRate((values.probabilityOfDefault as number) / 100),
        lossGivenDefault: centrifuge.utils.toRate((values.lossGivenDefault as number) / 100),
        discountRate: centrifuge.utils.aprToFee((values.discountRate as number) / 100),
        advanceRate: centrifuge.utils.toRate((values.advanceRate as number) / 100),
      }
      const loanInfoFields = LOAN_FIELDS[values.loanType] as LoanInfoKey[]
      const loanInfo = loanInfoFields.map((key) => loanInfoValues[key])
      const ratePerSec = centrifuge.utils.aprToFee((values.interestRate as number) / 100)

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
    value: <FormikNumberInput label="Value (kUSD)" min="0" placeholder="Value" name="value" />,
    maturityDate: <FormikTextInput label="Maturity date" type="date" min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)} name="maturityDate" />,
    probabilityOfDefault: <FormikNumberInput label="Probability of default (%)" min="1" max="100" step="1" placeholder="1-100" name="probabilityOfDefault" />,
    lossGivenDefault: <FormikNumberInput label="Loss given default (%)" min="0" max="100" step="1" placeholder="0-100" name="lossGivenDefault" />,
    discountRate: <FormikNumberInput label="Discount rate (%)" min="0" max="100" step="1" placeholder="0-100" name="discountRate" />,
    advanceRate: <FormikNumberInput label="Advance rate (%)" min="0" max="100" step="1" placeholder="0-100" name="advanceRate" />,
  }

  return (
    <FormikProvider value={form}>
      <Form noValidate>
        <Card p={3}>
          <Stack gap={5}>
            <CardHeader title="Price" />

            <Stack gap={1}>
              <Text variant="label1">Loan type</Text>
              <Shelf gap={4}>
                {Object.entries(LOAN_TYPE_LABELS).map(([id, label]) => (
                  <RadioButton key={id} label={label} value={id} id={id} name="loanType" />
                ))}
              </Shelf>
            </Stack>
            <Grid columns={[1, 2]} equalColumns gap={3} rowGap={5}>
              {Object.entries(fields)
                .filter(([key]) => shownFields.includes(key))
                .map(([, el]) => el)}
              <FormikNumberInput
                label="Financing fee (%)"
                type="number"
                min="0"
                max="100"
                step="1"
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

type FinanceValues = {
  amount: number | Decimal
}

type RepayValues = {
  amount: number | Decimal
}

const FinanceForm: React.VFC<{ loan: LoanType }> = ({ loan }) => {
  const pool = usePool(loan.poolId)
  const centrifuge = useCentrifuge()
  const { execute: doFinanceTransaction, isLoading: isFinanceLoading } = useCentrifugeTransaction(
    'Finance asset',
    (cent) => cent.pools.financeLoan
  )

  const { execute: doRepayTransaction, isLoading: isRepayLoading } = useCentrifugeTransaction(
    'Repay asset',
    (cent) => cent.pools.repayLoanPartially
  )

  const { execute: doRepayAllTransaction, isLoading: isRepayAllLoading } = useCentrifugeTransaction(
    'Repay asset',
    (cent) => cent.pools.repayAndCloseLoan
  )

  function repayAll() {
    doRepayAllTransaction([loan.poolId, loan.id])
  }

  const debt = Dec(loan.outstandingDebt).div('1e18')
  const poolReserve = Dec(pool?.reserve.available ?? 0).div('1e18')
  let ceiling = Dec(loan.loanInfo.value).div('1e18').mul(loan.loanInfo.advanceRate).div('1e27')
  if (loan.loanInfo.type === 'BulletLoan') {
    ceiling = ceiling.minus(Dec(loan.financedAmount).div('1e18'))
  } else {
    ceiling = ceiling.minus(debt)
    ceiling = ceiling.isNegative() ? Dec(0) : ceiling
  }
  const maxBorrow = poolReserve.lessThan(ceiling) ? poolReserve : ceiling

  return (
    <Card p={3}>
      <Stack gap={3}>
        <CardHeader title="Finance &amp; Repay" />

        <PageSummary>
          <LabelValueStack
            label="Total borrowed amount"
            value={`${centrifuge.utils.formatCurrencyAmount(loan?.financedAmount, pool?.currency)}`}
          />
          <LabelValueStack
            label="Current debt"
            value={`${centrifuge.utils.formatCurrencyAmount(loan?.outstandingDebt, pool?.currency, true)}`}
          />
        </PageSummary>
        <Grid columns={[1, 2]} equalColumns gap={3} rowGap={5}>
          <Formik
            initialValues={{
              amount: 0,
            }}
            onSubmit={(values, actions) => {
              const amount = Dec(values.amount).mul('1e18').toString()
              doFinanceTransaction([loan.poolId, loan.id, new BN(amount)])
              actions.setSubmitting(false)
            }}
            validate={(values) => {
              const errors: FormikErrors<FinanceValues> = {}

              if (validateNumberInput(values.amount, 0)) {
                errors.amount = validateNumberInput(values.amount, 0)
              }

              return errors
            }}
            validateOnMount
          >
            {(form) => (
              <Stack as={Form} gap={3} noValidate>
                <Stack>
                  <Field name="amount">
                    {({ field: { value, ...fieldProps } }: any) => (
                      <NumberInput
                        {...fieldProps}
                        value={value instanceof Decimal ? value.toNumber() : value}
                        label="Finance amount"
                        type="number"
                        min="0"
                      />
                    )}
                  </Field>
                  <Text>
                    <ButtonTextLink
                      onClick={() => {
                        form.setFieldValue('amount', maxBorrow)
                      }}
                    >
                      {/* TODO: With credit lines, the max borrow is limited by the debt, so if there's outstanding debt, 
                          the actual max is a little less by the time the form is submitted. Maybe it should be rounded down */}
                      Set max
                    </ButtonTextLink>
                  </Text>
                </Stack>
                <Box mt="auto">
                  <Button type="submit" variant="outlined" disabled={!form.isValid} loading={isFinanceLoading}>
                    Finance asset
                  </Button>
                </Box>
              </Stack>
            )}
          </Formik>

          <Formik
            initialValues={{
              amount: 0,
            }}
            onSubmit={(values, actions) => {
              const amountBN = new BN(values.amount).mul(e18)
              doRepayTransaction([loan.poolId, loan.id, amountBN])
              actions.setSubmitting(false)
            }}
            validate={(values) => {
              const errors: FormikErrors<RepayValues> = {}

              if (validateNumberInput(values.amount, 0)) {
                errors.amount = validateNumberInput(values.amount, 0)
              }

              return errors
            }}
            validateOnMount
          >
            {(form) => (
              <Stack as={Form} gap={3} noValidate>
                <FormikNumberInput name="amount" label="Repay amount" min="0" />
                <Shelf mt="auto" gap={2}>
                  <Button type="submit" variant="outlined" disabled={!form.isValid} loading={isRepayLoading}>
                    Repay asset
                  </Button>
                  <Button variant="outlined" loading={isRepayAllLoading} onClick={() => repayAll()}>
                    Repay all and close
                  </Button>
                </Shelf>
              </Stack>
            )}
          </Formik>
        </Grid>
      </Stack>
    </Card>
  )
}

const FormikNumberInput = styled(FormikTextInput)`
  -moz-appearance: textfield;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`
FormikNumberInput.defaultProps = {
  type: 'number',
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
