import { Box, Button, CurrencyInput, Drawer, Shelf, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import React from 'react'
import { useLocation } from 'react-router'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { LabelValueStack } from '../../../components/LabelValueStack'
import { CopyToClipboard } from '../../../utils/copyToClipboard'
import { formatBalanceAbbreviated } from '../../../utils/formatting'

type ChargeFeesProps = {
  onClose: () => void
  isOpen: boolean
}

export const ChargeFeesDrawer = ({ onClose, isOpen }: ChargeFeesProps) => {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const chargeType = params.get('charge')

  const form = useFormik<{ amount: Decimal | undefined }>({
    initialValues: {
      amount: undefined,
    },
    validate(values) {
      return { amount: null }
    },
    onSubmit: (values, actions) => {
      actions.setSubmitting(false)
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
          <LabelValueStack label={'Limit'} value={'1% of NAV'} />
          <LabelValueStack label={'Receiving address'} value={<CopyToClipboard address="0x123...wdsd" />} />
        </Shelf>
        <Stack bg="backgroundTertiary" p={2}>
          <FormikProvider value={form}>
            <Form>
              <Stack gap={1} maxWidth="290px">
                <Field name="amount">
                  {({ field, meta, form }: FieldProps) => (
                    <CurrencyInput
                      label="Amount to charge"
                      currency="USDT"
                      {...field}
                      secondaryLabel="Maximum charge 6,000 USDC (1% of NAV)"
                    />
                  )}
                </Field>
                <Box bg="backgroundButtonSecondary" p={1} borderRadius="2px">
                  <Text variant="body3" color="textSecondary">
                    Charging of fees will be finalized by the issuer of the pool when executing orders
                  </Text>
                </Box>
                <ButtonGroup>
                  <Button variant="primary" onClick={() => console.log('charge')}>
                    Charge
                  </Button>
                  <Button variant="secondary" onClick={() => console.log('cancel')}>
                    Cancel
                  </Button>
                </ButtonGroup>
              </Stack>
            </Form>
          </FormikProvider>
        </Stack>
      </Stack>
    </Drawer>
  )
}
