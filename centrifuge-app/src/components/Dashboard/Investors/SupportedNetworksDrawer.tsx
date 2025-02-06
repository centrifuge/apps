import { useGetNetworkName } from '@centrifuge/centrifuge-react'
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
  Stack,
  Text,
  TextInput,
  truncate,
} from '@centrifuge/fabric'
import { Form, FormikProps, FormikProvider, useFormik } from 'formik'
import { useEffect, useMemo } from 'react'
import { useActiveDomains, useDomainRouters } from '../../../utils/useLiquidityPools'
import { usePoolMetadataMulti, usePools } from '../../../utils/usePools'

type InitialValues = {
  networks: {
    chainId: number
    poolId: string
    trancheIds: string[]
  }[]
}

export function SupportedNetworksDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pools = usePools()
  const domains = useDomainRouters()

  const initialValues = useMemo(() => {
    return {
      networks:
        domains?.map((domain) => ({
          chainId: domain.chainId,
          poolId: pools?.[0]?.id ?? '',
          trancheIds: pools?.[0]?.tranches.map((t) => t.id) ?? [],
        })) || [],
    }
  }, [domains, pools])

  const formik = useFormik<InitialValues>({
    initialValues,
    onSubmit: (values) => {
      console.log(values)
    },
  })

  useEffect(() => {
    formik.setFieldValue('networks', initialValues.networks)
  }, [domains])

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
                    <SupportedNetworks chainId={domain.chainId} formik={formik} index={index} />
                  </Box>
                ))}
              </Stack>
            </Form>
          </FormikProvider>
        </Box>
      </Stack>
    </Drawer>
  )
}

function SupportedNetworks({
  chainId,
  formik,
  index,
}: {
  chainId: number
  formik: FormikProps<InitialValues>
  index: number
}) {
  const pools = usePools()
  const poolMetadata = usePoolMetadataMulti(pools ?? [])
  const getNetworkName = useGetNetworkName()
  return (
    <Accordion
      items={[
        {
          title: getNetworkName(chainId || 'centrifuge'),
          body: (
            <>
              <Divider />
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
                    formik.setFieldValue(`networks[${index}].poolId`, event.target.value)
                    formik.setFieldValue(
                      `networks[${index}].trancheIds`,
                      pools?.find((p) => p.id === event.target.value)?.tranches.map((t) => t.id)
                    )
                  }}
                />
                <Stack gap={2}>
                  <DeployTrancheTokensInput
                    chainId={chainId}
                    tranches={formik.values.networks[index]?.trancheIds.map((tId) => {
                      return pools
                        ?.find((p) => p.id === formik.values.networks[index].poolId)
                        ?.tranches.find((t) => t.id === tId)
                    })}
                    poolId={formik.values.networks[index]?.poolId}
                  />
                </Stack>
                <Text variant="label1" color="textPrimary">
                  Tokens
                </Text>
                <Checkbox checked={true} readOnly label={<Text variant="label2">USDC</Text>} />
                <Checkbox checked={false} readOnly label={<Text variant="label2">DAI (Coming soon)</Text>} />
                <Checkbox checked={false} readOnly label={<Text variant="label2">USDT (Coming soon)</Text>} />
              </Stack>
            </>
          ),
        },
      ]}
    />
  )
}

function DeployTrancheTokensInput({ tranches, poolId, chainId }: { tranches: any[]; poolId: string; chainId: number }) {
  const { data: domains, isLoading } = useActiveDomains(poolId)
  const domain = domains?.find((d) => d.chainId === chainId)
  console.log('🚀 ~ domain:', domain)
  return (
    <Stack gap={2}>
      <Text variant="label1" color="textPrimary">
        Tranche token that will be deployed
      </Text>
      {tranches?.map((t, index) => {
        return (
          <Shelf gap={2} width="100%">
            <Box flex={1} width="100%">
              <TextInput
                value={t?.currency.displayName}
                disabled={domain?.isActive}
                symbol={
                  <IconCheckInCircle
                    color={domain?.isActive ? 'success' : 'textSecondary'}
                    size="iconMedium"
                    style={{ marginLeft: '4px' }}
                  />
                }
              />
            </Box>
            {domain?.isActive && (
              <Stack flex={1} width="100%">
                <Button small iconRight={<IconExternalLink />} variant="inverted">
                  {truncate(Object.keys(domain?.liquidityPools ?? {})[index])}
                </Button>
              </Stack>
            )}
          </Shelf>
        )
      })}
    </Stack>
  )
}
