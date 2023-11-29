import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { useBalances, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Button, CurrencyInput, Shelf, Stack, Tabs, TabsItem, Text, TextInput } from '@centrifuge/fabric'
import { isAddress as isEvmAddress } from '@ethersproject/address'
import { isAddress } from '@polkadot/util-crypto'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import React from 'react'
import { useTheme } from 'styled-components'
import { Dec } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { LabelValueStack } from '../LabelValueStack'
import { Tooltips } from '../Tooltips'

type CFGHoldingsProps = {
  address: string
}

export const CFGTransfer = ({ address }: CFGHoldingsProps) => {
  const centBalances = useBalances(address)
  const [activeTab, setActiveTab] = React.useState(0)
  return (
    <Stack gap={2}>
      <Text textAlign="center" variant="heading2">
        CFG Holdings
      </Text>
      <Shelf gap={3} alignItems="flex-start" justifyContent="flex-start">
        <LabelValueStack
          label="Position"
          value={formatBalance(centBalances?.native.balance || 0, centBalances?.native.currency.symbol, 2)}
        />
        <LabelValueStack
          label="Value"
          // TODO: multiply value with toke price
          value={formatBalance(centBalances?.native.balance.toDecimal().mul(0.45) || 0, 'USD', 2)}
        />
        <LabelValueStack label={<Tooltips type="cfgPrice" />} value={formatBalance(0.45 || 0, 'USD', 2)} />
      </Shelf>
      <Stack>
        <Tabs selectedIndex={activeTab} onChange={setActiveTab}>
          <TabsItem>Send</TabsItem>
          <TabsItem>Receive</TabsItem>
        </Tabs>
        {activeTab === 0 ? <SendCFG address={address} /> : <ReceiveCFG />}
      </Stack>
    </Stack>
  )
}

const SendCFG = ({ address }: { address: string }) => {
  const theme = useTheme()
  const centBalances = useBalances(address)

  const { execute: transferCFG, isLoading } = useCentrifugeTransaction('Send CFG', (cent) => cent.tokens.transfer, {
    onSuccess: () => form.resetForm(),
  })

  const form = useFormik<{ amount: Decimal | undefined; recipientAddress: string }>({
    initialValues: {
      amount: undefined,
      recipientAddress: '',
    },
    enableReinitialize: true,
    validate(values) {
      const errors: Partial<{ amount: string; recipientAddress: string }> = {}
      if (values.amount && values.amount.gt(centBalances?.native.balance.toDecimal() || Dec(0))) {
        errors.amount = 'Amount exceeds wallet balance'
      }
      if (!values.amount || values.amount.lte(0)) {
        errors.amount = 'Amount must be greater than 0'
      }
      if (!isAddress(values.recipientAddress) || !isEvmAddress(values.recipientAddress)) {
        errors.recipientAddress = 'Invalid address format'
      }

      return errors
    },
    onSubmit: (values, actions) => {
      if (typeof values.amount !== 'undefined') {
        transferCFG([
          values.recipientAddress,
          'Native',
          new CurrencyBalance(values.amount.toString(), centBalances?.native.currency.decimals || 18),
        ])
      } else {
        actions.setErrors({ amount: 'Amount must be greater than 0' })
      }
      actions.setSubmitting(false)
    },
  })

  return (
    <Stack px={2} py={4} backgroundColor={theme.colors.backgroundSecondary}>
      <FormikProvider value={form}>
        <Form>
          <Stack gap="2">
            <Field name="recipientAddress">
              {({ field, meta, form }: FieldProps) => (
                <TextInput
                  {...field}
                  label="Recipient address"
                  errorMessage={meta.touched ? meta.error : undefined}
                  disabled={isLoading}
                  placeholder="0x"
                  required
                />
              )}
            </Field>
            <Field name="amount">
              {({ field, meta, form }: FieldProps) => (
                <CurrencyInput
                  {...field}
                  variant="small"
                  size={0}
                  placeholder="0.00"
                  label="Amount"
                  onSetMax={() => form.setFieldValue('amount', centBalances?.native.balance.toDecimal())}
                  initialValue={form.values.amount || undefined}
                  errorMessage={meta.touched ? meta.error : undefined}
                  disabled={isLoading}
                  currency={centBalances?.native?.currency.symbol}
                  onChange={(value) => form.setFieldValue('amount', Dec(value))}
                  required
                />
              )}
            </Field>
            <Shelf pl={1}>
              <Text variant="label2">
                Wallet balance:{' '}
                {formatBalance(centBalances?.native.balance || 0, centBalances?.native.currency.symbol, 2)}
              </Text>
            </Shelf>
            <Shelf>
              <Button variant="primary" type="submit" loading={isLoading} loadingMessage={'Confirming'}>
                Send
              </Button>
            </Shelf>
          </Stack>
        </Form>
      </FormikProvider>
    </Stack>
  )
}

const ReceiveCFG = () => {
  const theme = useTheme()
  return <Stack backgroundColor={theme.colors.backgroundSecondary}>Receiving</Stack>
}
