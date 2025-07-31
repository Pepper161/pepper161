import { useState, useCallback } from 'react'
import { mastraAPI, WeatherResponse } from '../api/mastra'

interface UseWeatherReturn {
  weather: WeatherResponse | null
  loading: boolean
  error: string | null
  getWeather: (location: string) => Promise<void>
}

export const useWeather = (): UseWeatherReturn => {
  const [weather, setWeather] = useState<WeatherResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getWeather = useCallback(async (location: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await mastraAPI.getWeather(location)
      setWeather(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    weather,
    loading,
    error,
    getWeather,
  }
}