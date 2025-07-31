import React, { useState } from 'react';
import './RedditGiftForm.css';

interface UserProfile {
  interests: string[];
  personality_traits: string[];
  values: string[];
}

interface GiftRecommendation {
  name: string;
  reason: string;
  category: string;
}

interface AnalysisResult {
  success: boolean;
  username?: string;
  userProfile?: UserProfile;
  giftRecommendations?: GiftRecommendation[];
  error?: string;
  redditError?: string;
}

const RedditGiftAnalyzer: React.FC = () => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      // Mastraワークフローを呼び出し
      const response = await fetch('/api/workflows/reddit-gemini-gift-workflow/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          redditUsername: username.trim(),
          postLimit: 50
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      // ワークフローの最終ステップの結果を取得
      if (data.result && data.result.steps) {
        const finalStep = data.result.steps['analyzeWithGemini'];
        setResult(finalStep);
      } else {
        throw new Error('予期しないレスポンス形式です');
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : '分析中にエラーが発生しました'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reddit-gift-analyzer">
      <h2>🎁 Reddit投稿分析ギフト推薦</h2>
      <p>Redditユーザー名を入力すると、その人の投稿を分析してパーソナライズされたギフトを推薦します。</p>
      
      <form onSubmit={handleSubmit} className="analysis-form">
        <div className="input-group">
          <label htmlFor="username">Redditユーザー名:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="例: username123"
            disabled={isLoading}
          />
        </div>
        
        <button type="submit" disabled={isLoading || !username.trim()}>
          {isLoading ? '分析中...' : 'ギフトを推薦する'}
        </button>
      </form>

      {result && (
        <div className="results-section">
          {result.success ? (
            <div className="success-results">
              <h3>✨ {result.username}さんへのギフト推薦</h3>
              
              {result.userProfile && (
                <div className="user-profile">
                  <h4>📊 ユーザープロファイル</h4>
                  <div className="profile-section">
                    <div className="profile-item">
                      <strong>興味・関心:</strong>
                      <ul>
                        {result.userProfile.interests.map((interest, index) => (
                          <li key={index}>{interest}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="profile-item">
                      <strong>性格特徴:</strong>
                      <ul>
                        {result.userProfile.personality_traits.map((trait, index) => (
                          <li key={index}>{trait}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="profile-item">
                      <strong>大切にしている価値観:</strong>
                      <ul>
                        {result.userProfile.values.map((value, index) => (
                          <li key={index}>{value}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {result.giftRecommendations && (
                <div className="gift-recommendations">
                  <h4>🎁 おすすめギフト</h4>
                  {result.giftRecommendations.map((gift, index) => (
                    <div key={index} className="gift-card">
                      <div className="gift-header">
                        <h5>{gift.name}</h5>
                        <span className="gift-category">{gift.category}</span>
                      </div>
                      <p className="gift-reason">{gift.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="error-results">
              <h3>❌ エラー</h3>
              <p>{result.error}</p>
              {result.redditError && (
                <p className="reddit-error">Reddit取得エラー: {result.redditError}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RedditGiftAnalyzer;