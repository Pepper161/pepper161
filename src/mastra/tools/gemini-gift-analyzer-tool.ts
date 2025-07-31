import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const geminiGiftAnalyzerTool = createTool({
  id: 'gemini_gift_analyzer_tool',
  description: 'Gemini AIを使用してReddit投稿データからユーザープロファイルを分析し、ギフト推薦を生成します',
  inputSchema: z.object({
    redditPosts: z.string().describe('Reddit投稿の結合テキスト'),
    username: z.string().describe('分析対象のRedditユーザー名'),
  }),
  execute: async ({ context: { redditPosts, username } }) => {
    try {
      
      // Google Generative AI Gemini APIを使用（supporterz-hackathonのロジックを採用）
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: generatePrompt(redditPosts, username)
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
      }

      const geminiData = await response.json();
      
      if (!geminiData.candidates || geminiData.candidates.length === 0) {
        throw new Error('Gemini APIから有効なレスポンスが得られませんでした');
      }

      const responseText = geminiData.candidates[0].content.parts[0].text;
      
      // JSONレスポンスを解析
      let result;
      try {
        // ```json で囲まれている場合は除去
        let cleanedResponse = responseText.trim();
        if (cleanedResponse.startsWith("```json")) {
          cleanedResponse = cleanedResponse.slice(7);
        }
        if (cleanedResponse.endsWith("```")) {
          cleanedResponse = cleanedResponse.slice(0, -3);
        }
        
        result = JSON.parse(cleanedResponse);
      } catch (parseError) {
        // JSON解析に失敗した場合はフォールバック
        result = {
          user_profile: {
            interests: ["Reddit", "オンラインコミュニティ"],
            personality_traits: ["ソーシャル", "好奇心旺盛"],
            values: ["つながり", "学習"]
          },
          gift_recommendations: [
            {
              name: "Reddit Premiumサブスクリプション",
              reason: "アクティブなRedditユーザーとして、広告なしの体験と追加機能を楽しめます",
              category: "デジタルサービス"
            },
            {
              name: "パーソナライズされたフォトブック",
              reason: "オンラインとオフラインの思い出を記念する思いやりのある方法",
              category: "パーソナライズされたギフト"
            },
            {
              name: "趣味スターターキット",
              reason: "多様な興味に基づいて、新しい趣味が喜びをもたらす可能性があります",
              category: "体験"
            }
          ]
        };
      }
      
      return {
        success: true,
        username,
        userProfile: result.user_profile,
        giftRecommendations: result.gift_recommendations,
        rawGeminiResponse: responseText
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gemini AI分析中にエラーが発生しました',
        statusCode: 500
      };
    }
  }
});

function generatePrompt(posts: string, username: string): string {
  return `
あなたは「EmotiGift」のプロフェッショナルなギフトコンサルタントです。以下のReddit投稿データを詳細に分析し、ユーザー「${username}」の個性、興味、価値観を理解して、実際に購入可能な具体的な誕生日プレゼントを3つ推薦してください。

## Reddit投稿データ分析:
${posts.substring(0, 4000)}

## 分析・推薦ガイドライン:
1. **投稿内容の深掘り**: どのサブレディットに参加しているか、どんなトピックについて語っているか
2. **趣味・興味の特定**: 継続的な関心事、専門的な知識、創作活動などを特定
3. **ライフスタイル推定**: 職業、居住環境、余暇の過ごし方を推測
4. **価格帯考慮**: 3,000円〜30,000円の範囲で異なる価格帯の商品を選定
5. **実用性重視**: Amazon、楽天、専門店で実際に購入できる具体的な商品名を提案

## 必須: 以下のJSON形式で回答:
{
  "user_profile": {
    "interests": ["具体的な興味・趣味1", "興味・趣味2", "興味・趣味3"],
    "personality_traits": ["性格特徴1", "性格特徴2", "性格特徴3"],
    "values": ["価値観1", "価値観2"],
    "lifestyle_analysis": "ライフスタイルの簡潔な説明",
    "key_subreddits": ["参加サブレディット1", "サブレディット2"]
  },
  "gift_recommendations": [
    {
      "name": "【具体的な商品名・ブランド名】",
      "price_range": "概算価格（例: 5,000円〜8,000円）",
      "reason": "Reddit投稿の具体的な内容を引用しながら、なぜこの商品がその人にぴったりなのかを詳しく説明",
      "category": "商品カテゴリ",
      "special_point": "誕生日ギフトとしての特別な価値やメッセージ",
      "where_to_buy": "購入可能な店舗・サイト（Amazon、楽天、専門店など）"
    },
    {
      "name": "【具体的な商品名・ブランド名】",
      "price_range": "概算価格",
      "reason": "投稿内容に基づく詳細な推薦理由",
      "category": "商品カテゴリ",
      "special_point": "誕生日ギフトとしての価値",
      "where_to_buy": "購入先"
    },
    {
      "name": "【具体的な商品名・ブランド名】",
      "price_range": "概算価格",
      "reason": "投稿内容に基づく詳細な推薦理由",
      "category": "商品カテゴリ",
      "special_point": "誕生日ギフトとしての価値",
      "where_to_buy": "購入先"
    }
  ]
}

**重要**: 必ず実在する商品名を提案し、そのユーザーのReddit投稿の具体的な内容を引用して推薦理由を説明してください。曖昧な提案ではなく、「この投稿でXXについて言及しているから、この具体的な商品が適している」という形で回答してください。
  `;
}