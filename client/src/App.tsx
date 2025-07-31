import { useState } from 'react'
import { RedditGiftForm } from './components/RedditGiftForm'
import { GiftRecommendations } from './components/GiftRecommendations'
import './App.css'

export interface GiftRecommendation {
  id: string
  rank: number
  name: string
  price: number
  category: string
  reason: string
  specialPoint: string
  tags: string[]
}

export interface RecommendationResult {
  username: string
  summary: {
    totalRecommendations: number
    confidenceScore: number
    analysisDate: string
  }
  personalityInsights: {
    topInterests: string[]
    personalityTraits: string[]
    keySubreddits: Array<{ subreddit: string; count: number }>
  }
  giftRecommendations: GiftRecommendation[]
  shareableUrl: string
}

function App() {
  const [result, setResult] = useState<RecommendationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRecommendationComplete = (data: RecommendationResult) => {
    setResult(data)
    setError(null)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setResult(null)
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setLoading(false)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎁 EmotiGift</h1>
        <p>Reddit投稿から読み取る、あなたにぴったりの誕生日プレゼント</p>
      </header>
      
      <main className="app-main">
        {!result && (
          <RedditGiftForm
            onRecommendationStart={() => setLoading(true)}
            onRecommendationComplete={handleRecommendationComplete}
            onError={handleError}
            loading={loading}
          />
        )}
        
        {error && (
          <div className="error-container">
            <div className="error-message">
              <h3>❌ エラーが発生しました</h3>
              <p>{error}</p>
              <button onClick={handleReset} className="retry-button">
                もう一度試す
              </button>
            </div>
          </div>
        )}
        
        {result && (
          <GiftRecommendations
            result={result}
            onBackToForm={handleReset}
          />
        )}
        
        {!result && !error && (
          <section className="how-it-works">
            <h2>🤔 どうやって動くの？</h2>
            <div className="steps">
              <div className="step">
                <span className="step-number">1</span>
                <h3>Reddit IDを入力</h3>
                <p>あなたまたは友人のRedditユーザー名を入力してください</p>
              </div>
              <div className="step">
                <span className="step-number">2</span>
                <h3>AIが投稿を分析</h3>
                <p>過去の投稿から興味・価値観・性格を読み取ります</p>
              </div>
              <div className="step">
                <span className="step-number">3</span>
                <h3>プレゼント提案</h3>
                <p>分析結果に基づいて3つの誕生日プレゼントを提案します</p>
              </div>
            </div>
          </section>
        )}
      </main>
      
      <footer className="app-footer">
        <p>EmotiGift - Reddit投稿分析による誕生日プレゼント提案サービス</p>
      </footer>
    </div>
  )
}

export default App