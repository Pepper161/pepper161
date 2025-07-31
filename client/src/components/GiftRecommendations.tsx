import { RecommendationResult } from '../App'

interface GiftRecommendationsProps {
  result: RecommendationResult
  onBackToForm: () => void
}

export const GiftRecommendations = ({ result, onBackToForm }: GiftRecommendationsProps) => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#646cff', marginBottom: '10px' }}>
          🎁 <strong>{result.username}</strong>さんへの誕生日プレゼント提案
        </h2>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Reddit投稿の分析結果に基づいて、3つのプレゼントを選定しました
        </p>
      </div>
      
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(100, 108, 255, 0.1), rgba(100, 108, 255, 0.05))',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '30px',
        border: '1px solid rgba(100, 108, 255, 0.2)'
      }}>
        <h3 style={{ color: '#333', marginBottom: '15px' }}>📊 分析サマリー</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
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
          <div style={{ marginTop: '15px' }}>
            <strong>活発なコミュニティ:</strong>
            <div style={{ marginTop: '5px' }}>
              {result.personalityInsights.keySubreddits.map(sub => (
                <span key={sub.subreddit} style={{
                  background: '#646cff',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  margin: '2px 4px 2px 0',
                  display: 'inline-block'
                }}>
                  r/{sub.subreddit} ({sub.count})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 style={{ color: '#333', marginBottom: '20px', textAlign: 'center' }}>
          🎯 おすすめプレゼント
        </h3>
        
        {result.giftRecommendations.map((gift, index) => (
          <div key={gift.id} style={{ 
            border: '1px solid #e0e0e0', 
            padding: '25px', 
            margin: '20px 0',
            borderRadius: '12px',
            background: index === 0 ? 'linear-gradient(135deg, #fff, #f8f9ff)' : '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            position: 'relative'
          }}>
            {index === 0 && (
              <div style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: '#ffd700',
                color: '#333',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                最推奨
              </div>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{
                background: '#646cff',
                color: 'white',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                marginRight: '15px'
              }}>
                {gift.rank}
              </span>
              <h4 style={{ margin: '0', fontSize: '1.3rem', color: '#333' }}>
                {gift.name}
              </h4>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '15px' }}>
                <div>
                  <strong style={{ color: '#646cff' }}>価格:</strong> ¥{gift.price.toLocaleString()}
                </div>
                <div>
                  <strong style={{ color: '#646cff' }}>カテゴリ:</strong> {gift.category}
                </div>
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <p style={{ margin: '8px 0', lineHeight: '1.6' }}>
                <strong style={{ color: '#333' }}>推薦理由:</strong><br />
                {gift.reason}
              </p>
              <p style={{ margin: '8px 0', lineHeight: '1.6' }}>
                <strong style={{ color: '#333' }}>特別なポイント:</strong><br />
                {gift.specialPoint}
              </p>
            </div>
            
            <div style={{ marginTop: '15px' }}>
              <strong style={{ color: '#333', fontSize: '14px' }}>タグ:</strong>
              <div style={{ marginTop: '8px' }}>
                {gift.tags.map(tag => (
                  <span key={tag} style={{
                    background: '#e9ecef',
                    color: '#495057',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    margin: '2px 4px 2px 0',
                    display: 'inline-block',
                    border: '1px solid #dee2e6'
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <button onClick={onBackToForm} style={{
          padding: '12px 24px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease'
        }}>
          ← 別のユーザーを分析する
        </button>
      </div>
    </div>
  )
}