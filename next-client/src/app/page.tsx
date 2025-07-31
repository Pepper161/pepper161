'use client'

import { useState } from 'react'
import { RedditGiftForm } from '../components/RedditGiftForm'
import { GiftRecommendations } from '../components/GiftRecommendations'
import { RecommendationResult } from '../types/recommendation'

export default function Home() {
  const [result, setResult] = useState<RecommendationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRecommendationComplete = (data: RecommendationResult) => {
    setResult(data)
    setError(null)
    setLoading(false)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setResult(null)
    setLoading(false)
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setLoading(false)
  }

  const handleRecommendationStart = () => {
    setLoading(true)
    setError(null)
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">
          EmotiGift
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          AI-Native Personalized Gift Platform
        </p>
        <p className="text-lg mb-6">
          あなたの心を込めた想いを、AIが理解して特別なギフトに変換します。
        </p>
      </div>

      {error && (
        <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">❌</span>
            <p className="text-red-700 m-0">{error}</p>
          </div>
          <button 
            onClick={handleReset}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 border border-red-300 rounded cursor-pointer hover:bg-red-200"
          >
            もう一度試す
          </button>
        </div>
      )}

      {result ? (
        <GiftRecommendations result={result} onBackToForm={handleReset} />
      ) : (
        <RedditGiftForm
          onRecommendationStart={handleRecommendationStart}
          onRecommendationComplete={handleRecommendationComplete}
          onError={handleError}
          loading={loading}
        />
      )}
    </main>
  )
}
