import { addressToHex, CurrencyBalance } from '@centrifuge/centrifuge-js'
import { useAddress, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Box, Button, CurrencyInput, Drawer, IconInfo, Shelf, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import React from 'react'
import { useLocation, useParams } from 'react-router'
import { CopyToClipboard } from '../../utils/copyToClipboard'
import { Dec } from '../../utils/Decimal'
import { formatBalance, formatBalanceAbbreviated, formatPercentage } from '../../utils/formatting'
import { usePool, usePoolMetadata } from '../../utils/usePools'
import { ButtonGroup } from '../ButtonGroup'

type ChargeFeesProps = {
  onClose: () => void
  isOpen: boolean
}

export const ChargeFeesDrawer = ({ onClose, isOpen }: ChargeFeesProps) => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const { data: poolMetadata } = usePoolMetadata(pool)
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const feeIndex = params.get('charge')
  const feeMetadata = feeIndex ? poolMetadata?.pool?.poolFees?.find((f) => f.id.toString() === feeIndex) : undefined
  const feeChainData = feeIndex ? pool?.poolFees?.find((f) => f.id.toString() === feeIndex) : undefined
  const maxCharge = feeChainData?.amounts.percentOfNav.toDecimal().mul(pool.nav.latest.toDecimal()).div(100)
  const [updateCharge, setUpdateCharge] = React.useState(false)
  const address = useAddress()
  const isAllowedToCharge = feeChainData?.destination && addressToHex(feeChainData.destination) === address

  const { execute: chargeFeeTx, isLoading: isChargeFeeLoading } = useCentrifugeTransaction('Charge fee', (cent) => {
    return cent.pools.chargePoolFee
  })

  const form = useFormik<{ amount?: Decimal }>({
    initialValues: {
      amount: undefined,
    },
    validate(values) {
      const valuesDec = Dec(values.amount || 0)
      let errors: { amount?: string } = {}
      if (!valuesDec) {
        errors.amount = 'Required'
      }
      if (valuesDec?.lte(0)) {
        errors.amount = 'Must be greater than 0'
      }
      return errors
    },
    onSubmit: (values, actions) => {
      if (!feeIndex) throw new Error('feeIndex not found')
      if (!values.amount) throw new Error('amount not found')
      chargeFeeTx([
        feeIndex,
        CurrencyBalance.fromFloat(values.amount, pool.currency.decimals),
        feeChainData?.amounts.pending,
      ])
    },
  })

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <Stack gap={3}>
        <Text textAlign="center" variant="heading2">
          Charge {feeMetadata?.name}
        </Text>
        <Shelf
          borderTop="0.5px solid"
          borderBottom="0.5px solid"
          borderColor="borderPrimary"
          gap={2}
          alignItems="flex-start"
          justifyContent="flex-start"
          py={1}
        >
          <Stack gap="4px">
            <Text variant="label2">Type</Text>
            <Text variant="body3">Direct charge</Text>
          </Stack>
          <Stack gap="4px">
            <Text variant="label2">Pending fees</Text>
            <Text variant="body3">
              {formatBalanceAbbreviated(feeChainData?.amounts.pending || 0, pool.currency.symbol, 2)}
            </Text>
          </Stack>
          <Stack gap="4px">
            <Text variant="label2">Limit</Text>
            <Text variant="body3">{`${formatPercentage(
              feeChainData?.amounts.percentOfNav.toDecimal() || 0
            )} of NAV`}</Text>
          </Stack>
          <Stack gap="4px">
            <Text variant="label2">Receiving address</Text>
            <CopyToClipboard variant="body3" address={feeChainData?.destination || ''} />
          </Stack>
        </Shelf>
        <Stack bg="backgroundTertiary" p={2}>
          {feeChainData?.amounts.pending.gtn(0) && !updateCharge ? (
            <Stack gap={2}>
              <Stack gap={1} bg="backgroundButtonSecondary" p={1} borderRadius="2px">
                <Shelf gap={1} alignItems="baseline">
                  <Text variant="body3" color="textSecondary">
                    Pending fees
                  </Text>
                  <Text variant="body3" color="textSecondary" fontWeight={600}>
                    {formatBalance(feeChainData?.amounts.pending || 0, pool.currency.symbol, 2)}
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
                <Button disabled={!isAllowedToCharge} variant="primary" onClick={() => setUpdateCharge(true)}>
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
                          errorMessage={(meta.touched && meta.error) || undefined}
                          label="Amount to charge"
                          currency={pool.currency.symbol}
                          disabled={form.isValidating || !isAllowedToCharge || isChargeFeeLoading}
                          secondaryLabel={`Maximum charge ${formatBalance(
                            maxCharge || 0,
                            pool.currency.symbol
                          )} (${formatPercentage(feeChainData?.amounts.percentOfNav.toDecimal() || 0)} NAV)`}
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
                    <Button
                      loading={isChargeFeeLoading}
                      variant="primary"
                      type="submit"
                      disabled={!!form.errors.amount || !form.values.amount || !isAllowedToCharge || isChargeFeeLoading}
                    >
                      {updateCharge ? 'Update c' : 'C'}harge
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
