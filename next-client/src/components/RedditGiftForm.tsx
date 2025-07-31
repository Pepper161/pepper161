'use client'

import { useState } from 'react'
import { RecommendationResult } from '../types/recommendation'

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
      // エージェント経由でReddit分析を実行
      const response = await fetch('/api/agents/birthdayGiftAgent/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `redditAnalyzerToolを使用してRedditユーザー「${redditUsername.trim()}」の投稿を分析し、実際の投稿内容に基づいて誕生日プレゼントを3つ提案してください。

分析対象: Redditユーザー名「${redditUsername.trim()}」
予算範囲: ${budget.min}円〜${budget.max}円
${relationship ? `関係性: ${relationship}` : ''}

必ず以下の手順で実行してください：
1. redditAnalyzerToolを呼び出してユーザー「${redditUsername.trim()}」の投稿を取得
2. 投稿内容を詳細分析
3. 実在する商品名を含む具体的なプレゼント3つをJSON形式で提案

ツールを使用して実際のReddit投稿データを取得してから回答してください。`
            }
          ]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `分析に失敗しました (${response.status})`)
      }

      const agentResult = await response.json()
      
      // デバッグ: エージェントのレスポンスをログ出力
      console.log('🔍 エージェントレスポンス:', agentResult);
      
      // エージェントのテキスト結果を解析して構造化データに変換
      const text = agentResult.text || agentResult.content || agentResult.message || '';
      console.log('📄 解析対象テキスト:', text.substring(0, 500) + '...');
      
      if (!text) {
        throw new Error('エージェントからテキスト応答を取得できませんでした');
      }
      
      // AIの返答をパースして推薦結果に変換
      const result: RecommendationResult = parseAgentResponse(text, redditUsername.trim());
      console.log('🎁 最終推薦結果:', result);

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
    
    posts.forEach(post => {
      subredditCount[post.subreddit] = (subredditCount[post.subreddit] || 0) + 1
    })

    const topSubreddits = Object.entries(subredditCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([subreddit, count]) => ({ subreddit, count }))

    const interests = categorizeInterests(topSubreddits)
    const traits = analyzePersonalityTraits(posts, topSubreddits)
    
    return {
      subreddits: topSubreddits,
      interests,
      traits,
      confidence: Math.min(0.95, 0.5 + (posts.length / 50) + (Object.keys(subredditCount).length / 20))
    }
  }

  const categorizeInterests = (subreddits: any[]): string[] => {
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
    const { interests, subreddits } = analysis
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

  // エージェントのテキストレスポンスを構造化データに変換
  const parseAgentResponse = (text: string, username: string): RecommendationResult => {
    try {
      // JSONブロックを抽出
      let jsonString = '';
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1];
      } else {
        // ```jsonブロックがない場合、{}で囲まれた部分を抽出
        const simpleMatch = text.match(/\{[\s\S]*\}/);
        if (simpleMatch) {
          jsonString = simpleMatch[0];
        }
      }
      
      console.log('🔍 抽出されたJSON文字列:', jsonString);
      
      if (jsonString) {
        const jsonData = JSON.parse(jsonString);
        console.log('✅ JSON解析成功:', jsonData);
        
        const giftRecommendations = (jsonData.gift_recommendations || []).map((gift: any, index: number) => ({
          id: `gift-${index}`,
          rank: index + 1,
          name: gift.name || `推薦プレゼント${index + 1}`,
          price: parsePrice(gift.price_range) || Math.floor(Math.random() * (budget.max - budget.min) + budget.min),
          category: gift.category || '一般',
          reason: gift.reason || 'AI分析に基づく推薦です',
          specialPoint: gift.special_point || '相手の興味に合わせて選ばれました',
          tags: [gift.category || 'AI推薦', gift.amazon_keywords || 'オンライン'],
          amazonKeywords: gift.amazon_keywords || gift.name || `推薦プレゼント${index + 1}`
        }));

        return {
          username,
          summary: {
            totalRecommendations: giftRecommendations.length,
            confidenceScore: 0.9, // JSON解析成功時は高い信頼度
            analysisDate: new Date().toISOString().split('T')[0]
          },
          personalityInsights: {
            topInterests: jsonData.user_profile?.interests || ['Reddit', 'オンラインコミュニティ'],
            personalityTraits: jsonData.user_profile?.personality_traits || ['ソーシャル', '好奇心旺盛'],
            keySubreddits: (jsonData.user_profile?.key_subreddits || []).map((sub: string) => ({ subreddit: sub, count: 1 })),
            values: jsonData.user_profile?.values || ['つながり', '学び']
          },
          giftRecommendations,
          shareableUrl: `#reddit-analysis-${username}`
        };
      } else {
        console.warn('❌ JSON文字列が抽出できませんでした');
        throw new Error('JSON文字列が見つかりません');
      }
    } catch (error) {
      console.warn('❌ JSON解析に失敗しました、フォールバック処理を実行:', error);
      console.warn('解析対象テキスト:', text.substring(0, 200) + '...');
    }

    // フォールバック: テキストパース
    const lines = text.split('\n').filter(line => line.trim());
    const giftRecommendations = [];
    let currentGift: any = null;
    let giftIndex = 0;

    for (const line of lines) {
      if (line.includes('**プレゼント名**:') || line.includes('プレゼント名:') || line.includes('name":')) {
        if (currentGift) {
          giftRecommendations.push(currentGift);
        }
        currentGift = {
          id: `gift-${giftIndex++}`,
          rank: giftIndex,
          name: extractValue(line) || `推薦プレゼント${giftIndex}`,
          price: 5000,
          category: '一般',
          reason: '',
          specialPoint: '',
          tags: ['AI推薦']
        };
      } else if (currentGift && (line.includes('価格') || line.includes('price'))) {
        const price = parsePrice(line);
        if (price) currentGift.price = price;
      } else if (currentGift && (line.includes('理由') || line.includes('reason'))) {
        currentGift.reason = extractValue(line) || currentGift.reason;
      } else if (currentGift && (line.includes('特別') || line.includes('special'))) {
        currentGift.specialPoint = extractValue(line) || currentGift.specialPoint;
      }
    }

    if (currentGift) {
      giftRecommendations.push(currentGift);
    }

    // 最低3つの推薦を保証
    while (giftRecommendations.length < 3) {
      giftRecommendations.push({
        id: `gift-default-${giftRecommendations.length}`,
        rank: giftRecommendations.length + 1,
        name: `おすすめプレゼント ${giftRecommendations.length + 1}`,
        price: Math.floor(Math.random() * (budget.max - budget.min) + budget.min),
        category: '一般',
        reason: 'Reddit投稿の分析に基づいて選ばれました',
        specialPoint: '相手の興味や価値観に合わせたギフトです',
        tags: ['AI推薦', 'パーソナライズ']
      });
    }

    return {
      username,
      summary: {
        totalRecommendations: giftRecommendations.length,
        confidenceScore: 0.7, // フォールバック時は低めの信頼度
        analysisDate: new Date().toISOString().split('T')[0]
      },
      personalityInsights: {
        topInterests: ['Reddit', 'オンラインコミュニティ'],
        personalityTraits: ['ソーシャル', '好奇心旺盛'],
        keySubreddits: []
      },
      giftRecommendations,
      shareableUrl: `#reddit-analysis-${username}`
    };
  }

  // ヘルパー関数
  const extractValue = (line: string): string => {
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      return line.substring(colonIndex + 1).replace(/["""]/g, '').trim();
    }
    return '';
  };

  const parsePrice = (priceText: string): number => {
    const matches = priceText.match(/(\d{1,3}(?:,\d{3})*)/);
    return matches ? parseInt(matches[1].replace(/,/g, '')) : 0;
  };

  return (
    <div className="max-w-lg mx-auto p-5">
      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label htmlFor="reddit-username" className="block mb-2 font-bold">
            📝 Redditユーザー名
          </label>
          <input
            id="reddit-username"
            type="text"
            value={redditUsername}
            onChange={(e) => setRedditUsername(e.target.value)}
            placeholder="例: johndoe123"
            className="w-full p-3 border-2 border-gray-300 rounded-lg text-base box-border disabled:opacity-50"
            disabled={loading}
            required
            autoComplete="username"
          />
          <p className="text-sm text-gray-600 mt-1 mb-0">
            プレゼントを贈りたい相手のRedditユーザー名を入力してください
          </p>
        </div>

        {/* 予算設定セクション */}
        <div className="mb-6">
          <label className="block mb-3 font-bold">
            💰 予算範囲
          </label>
          
          {/* プリセットボタン */}
          <div className="mb-4">
            <div className="flex gap-2 flex-wrap">
              {budgetPresets.slice(0, 3).map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePresetBudget(preset)}
                  className={`px-3 py-1.5 text-xs border-2 rounded-full cursor-pointer transition-all duration-200 ${
                    (budget.min === preset.min && budget.max === preset.max) 
                      ? 'border-blue-500 bg-blue-500 text-white' 
                      : 'border-gray-300 bg-white text-gray-800'
                  } disabled:opacity-50`}
                  disabled={loading}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-1 mb-0">
              クリックで簡単設定、または下で詳細調整
            </p>
          </div>

          {/* カスタム予算調整 */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="min-budget" className="block text-sm font-bold mb-1">
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
                  className="w-full p-2 border border-gray-300 rounded text-sm box-border disabled:opacity-50"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="max-budget" className="block text-sm font-bold mb-1">
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
                  className="w-full p-2 border border-gray-300 rounded text-sm box-border disabled:opacity-50"
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="text-center text-sm text-blue-600 font-bold">
              ¥{budget.min.toLocaleString()} 〜 ¥{budget.max.toLocaleString()}
            </div>
            
            {budget.min >= budget.max && (
              <p className="text-red-500 text-xs mt-1 mb-0 text-center">
                最高額は最低額より大きく設定してください
              </p>
            )}
          </div>
        </div>

        {/* 関係性選択 */}
        <div className="mb-6">
          <label htmlFor="relationship" className="block mb-2 font-bold">
            👥 関係性 (任意)
          </label>
          <select
            id="relationship"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg text-base box-border bg-white disabled:opacity-50"
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
          <p className="text-sm text-gray-600 mt-1 mb-0">
            関係性に応じてより適切なプレゼントを提案します
          </p>
        </div>
        
        <button
          type="submit"
          disabled={loading || !redditUsername.trim() || budget.min >= budget.max}
          className={`w-full p-4 text-white border-none rounded-lg text-base font-bold transition-colors duration-200 ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
          }`}
        >
          {loading ? (
            <>
              <span className="mr-2">⏳</span>
              分析中...
            </>
          ) : (
            '🎁 プレゼントを提案してもらう'
          )}
        </button>
      </form>
      
      {loading && (
        <div className="mt-5 text-center text-gray-600">
          <p className="my-2 text-sm">
            Reddit投稿を分析してプレゼントを選定しています...<br />
            <small>この処理には数秒かかる場合があります</small>
          </p>
        </div>
      )}
    </div>
  )
}