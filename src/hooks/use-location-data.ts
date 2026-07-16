import { useState, useEffect } from 'react'
import { getStates, getCitiesByState, type IBGEState, type IBGECity } from '@/lib/ibge'

export function useLocationData(selectedState: string) {
  const [states, setStates] = useState<IBGEState[]>([])
  const [cities, setCities] = useState<IBGECity[]>([])
  const [loadingStates, setLoadingStates] = useState(true)
  const [loadingCities, setLoadingCities] = useState(false)

  useEffect(() => {
    getStates()
      .then(setStates)
      .catch(() => {})
      .finally(() => setLoadingStates(false))
  }, [])

  useEffect(() => {
    if (!selectedState || selectedState.length !== 2) {
      setCities([])
      return
    }
    setLoadingCities(true)
    getCitiesByState(selectedState)
      .then(setCities)
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false))
  }, [selectedState])

  return { states, cities, loadingStates, loadingCities }
}
