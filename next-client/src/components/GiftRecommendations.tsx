'use client'

import { RecommendationResult } from '../types/recommendation'

interface GiftRecommendationsProps {
  result: RecommendationResult
  onBackToForm: () => void
}

// 商品名を検索しやすいキーワードに変換
const generateSearchKeywords = (productName: string): string => {
  // 【】や特殊文字を除去し、検索しやすい形に変換
  return productName
    .replace(/【.*?】/g, '') // 【】を削除
    .replace(/[（）()]/g, ' ') // 括弧を空白に
    .replace(/[・]/g, ' ') // 中点を空白に
    .replace(/\s+/g, ' ') // 複数の空白を1つに
    .trim();
};

export const GiftRecommendations = ({ result, onBackToForm }: GiftRecommendationsProps) => {
  return (
    <div className="max-w-4xl mx-auto p-5">
      <div className="text-center mb-8">
        <h2 className="text-blue-600 mb-2">
          🎁 <strong>{result.username}</strong>さんへの誕生日プレゼント提案
        </h2>
        <p className="text-gray-600 text-base">
          Reddit投稿の分析結果に基づいて、3つのプレゼントを選定しました
        </p>
      </div>
      
      <div className="bg-gradient-to-br from-blue-50 to-blue-25 p-5 rounded-xl mb-8 border border-blue-200">
        <h3 className="text-gray-800 mb-4">📊 分析サマリー</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <strong>信頼度:</strong> {Math.round(result.summary.confidenceScore * 100)}%
          </div>
          <div>
            <strong>主な興味:</strong> {result.personalityInsights.topInterests.join(', ')}
          </div>
          <div>
            <strong>分析日:</strong> {result.summary.analysisDate}
          </div>
        </div>
        
        {result.personalityInsights.keySubreddits.length > 0 && (
          <div className="mt-4">
            <strong>活発なコミュニティ:</strong>
            <div className="mt-2">
              {result.personalityInsights.keySubreddits.map(sub => (
                <span key={sub.subreddit} className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs mx-1 mb-1 inline-block">
                  r/{sub.subreddit} ({sub.count})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-gray-800 mb-5 text-center">
          🎯 おすすめプレゼント
        </h3>
        
        {result.giftRecommendations.map((gift, index) => (
          <div key={gift.id} className={`border border-gray-200 p-6 my-5 rounded-xl shadow-md relative ${
            index === 0 ? 'bg-gradient-to-br from-white to-blue-50' : 'bg-white'
          }`}>
            {index === 0 && (
              <div className="absolute top-4 right-4 bg-yellow-400 text-gray-800 px-3 py-1 rounded-full text-xs font-bold">
                最推奨
              </div>
            )}
            
            <div className="flex items-center mb-4">
              <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4">
                {gift.rank}
              </span>
              <h4 className="m-0 text-xl text-gray-800">
                {gift.name}
              </h4>
            </div>
            
            <div className="mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div>
                  <strong className="text-blue-600">価格:</strong> ¥{gift.price.toLocaleString()}
                </div>
                <div>
                  <strong className="text-blue-600">カテゴリ:</strong> {gift.category}
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="my-2 leading-relaxed">
                <strong className="text-gray-800">推薦理由:</strong><br />
                {gift.reason}
              </p>
              <p className="my-2 leading-relaxed">
                <strong className="text-gray-800">特別なポイント:</strong><br />
                {gift.specialPoint}
              </p>
            </div>
            
            <div className="mt-4">
              <strong className="text-gray-800 text-sm">タグ:</strong>
              <div className="mt-2">
                {gift.tags.map(tag => (
                  <span key={tag} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs mx-1 mb-1 inline-block border border-gray-300">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Amazon検索リンク */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`https://www.amazon.co.jp/s?k=${encodeURIComponent(generateSearchKeywords(gift.name))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 text-sm font-medium"
                >
                  <span className="mr-2">🛒</span>
                  Amazonで探す
                </a>
                <a
                  href={`https://search.rakuten.co.jp/search/mall/${encodeURIComponent(generateSearchKeywords(gift.name))}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium"
                >
                  <span className="mr-2">🛍️</span>
                  楽天で探す
                </a>
                <a
                  href={`https://shopping.yahoo.co.jp/search?p=${encodeURIComponent(generateSearchKeywords(gift.name))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm font-medium"
                >
                  <span className="mr-2">🛒</span>
                  Yahoo!で探す
                </a>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 <strong>検索キーワード:</strong> 「{generateSearchKeywords(gift.name)}」
                <br />
                ※外部サイトに遷移します。価格や在庫状況は各サイトでご確認ください。
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-10">
        <button 
          onClick={onBackToForm} 
          className="px-6 py-3 bg-gray-600 text-white border-none rounded-lg text-base font-bold cursor-pointer transition-colors duration-200 hover:bg-gray-700"
        >
          ← 別のユーザーを分析する
        </button>
      </div>
    </div>
  )
}