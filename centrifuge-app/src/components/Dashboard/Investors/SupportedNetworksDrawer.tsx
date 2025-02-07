import { useGetExplorerUrl, useGetNetworkName } from '@centrifuge/centrifuge-react'
import {
  Accordion,
  Box,
  Button,
  Checkbox,
  Divider,
  Drawer,
  IconCheckInCircle,
  IconExternalLink,
  Select,
  Shelf,
  Spinner,
  Stack,
  Text,
  TextInput,
  truncate,
} from '@centrifuge/fabric'
import { Field, Form, FormikProvider, useFormik, useFormikContext } from 'formik'
import { useMemo, useState } from 'react'
import { useSelectedPools2 } from '../../../utils/contexts/SelectedPoolsContext'
import { useActiveDomains, useDomainRouters } from '../../../utils/useLiquidityPools'
import { usePool, usePoolMetadataMulti, usePools } from '../../../utils/usePools'

type InitialValues = {
  networks: {
    poolManager: string
    poolId: string
    trancheId: string
    currencyAddress: string
  }[]
}

export function SupportedNetworksDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pools = usePools()
  const domains = useDomainRouters()

  const initialValues: InitialValues = useMemo(() => {
    return {
      networks: [],
    }
  }, [domains, pools])

  const formik = useFormik<InitialValues>({
    initialValues,
    enableReinitialize: true,
    onSubmit: (values) => {
      console.log(values)
    },
  })

  return (
    <Drawer isOpen={isOpen} onClose={onClose} width="33%" innerPaddingTop={3}>
      <Stack gap={2}>
        <Text variant="heading2" fontWeight="600" fontSize="20px">
          Supported Networks
        </Text>
        <Text variant="body2" color="textSecondary">
          View liquidity on all blockchains that this pool is connected to, and enable investments on new blockchains.
        </Text>
        <Text variant="heading2">Networks</Text>
        <Box>
          <FormikProvider value={formik}>
            <Form>
              <Stack gap={2}>
                {domains?.map((domain, index) => (
                  <Box
                    backgroundColor="backgroundSecondary"
                    borderRadius={8}
                    borderStyle="solid"
                    borderWidth={1}
                    borderColor="borderPrimary"
                  >
                    <SupportedNetworks chainId={domain.chainId} index={index} />
                  </Box>
                ))}
                <Button variant="primary" small type="submit">
                  Update
                </Button>
                <Button variant="inverted" small onClick={onClose}>
                  Cancel
                </Button>
              </Stack>
            </Form>
          </FormikProvider>
        </Box>
      </Stack>
    </Drawer>
  )
}

function SupportedNetworks({ chainId, index }: { chainId: number; index: number }) {
  const formik = useFormikContext<InitialValues>()
  const { pools } = useSelectedPools2()
  const poolMetadata = usePoolMetadataMulti(pools ?? [])
  const [selectedPool, setSelectedPool] = useState<string | null>(pools?.[0]?.id ?? null)

  const getNetworkName = useGetNetworkName()
  const { data: domains, isLoading } = useActiveDomains(pools?.[0]?.id ?? '')
  const domain = domains?.find((d) => d.chainId === chainId)

  return (
    <Accordion
      items={[
        {
          title: getNetworkName(chainId || 'centrifuge'),
          body: (
            <>
              <Box px={2}>
                <Divider />
              </Box>
              <Stack p={2} gap={2}>
                <Select
                  label="Select pool"
                  options={
                    pools?.map((pool) => ({
                      label: poolMetadata.find((p) =>
                        Object.keys(p.data?.tranches ?? {}).find((tId) => tId === pool.tranches[0].id)
                      )?.data?.pool?.name,
                      value: pool.id,
                    })) ?? []
                  }
                  onChange={(event) => {
                    setSelectedPool(event.target.value)
                  }}
                />
                <Stack gap={2}>{selectedPool && <TrancheTokensInput chainId={chainId} poolId={selectedPool} />}</Stack>
                <Text variant="label1" color="textPrimary">
                  Tokens
                </Text>

                {domain?.currencies.map((currency) => {
                  console.log('🚀 ~ currency checkbox:', domain?.currencyNeedsAdding)
                  return (
                    <Field name={`networks[${index}].currencyAddress`}>
                      {({ field }: { field: any }) => (
                        <Checkbox
                          {...field}
                          label={<Text variant="label2">{currency.displayName}</Text>}
                          checked={field.value ?? !domain?.currencyNeedsAdding[currency.address]}
                          disabled={!domain?.currencyNeedsAdding[currency.address]}
                          onChange={(event) => {
                            if (event.target.checked) {
                              formik.setFieldValue(`networks[${index}].currencyAddress`, currency.address)
                              formik.setFieldValue(`networks[${index}].poolManager`, domain?.poolManager)
                              formik.setFieldValue(`networks[${index}].poolId`, selectedPool)
                              formik.setFieldValue(
                                `networks[${index}].trancheId`,
                                pools?.find((p) => p.id === selectedPool)?.tranches.find((t) => t.id)?.id
                              )
                            }
                            if (!event.target.checked) {
                              const filteredNetworks = formik.values.networks.filter((network) => {
                                return network.currencyAddress !== currency.address
                              })
                              formik.setFieldValue(`networks`, filteredNetworks)
                            }
                          }}
                        />
                      )}
                    </Field>
                  )
                })}
              </Stack>
            </>
          ),
        },
      ]}
    />
  )
}

function TrancheTokensInput({ chainId, poolId }: { chainId: number; poolId: string }) {
  const { data: domains, isLoading } = useActiveDomains(poolId ?? '')
  const domain = domains?.find((d) => d.chainId === chainId)
  const explorer = useGetExplorerUrl(chainId)
  const pool = usePool(poolId ?? '')
  return (
    <Stack gap={2}>
      <Text variant="label1" color="textPrimary">
        Tranche token that will be deployed
      </Text>
      {pool.tranches.map((t) => {
        const tranche = pool?.tranches.find((poolTranche) => poolTranche.id === t.id)
        return (
          <Shelf gap={2} width="100%" justifyContent="center">
            {!isLoading ? (
              <>
                <Box flex={1} width="100%">
                  <TextInput
                    value={tranche?.currency.displayName}
                    disabled={domain?.isActive}
                    symbol={
                      <IconCheckInCircle
                        color={domain?.isActive ? 'statusOk' : 'textSecondary'}
                        size="iconMedium"
                        style={{ marginLeft: '4px' }}
                      />
                    }
                  />
                </Box>
                {domain?.isActive && (
                  <Stack flex={1} width="100%">
                    <a
                      href={explorer.address(domain.trancheTokens[t.id ?? '']!)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="inverted" small style={{ width: '100%' }}>
                        <Shelf gap={1} p="3px" width="100%" justifyContent="space-between">
                          {truncate(Object.keys(domain?.liquidityPools ?? {}).find((d) => d === t.id) ?? '')}
                          <IconExternalLink size="iconSmall" />
                        </Shelf>
                      </Button>
                    </a>
                  </Stack>
                )}
              </>
            ) : (
              <Spinner width="100%" height="100%" />
            )}
          </Shelf>
        )
      })}
    </Stack>
  )
}
