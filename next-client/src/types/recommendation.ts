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