import { useState, useEffect } from 'react'
import { getStates, getCitiesByState, type IBGEState, type IBGECity } from '@/lib/ibge'

export function useLocationData(selectedState: string) {
  const [states, setStates] = useState<IBGEState[]>([])
  const [cities, setCities] = useState<IBGECity[]>([])
  const [loadingStates, setLoadingStates] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [errorStates, setErrorStates] = useState<string | null>(null)
  const [errorCities, setErrorCities] = useState<string | null>(null)

  useEffect(() => {
    try {
      setErrorStates(null)
      const data = getStates()
      if (data instanceof Promise) {
        setLoadingStates(true)
        data
          .then((st) => setStates(st || []))
          .catch((err) => {
            console.error('Erro ao carregar estados:', err)
            setErrorStates('Falha ao carregar lista de estados')
            setStates([])
          })
          .finally(() => setLoadingStates(false))
      } else {
        setStates(data || [])
      }
    } catch (err) {
      console.error('Erro ao buscar estados:', err)
      setErrorStates('Falha ao carregar lista de estados')
      setStates([])
    }
  }, [])

  useEffect(() => {
    if (!selectedState || selectedState.length !== 2) {
      setCities([])
      setErrorCities(null)
      return
    }

    try {
      setErrorCities(null)
      setLoadingCities(true)
      const data = getCitiesByState(selectedState)
      if (data instanceof Promise) {
        data
          .then((cts) => {
            if (!cts || cts.length === 0) {
              setErrorCities('Não conseguimos carregar as cidades.')
            }
            setCities(cts || [])
          })
          .catch((err) => {
            console.error('Erro ao carregar cidades:', err)
            setErrorCities('Não conseguimos carregar as cidades.')
            setCities([])
          })
          .finally(() => setLoadingCities(false))
      } else {
        setCities(data || [])
        setLoadingCities(false)
      }
    } catch (err) {
      console.error('Erro ao carregar cidades:', err)
      setErrorCities('Não conseguimos carregar as cidades.')
      setCities([])
      setLoadingCities(false)
    }
  }, [selectedState])

  return { states, cities, loadingStates, loadingCities, errorStates, errorCities }
}
