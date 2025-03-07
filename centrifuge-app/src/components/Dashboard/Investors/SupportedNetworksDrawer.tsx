import { CurrencyKey } from '@centrifuge/centrifuge-js'
import { useCentrifugeTransaction, useGetExplorerUrl, useGetNetworkName } from '@centrifuge/centrifuge-react'
import { CentrifugeTransactionOptions } from '@centrifuge/centrifuge-react/dist/hooks/useCentrifugeTransaction'
import {
  Accordion,
  Box,
  Button,
  Checkbox,
  Divider,
  Drawer,
  IconCheckInCircle,
  IconExternalLink,
  IconInfo,
  Select,
  Shelf,
  Spinner,
  Stack,
  Text,
  TextInput,
  truncate,
} from '@centrifuge/fabric'
import { Field, FieldArray, Form, FormikProvider, useFormik, useFormikContext } from 'formik'
import { useState } from 'react'
import { useSelectedPools } from '../../../utils/contexts/SelectedPoolsContext'
import { Domain, useActiveDomains, useDomainRouters } from '../../../utils/useLiquidityPools'
import { usePoolAdmin } from '../../../utils/usePermissions'
import { usePool, usePoolMetadataMulti } from '../../../utils/usePools'

interface NetworkCurrency {
  checked: boolean
  currencyNeedsAdding: boolean
}

interface Network {
  chainId: number
  poolId: string
  currencies: Record<string, NetworkCurrency> // key is currencyAddress
}

interface NetworkFormValues {
  networks: Network[]
}

export function SupportedNetworksDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const domains = useDomainRouters()
  const getNetworkName = useGetNetworkName()
  const { selectedPools } = useSelectedPools(true)
  const [selectedPool, setSelectedPool] = useState<string | null>(selectedPools?.[0] ?? null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const admin = usePoolAdmin(selectedPool ?? '')

  const { execute } = useCentrifugeTransaction(
    'Enable networks',
    (cent) =>
      (
        args: [
          poolId: string,
          chainId: number,
          currencyKeysToAdd: CurrencyKey[],
          tokenPricesToUpdate: [string, CurrencyKey][]
        ][],
        options?: CentrifugeTransactionOptions
      ) => {
        return cent.liquidityPools.enablePoolOnDomain(args, options)
      },
    {
      onSuccess: () => {
        setSuccessMessage('Transaction complete. Please visit Axelar to finish enabling the network.')
      },
    }
  )

  const initialValues: NetworkFormValues = {
    networks: [],
  }

  const formik = useFormik<NetworkFormValues>({
    initialValues,
    enableReinitialize: true,
    onSubmit: (values) => {
      const formattedValues = values.networks.map((network) => {
        const currenciesToAdd = Object.keys(network.currencies)
          .filter((key) => network.currencies[key].currencyNeedsAdding && network.currencies[key].checked)
          .map((key) => key as CurrencyKey)
        return [network.poolId, network.chainId, currenciesToAdd, []]
      })
      execute(
        formattedValues as [
          poolId: string,
          chainId: number,
          currencyKeysToAdd: CurrencyKey[],
          tokenPricesToUpdate: [string, CurrencyKey][]
        ][],
        { account: admin, forceProxyType: ['PoolAdmin'] }
      )
    },
  })

  return (
    <Drawer isOpen={isOpen} onClose={onClose} width="33%" innerPaddingTop={3} title="Supported networks">
      <Stack gap={2}>
        <Text variant="body2" color="textSecondary">
          View liquidity on all blockchains that this pool is connected to, and enable investments on new blockchains.
        </Text>
        <Text variant="heading2">Networks</Text>
        <Box>
          <FormikProvider value={formik}>
            <Form>
              <Box display="flex" flexDirection="column" height="75vh">
                <Box flex={1} overflow="auto">
                  {domains
                    ?.slice(0, 2)
                    // filters out goerli networks on demo, they are not supported by the providers anymore
                    ?.filter((domain) => getNetworkName(domain.chainId || 'centrifuge') !== 'Unknown')
                    .map((domain, index) => (
                      <Box
                        key={`${domain.chainId}-supported-networks-${index}`}
                        backgroundColor="backgroundSecondary"
                        borderRadius={8}
                        borderStyle="solid"
                        borderWidth={1}
                        borderColor="borderPrimary"
                        mb={2}
                      >
                        <SupportedNetworks
                          chainId={domain.chainId}
                          index={index}
                          selectedPool={selectedPool}
                          setSelectedPool={setSelectedPool}
                        />
                      </Box>
                    ))}
                  {successMessage && (
                    <Shelf
                      p={1}
                      borderRadius={8}
                      backgroundColor="statusWarningBg"
                      justifyContent="flex-start"
                      alignItems="flex-start"
                      gap={1}
                    >
                      <IconInfo size="iconSmall" color="statusWarning" />
                      <Text variant="body2" color="statusWarning">
                        {successMessage}
                      </Text>
                    </Shelf>
                  )}
                </Box>
                <Stack gap={2}>
                  <Button variant="primary" small type="submit">
                    Update
                  </Button>
                  <Button variant="inverted" small onClick={onClose} disabled={formik.isSubmitting}>
                    Cancel
                  </Button>
                </Stack>
              </Box>
            </Form>
          </FormikProvider>
        </Box>
      </Stack>
    </Drawer>
  )
}

