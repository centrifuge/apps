import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Grid, Stack, Text } from '@centrifuge/fabric'
import { usePool, usePoolMetadata } from '../../utils/usePools'

type PoolBrandingProps = {
  poolId: string
  symbol?: string
}

export function PoolBranding({ poolId, symbol }: PoolBrandingProps) {
  const pool = usePool(poolId)
  const { data: metaData } = usePoolMetadata(pool)
  const cent = useCentrifuge()
  const poolIconSize = 24

  return (
    <Grid
      pt={1}
      gridTemplateColumns={metaData?.pool?.icon ? `${poolIconSize}px 1fr` : '1fr'}
      gap={1}
      alignItems="center"
    >
      {metaData?.pool?.icon && (
        <img
          src={cent.metadata.parseMetadataUrl(metaData?.pool?.icon.uri)}
          alt=""
          height={poolIconSize}
          width={poolIconSize}
        />
      )}
      <Stack>
        {metaData?.pool?.name && (
          <Text as="span" variant="body3" fontWeight={700}>
            {metaData.pool.name}
          </Text>
        )}
        {symbol && (
          <Text as="span" variant="body3">
            {symbol}
          </Text>
        )}
      </Stack>
    </Grid>
  )
}
