export interface GiftRecommendation {
  id: string
  rank: number
  name: string
  price: number
  category: string
  reason: string
  specialPoint: string
  tags: string[]
  amazonKeywords?: string
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
    values?: string[]
  }
  giftRecommendations: GiftRecommendation[]
  shareableUrl: string
}