function getDomainStatus(domain?: Domain) {
  if (!domain || !domain.isActive) return 'inactive'
  if (domain.hasDeployedLp) return 'deployed'
  return 'deploying'
}

function SupportedNetworks({
  chainId,
  index,
  selectedPool,
  setSelectedPool,
}: {
  chainId: number
  index: number
  selectedPool: string | null
  setSelectedPool: (poolId: string) => void
}) {
  const formik = useFormikContext<NetworkFormValues>()
  const { pools } = useSelectedPools()
  const poolMetadata = usePoolMetadataMulti(pools ?? [])
  const getNetworkName = useGetNetworkName()
  const { data: domains } = useActiveDomains(selectedPool ?? '')
  const domain = domains?.find((d) => d.chainId === chainId)
  const status = getDomainStatus(domain)
  return (
    <Accordion
      items={[
        {
          title: (
            <Box pl={2}>
              <Text variant="heading3">{getNetworkName(chainId || 'centrifuge')}</Text>
            </Box>
          ),
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
                {domain?.currencies.length ? (
                  <Text variant="label1" color="textPrimary">
                    Tokens
                  </Text>
                ) : null}

                <FieldArray name="networks">
                  {() => (
                    <>
                      {domain?.currencies.map((currency) => {
                        return (
                          <Field name={`networks[${index}]`}>
                            {({ field }: { field: any }) => {
                              return (
                                <Checkbox
                                  key={`${domain?.chainId}-supported-networks-${index}-${currency.address}`}
                                  label={
                                    <Text variant="label2">
                                      {currency.displayName} ({currency.symbol})
                                    </Text>
                                  }
                                  checked={
                                    field.value?.currencies?.[currency.address]?.checked ??
                                    domain?.isAllowedAsset[currency.address]
                                  }
                                  // !isAllowedAsset[currency.address] means that the asset is already enabled, it cannot be disabled
                                  disabled={
                                    status === 'deployed' ||
                                    status === 'deploying' ||
                                    domain?.isAllowedAsset[currency.address]
                                  }
                                  onChange={(event) => {
                                    if (event.target.checked) {
                                      // Check if the network already exists
                                      if (!formik.values.networks[index]) {
                                        formik.setFieldValue(`networks[${index}]`, {
                                          chainId,
                                          poolId: selectedPool,
                                          currencies: {
                                            [currency.address]: {
                                              currencyNeedsAdding: domain?.currencyNeedsAdding[currency.address],
                                              checked: true,
                                            },
                                          },
                                        })
                                      } else {
                                        // Add currency to existing network
                                        formik.setFieldValue(`networks[${index}].currencies.${currency.address}`, {
                                          currencyNeedsAdding: domain?.currencyNeedsAdding[currency.address],
                                          checked: true,
                                        })
                                      }
                                    }
                                    if (!event.target.checked) {
                                      const updatedCurrencies = {
                                        ...formik.values.networks[index]?.currencies,
                                      }
                                      delete updatedCurrencies[currency.address]

                                      // If no currencies left, remove the entire network
                                      if (Object.keys(updatedCurrencies).length === 0) {
                                        const updatedNetworks = [...formik.values.networks]
                                        updatedNetworks.splice(index, 1)
                                        formik.setFieldValue('networks', updatedNetworks)
                                      } else {
                                        // Otherwise just update currencies
                                        formik.setFieldValue(`networks[${index}].currencies`, updatedCurrencies)
                                      }
                                    }
                                  }}
                                />
                              )
                            }}
                          </Field>
                        )
                      })}
                    </>
                  )}
                </FieldArray>
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
        Tranche tokens deployed
      </Text>
      {pool.tranches.map((t) => {
        return (
          <Shelf key={`tranche-token-${t.id}`} gap={2} width="100%" justifyContent="center">
            {!isLoading ? (
              <>
                <Box flex={1} width="100%">
                  <TextInput
                    value={t.currency.displayName}
                    disabled={domain?.isActive}
                    readOnly
                    symbol={
                      <IconCheckInCircle
                        color={domain?.isActive ? 'statusOk' : 'textSecondary'}
                        size="iconMedium"
                        style={{ marginLeft: '4px' }}
                      />
                    }
                  />
                </Box>
                {domain?.isActive ? (
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
                ) : domain?.canTrancheBeDeployed[t.id] ? (
                  <Button onClick={() => {}}>Enable</Button>
                ) : null}
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
