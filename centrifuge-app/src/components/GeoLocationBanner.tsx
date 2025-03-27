import { Grid, Text } from '@centrifuge/fabric'
import { useParams } from 'react-router'
import { useTheme } from 'styled-components'
import { usePool, usePoolMetadata } from '../utils/usePools'
import { useUserLocation } from '../utils/useUserLocation'

export const GeoLocationBanner = () => {
  const theme = useTheme()
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const { data: poolMetadata } = usePoolMetadata(pool)
  const { location, loading } = useUserLocation()
  const country = location?.country.toLocaleLowerCase() ?? ''

  const restrictedCountries = [
    ...(poolMetadata?.onboarding?.kybRestrictedCountries ?? []),
    ...(poolMetadata?.onboarding?.kycRestrictedCountries ?? []),
  ]

  if (!restrictedCountries.includes(country) || loading) return null

  return (
    <Grid
      display="flex"
      alignItems="center"
      gap={1}
      backgroundColor="statusWarningBg"
      p={2}
      borderRadius={8}
      mt={2}
      border={`1px solid ${theme.colors.borderPrimary}`}
      justifyContent="center"
    >
      <Text variant="body3">
        Based on your <b>current location</b> you are not able to invest in this pool.
      </Text>
    </Grid>
  )
}
