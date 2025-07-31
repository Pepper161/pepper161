import { useState } from 'react'
import { useWeather } from '../hooks/useWeather'
import './WeatherCard.css'

export const WeatherCard = () => {
  const [location, setLocation] = useState('')
  const { weather, loading, error, getWeather } = useWeather()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (location.trim()) {
      await getWeather(location.trim())
    }
  }

  return (
    <div className="weather-card">
      <h3>天気情報</h3>
      
      <form onSubmit={handleSubmit} className="weather-form">
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="都市名を入力..."
          className="weather-input"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !location.trim()}>
          {loading ? '取得中...' : '天気を取得'}
        </button>
      </form>

      {error && (
        <div className="weather-error">
          エラー: {error}
        </div>
      )}

      {weather && (
        <div className="weather-result">
          <h4>{weather.location}</h4>
          <p className="temperature">{weather.temperature}°C</p>
          <p className="description">{weather.description}</p>
          {weather.humidity && (
            <p className="humidity">湿度: {weather.humidity}%</p>
          )}
          {weather.windSpeed && (
            <p className="wind-speed">風速: {weather.windSpeed} m/s</p>
          )}
        </div>
      )}
    </div>
  )
}