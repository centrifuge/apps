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
import { usePool, usePoolFees, usePoolMetadata } from '../../utils/usePools'
import { ButtonGroup } from '../ButtonGroup'

type ChargeFeesProps = {
  onClose: () => void
  isOpen: boolean
}

export const ChargeFeesDrawer = ({ onClose, isOpen }: ChargeFeesProps) => {
  const { pid: poolId } = useParams<{ pid: string }>()
  if (!poolId) throw new Error('Pool not found')

  const pool = usePool(poolId)
  const poolFees = usePoolFees(poolId)
  const { data: poolMetadata } = usePoolMetadata(pool)
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const feeIndex = params.get('charge')
  const feeMetadata = feeIndex ? poolMetadata?.pool?.poolFees?.find((f) => f.id.toString() === feeIndex) : undefined
  const feeChainData = feeIndex ? poolFees?.find((f) => f.id.toString() === feeIndex) : undefined
  const maxCharge = feeChainData?.amounts.percentOfNav.toDecimal().mul(pool.nav.aum.toDecimal())
  const [updateCharge, setUpdateCharge] = React.useState(false)
  const address = useAddress()
  const isAllowedToCharge = feeChainData?.destination && addressToHex(feeChainData.destination) === address
  const maxFee = formatPercentage(feeChainData?.amounts.percentOfNav.toPercent() || 0)

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
      if (valuesDec?.lt(0)) {
        errors.amount = 'Must be greater than 0'
      }
      return errors
    },
    onSubmit: (values) => {
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
    <Drawer isOpen={isOpen} onClose={onClose} px={0}>
      <Stack>
        <Stack gap={3} px={3}>
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
              <Text variant="label2">Max fees</Text>
              <Text variant="body3">{`${formatPercentage(
                feeChainData?.amounts.percentOfNav.toPercent() || 0
              )} of NAV`}</Text>
            </Stack>
            <Stack gap="4px">
              <Text variant="label2">Receiving address</Text>
              <CopyToClipboard variant="body3" address={feeChainData?.destination || ''} />
            </Stack>
          </Shelf>
        </Stack>
        <Stack bg="backgroundSecondary" py={2} px={3} width="100%">
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
                    Fee charges have been placed. Fees will be paid when orders are executed and sufficient liquidity is
                    available.
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
                          )} (${maxFee} NAV)`}
                          onChange={(value) => form.setFieldValue('amount', value)}
                        />
                      )
                    }}
                  </Field>
                  <Box bg="backgroundButtonSecondary" p={1} borderRadius="2px">
                    <Text variant="body3" color="textSecondary">
                      Fees charged will be paid during the execution of the epoch, if sufficient liquidity is available
                    </Text>
                  </Box>
                  <ButtonGroup variant="small">
                    <Button
                      loading={isChargeFeeLoading}
                      variant="primary"
                      type="submit"
                      disabled={!isAllowedToCharge || isChargeFeeLoading}
                    >
                      {updateCharge ? 'Update c' : 'C'}harge
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        if (updateCharge) {
                          setUpdateCharge(false)
                        } else {
                          onClose()
                        }
                      }}
                    >
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
