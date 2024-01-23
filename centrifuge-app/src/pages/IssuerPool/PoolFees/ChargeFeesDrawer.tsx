import { Box, Button, CurrencyInput, Drawer, IconInfo, Shelf, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import React from 'react'
import { useLocation } from 'react-router'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { LabelValueStack } from '../../../components/LabelValueStack'
import { CopyToClipboard } from '../../../utils/copyToClipboard'
import { formatBalance, formatBalanceAbbreviated } from '../../../utils/formatting'

type ChargeFeesProps = {
  onClose: () => void
  isOpen: boolean
}

export const ChargeFeesDrawer = ({ onClose, isOpen }: ChargeFeesProps) => {
  const { search } = useLocation()
  // TODO: set pendingFees if there are pending fees
  const [pendingFees, setPendingFees] = React.useState(false)
  const params = new URLSearchParams(search)
  const chargeType = params.get('charge')

  const form = useFormik<{ amount?: Decimal }>({
    initialValues: {
      amount: undefined,
    },
    validate(values) {
      let errors: { amount?: string } = {}
      if (!values.amount) {
        errors.amount = 'Required'
      }
      return errors
    },
    onSubmit: (values, actions) => {
      setTimeout(() => {
        setPendingFees(true)
        actions.setSubmitting(false)
      }, 1000)
    },
  })

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <Stack gap={3}>
        <Text textAlign="center" variant="heading2">
          Charge {chargeType} fee
        </Text>
        <Shelf gap={3} alignItems="flex-start" justifyContent="flex-start">
          <LabelValueStack label="Type" value="Direct charge" />
          <LabelValueStack label="Pending fees" value={formatBalanceAbbreviated(0, 'USD', 2)} />
          <LabelValueStack label="Limit" value={'1% of NAV'} />
          <LabelValueStack label="Receiving address" value={<CopyToClipboard address="0x123...wdsd" />} />
        </Shelf>
        <Stack bg="backgroundTertiary" p={2}>
          {pendingFees ? (
            <Stack gap={2}>
              <Stack gap={1} bg="backgroundButtonSecondary" p={1} borderRadius="2px">
                <Shelf gap={1} alignItems="baseline">
                  <Text variant="body3" color="gray.800">
                    Pending fees
                  </Text>
                  <Text variant="body3" color="gray.800" fontWeight={600}>
                    {formatBalance(form.values?.amount || 0, 'USDT')}
                  </Text>
                </Shelf>
                <Shelf alignItems="flex-start" gap={1}>
                  <IconInfo size="16px" />
                  <Text variant="body3" color="textSecondary">
                    Fee charges have been placed. Charging of fees will be finalized by the issuer of the pool when
                    executing orders.
                  </Text>
                </Shelf>
              </Stack>
              <ButtonGroup variant="small">
                <Button variant="primary" onClick={() => setPendingFees(false)}>
                  Update fee charge
                </Button>
                <Button variant="secondary" onClick={onClose}>
                  Close
                </Button>
              </ButtonGroup>
            </Stack>
          ) : (
            <FormikProvider value={form}>
              <Form onSubmit={form.handleSubmit}>
                <Stack gap={2} maxWidth="290px">
                  <Field name="amount">
                    {({ field, meta, form }: FieldProps) => {
                      return (
                        <CurrencyInput
                          {...field}
                          label="Amount to charge"
                          currency="USDT"
                          disabled={form.isSubmitting || form.isValidating}
                          secondaryLabel="Maximum charge 6,000 USDC (1% NAV)"
                          onChange={(value) => form.setFieldValue('amount', value)}
                        />
                      )
                    }}
                  </Field>
                  <Box bg="backgroundButtonSecondary" p={1} borderRadius="2px">
                    <Text variant="body3" color="textSecondary">
                      Charging of fees will be finalized by the issuer of the pool when executing orders
                    </Text>
                  </Box>
                  <ButtonGroup variant="small">
                    <Button variant="primary" type="submit">
                      Charge
                    </Button>
                    <Button variant="secondary" onClick={onClose}>
                      Cancel
                    </Button>
                  </ButtonGroup>
                </Stack>
              </Form>
            </FormikProvider>
          )}
        </Stack>
      </Stack>
    </Drawer>
  )
}
