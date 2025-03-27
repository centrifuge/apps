import { useEffect, useState } from 'react'

interface LocationData {
  ip: string
  city: string
  region: string
  country: string
}

interface UseUserLocationReturn {
  location: LocationData | null
  loading: boolean
  error: string | null
}

export const useUserLocation = (): UseUserLocationReturn => {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/')
        if (!response.ok) {
          throw new Error('Failed to fetch location')
        }
        const data: LocationData = await response.json()
        setLocation(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchLocation()
  }, [])

  return { location, loading, error }
}
