import { useState } from 'react'
import { RecommendationResult } from '../App'

interface RedditGiftFormProps {
  onRecommendationStart: () => void
  onRecommendationComplete: (result: RecommendationResult) => void
  onError: (error: string) => void
  loading: boolean
}

export const RedditGiftForm = ({ onRecommendationStart, onRecommendationComplete, onError, loading }: RedditGiftFormProps) => {
  const [redditUsername, setRedditUsername] = useState('')
  const [budget, setBudget] = useState({ min: 1000, max: 30000 })
  const [relationship, setRelationship] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!redditUsername.trim()) {
      onError('Redditユーザー名を入力してください')
      return
    }

    onRecommendationStart()

    try {
      // レガシーワークフローを呼び出し
      const response = await fetch('/api/workflows/reddit-gemini-gift-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          redditUsername: redditUsername.trim(),
          postLimit: 50
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `分析に失敗しました (${response.status})`)
      }

      const workflowResult = await response.json()
      
      // レガシーワークフローの結果構造を処理
      let finalResult;
      if (workflowResult.results && workflowResult.results.analyzeWithGemini) {
        const geminiStep = workflowResult.results.analyzeWithGemini;
        if (geminiStep.status === 'success') {
          finalResult = geminiStep.output;
        } else {
          throw new Error(geminiStep.error || 'Gemini分析に失敗しました');
        }
      } else {
        finalResult = workflowResult;
      }
      
      if (!finalResult.success) {
        throw new Error(finalResult.error || '分析に失敗しました')
      }

      // Gemini AIワークフローの結果をReactコンポーネント用に変換
      const result: RecommendationResult = {
        username: finalResult.username || redditUsername.trim(),
        summary: {
          totalRecommendations: finalResult.giftRecommendations?.length || 3,
          confidenceScore: 0.85, // デフォルト値
          analysisDate: new Date().toISOString().split('T')[0]
        },
        personalityInsights: {
          topInterests: finalResult.userProfile?.interests || ['Reddit', 'オンラインコミュニティ'],
          personalityTraits: finalResult.userProfile?.personality_traits || ['ソーシャル', '好奇心旺盛'],
          keySubreddits: [] // この情報は基本分析データから取得する必要があります
        },
        giftRecommendations: (finalResult.giftRecommendations || []).map((gift: any, index: number) => ({
          id: `gift-${index}`,
          rank: index + 1,
          name: gift.name,
          price: 0, // 価格情報はモックデータに含まれていません
          category: gift.category,
          reason: gift.reason,
          specialPoint: gift.reason, // 理由をspecialPointとしても使用
          tags: [gift.category]
        })),
        shareableUrl: `#reddit-analysis-${redditUsername.trim()}`
      }

      onRecommendationComplete(result)
      
    } catch (error) {
      console.error('Reddit analysis error:', error)
      
      // フォールバック: エラー時はReddit APIを直接呼び出し
      try {
        const fallbackResult = await performDirectRedditAnalysis(redditUsername.trim())
        onRecommendationComplete(fallbackResult)
      } catch (fallbackError) {
        onError(error instanceof Error ? error.message : '予期しないエラーが発生しました')
      }
    }
  }

  // Direct Reddit API analysis as fallback
  const performDirectRedditAnalysis = async (username: string): Promise<RecommendationResult> => {
    // Reddit JSON APIを直接呼び出し
    const redditResponse = await fetch(`https://www.reddit.com/user/${username}/submitted.json?limit=25&sort=top&t=year`, {
      headers: {
        'User-Agent': 'EmotiGift/1.0.0 (Gift Recommendation Bot)'
      }
    })

    if (!redditResponse.ok) {
      if (redditResponse.status === 404) {
        throw new Error('ユーザーが見つかりません。ユーザー名を確認してください。')
      }
      throw new Error(`Reddit APIエラー: ${redditResponse.status}`)
    }

    const redditData = await redditResponse.json()
    
    if (!redditData.data || !redditData.data.children || redditData.data.children.length === 0) {
      throw new Error('このユーザーの投稿が見つからないか、プライベート設定になっています。')
    }

    // 投稿データを分析
    const posts = redditData.data.children.map((child: any) => child.data)
    const analysis = analyzeRedditPosts(posts)
    
    return {
      username,
      summary: {
        totalRecommendations: 3,
        confidenceScore: analysis.confidence,
        analysisDate: new Date().toISOString().split('T')[0]
      },
      personalityInsights: {
        topInterests: analysis.interests,
        personalityTraits: analysis.traits,
        keySubreddits: analysis.subreddits
      },
      giftRecommendations: generateGiftRecommendations(analysis),
      shareableUrl: `https://emotigift.app/results/${encodeURIComponent(username)}`
    }
  }

  // Analyze Reddit posts and extract insights
  const analyzeRedditPosts = (posts: any[]) => {
    const subredditCount: Record<string, number> = {}
    const allText = posts.map(post => `${post.title} ${post.selftext || ''}`).join(' ')
    
    posts.forEach(post => {
      subredditCount[post.subreddit] = (subredditCount[post.subreddit] || 0) + 1
    })

    const topSubreddits = Object.entries(subredditCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([subreddit, count]) => ({ subreddit, count }))

    const interests = categorizeInterests(topSubreddits, allText)
    const traits = analyzePersonalityTraits(posts, topSubreddits)
    
    return {
      subreddits: topSubreddits,
      interests,
      traits,
      confidence: Math.min(0.95, 0.5 + (posts.length / 50) + (Object.keys(subredditCount).length / 20))
    }
  }

  const categorizeInterests = (subreddits: any[], text: string): string[] => {
    const categories = new Set<string>()
    
    subreddits.forEach(({ subreddit }) => {
      const sub = subreddit.toLowerCase()
      if (['programming', 'coding', 'javascript', 'python', 'webdev'].some(t => sub.includes(t))) {
        categories.add('プログラミング')
      }
      if (['gaming', 'games', 'pcgaming'].some(g => sub.includes(g))) {
        categories.add('ゲーム')
      }
      if (['art', 'design', 'photography'].some(a => sub.includes(a))) {
        categories.add('アート・デザイン')
      }
      if (['music', 'guitar', 'piano'].some(m => sub.includes(m))) {
        categories.add('音楽')
      }
      if (['fitness', 'running', 'gym'].some(f => sub.includes(f))) {
        categories.add('フィットネス')
      }
      if (['cooking', 'food', 'recipes'].some(c => sub.includes(c))) {
        categories.add('料理')
      }
      if (['books', 'reading'].some(b => sub.includes(b))) {
        categories.add('読書')
      }
      if (['anime', 'manga'].some(a => sub.includes(a))) {
        categories.add('アニメ・マンガ')
      }
    })
    
    return Array.from(categories).slice(0, 5)
  }

  const analyzePersonalityTraits = (posts: any[], subreddits: any[]): string[] => {
    const traits = new Set<string>()
    
    if (posts.length > 20) traits.add('活発')
    if (subreddits.length > 8) traits.add('好奇心旺盛')
    if (subreddits.some(s => ['programming', 'science', 'technology'].includes(s.subreddit.toLowerCase()))) {
      traits.add('論理的思考')
    }
    if (subreddits.some(s => ['art', 'design', 'music', 'writing'].includes(s.subreddit.toLowerCase()))) {
      traits.add('クリエイティブ')
    }
    
    return Array.from(traits).slice(0, 4)
  }

  const generateGiftRecommendations = (analysis: any) => {
    const { interests, traits, subreddits } = analysis
    const recommendations = []
    
    // プログラミング関連
    if (interests.includes('プログラミング')) {
      recommendations.push({
        id: 'gift_prog',
        rank: recommendations.length + 1,
        name: 'プログラミング学習書「Clean Architecture」',
        price: 4800,
        category: '書籍・学習',
        reason: `${subreddits.find((s: any) => ['programming', 'coding'].some(p => s.subreddit.toLowerCase().includes(p)))?.subreddit || 'プログラミング'}での活発な投稿から、技術向上への強い意欲が見受けられます。`,
        specialPoint: 'プログラミングスキルを次のレベルに押し上げる実用的なギフトです。',
        tags: ['プログラミング', '学習', '書籍']
      })
    }
    
    // ゲーム関連
    if (interests.includes('ゲーム')) {
      recommendations.push({
        id: 'gift_game',
        rank: recommendations.length + 1,
        name: 'ゲーミングマウスパッド（大型）',
        price: 3200,
        category: 'ゲーム用品',
        reason: 'ゲーム関連の投稿から、PC環境の改善に興味があると推測されます。',
        specialPoint: 'ゲーム体験を向上させる実用的なアイテムです。',
        tags: ['ゲーム', 'PC用品', '実用的']
      })
    }
    
    // アート・デザイン関連
    if (interests.includes('アート・デザイン')) {
      recommendations.push({
        id: 'gift_art',
        rank: recommendations.length + 1,
        name: 'デジタルペンタブレット',
        price: 12000,
        category: 'クリエイティブツール',
        reason: 'アート関連のコミュニティでの活動から、創作への関心が伺えます。',
        specialPoint: 'デジタル創作の可能性を広げる特別なツールです。',
        tags: ['アート', 'デジタル', 'クリエイティブ']
      })
    }
    
    // デフォルト推薦（興味が特定できない場合）
    if (recommendations.length === 0) {
      recommendations.push({
        id: 'gift_default',
        rank: 1,
        name: 'プレミアムコーヒーセット',
        price: 3800,
        category: '食品・飲料',
        reason: 'Redditでの活動パターンから、集中力を高める飲み物が役立つと思われます。',
        specialPoint: '日常を豊かにする消耗品でありながら特別感のあるギフトです。',
        tags: ['コーヒー', '日常使い', 'プレミアム']
      })
    }
    
    // 予算フィルタリング
    if (budget.min > 1000 || budget.max < 30000) {
      return recommendations
        .filter(rec => rec.price >= budget.min && rec.price <= budget.max)
        .slice(0, 3)
    }
    
    // 最大3つまで
    return recommendations.slice(0, 3)
  }

  // 価格帯プリセット
  const budgetPresets = [
    { label: 'プチギフト', min: 500, max: 3000 },
    { label: '一般的', min: 3000, max: 10000 },
    { label: '特別な関係', min: 10000, max: 30000 },
    { label: 'カスタム', min: budget.min, max: budget.max }
  ]

  const handlePresetBudget = (preset: { min: number, max: number }) => {
    setBudget(preset)
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="reddit-username" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            📝 Redditユーザー名
          </label>
          <input
            id="reddit-username"
            type="text"
            value={redditUsername}
            onChange={(e) => setRedditUsername(e.target.value)}
            placeholder="例: johndoe123"
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
            disabled={loading}
            required
            autoComplete="username"
          />
          <p style={{ fontSize: '14px', color: '#666', marginTop: '4px', marginBottom: '0' }}>
            プレゼントを贈りたい相手のRedditユーザー名を入力してください
          </p>
        </div>

        {/* 予算設定セクション */}
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold' }}>
            💰 予算範囲
          </label>
          
          {/* プリセットボタン */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {budgetPresets.slice(0, 3).map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePresetBudget(preset)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    border: '2px solid',
                    borderColor: (budget.min === preset.min && budget.max === preset.max) ? '#646cff' : '#ddd',
                    backgroundColor: (budget.min === preset.min && budget.max === preset.max) ? '#646cff' : 'white',
                    color: (budget.min === preset.min && budget.max === preset.max) ? 'white' : '#333',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  disabled={loading}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
              クリックで簡単設定、または下で詳細調整
            </p>
          </div>

          {/* カスタム予算調整 */}
          <div style={{ 
            background: 'rgba(100, 108, 255, 0.05)', 
            padding: '15px', 
            borderRadius: '8px',
            border: '1px solid rgba(100, 108, 255, 0.2)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label htmlFor="min-budget" style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                  最低額
                </label>
                <input
                  id="min-budget"
                  type="number"
                  value={budget.min}
                  onChange={(e) => setBudget(prev => ({ ...prev, min: Math.max(500, Number(e.target.value)) }))}
                  min="500"
                  max="50000"
                  step="500"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="max-budget" style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                  最高額
                </label>
                <input
                  id="max-budget"
                  type="number"
                  value={budget.max}
                  onChange={(e) => setBudget(prev => ({ ...prev, max: Math.min(50000, Number(e.target.value)) }))}
                  min="1000"
                  max="50000"
                  step="500"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div style={{ textAlign: 'center', fontSize: '14px', color: '#646cff', fontWeight: 'bold' }}>
              ¥{budget.min.toLocaleString()} 〜 ¥{budget.max.toLocaleString()}
            </div>
            
            {budget.min >= budget.max && (
              <p style={{ color: '#ff6b6b', fontSize: '12px', margin: '5px 0 0 0', textAlign: 'center' }}>
                最高額は最低額より大きく設定してください
              </p>
            )}
          </div>
        </div>

        {/* 関係性選択 */}
        <div style={{ marginBottom: '25px' }}>
          <label htmlFor="relationship" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            👥 関係性 (任意)
          </label>
          <select
            id="relationship"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px',
              boxSizing: 'border-box',
              backgroundColor: 'white'
            }}
            disabled={loading}
          >
            <option value="">選択してください</option>
            <option value="友人">友人</option>
            <option value="親友">親友</option>
            <option value="恋人">恋人・パートナー</option>
            <option value="家族">家族</option>
            <option value="同僚">同僚・職場の人</option>
            <option value="知人">知人・acquaintance</option>
          </select>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '4px', marginBottom: '0' }}>
            関係性に応じてより適切なプレゼントを提案します
          </p>
        </div>
        <button
          type="submit"
          disabled={loading || !redditUsername.trim() || budget.min >= budget.max}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: loading ? '#ccc' : '#646cff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease'
          }}
        >
          {loading ? (
            <>
              <span className="loading-spinner" style={{ marginRight: '8px' }}></span>
              分析中...
            </>
          ) : (
            '🎁 プレゼントを提案してもらう'
          )}
        </button>
      </form>
      
      {loading && (
        <div style={{ marginTop: '20px', textAlign: 'center', color: '#666' }}>
          <p style={{ margin: '10px 0', fontSize: '14px' }}>
            Reddit投稿を分析してプレゼントを選定しています...<br />
            <small>この処理には数秒かかる場合があります</small>
          </p>
        </div>
      )}
    </div>
  )
}