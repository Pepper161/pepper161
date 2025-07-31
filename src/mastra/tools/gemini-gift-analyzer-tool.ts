import { Tool } from '@mastra/core/tools';
import { z } from 'zod';

export const geminiGiftAnalyzerTool = new Tool({
  id: 'gemini_gift_analyzer_tool',
  description: 'Gemini AIを使用してReddit投稿データからユーザープロファイルを分析し、ギフト推薦を生成します',
  inputSchema: z.object({
    redditPosts: z.string().describe('Reddit投稿の結合テキスト'),
    username: z.string().describe('分析対象のRedditユーザー名'),
  }),
  execute: async ({ context, input }) => {
    try {
      const { redditPosts, username } = input;
      
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
以下のReddit投稿から、ユーザー「${username}」の分析を行い、3つの思いやりのある誕生日ギフトを推薦してください。

Reddit投稿データ:
${posts.substring(0, 4000)}

以下のJSON形式で回答してください:
{
  "user_profile": {
    "interests": ["興味1", "興味2", "興味3"],
    "personality_traits": ["特徴1", "特徴2", "特徴3"],
    "values": ["価値観1", "価値観2"]
  },
  "gift_recommendations": [
    {
      "name": "ギフト名1",
      "reason": "この投稿に基づいて、なぜこのギフトが彼らにぴったりなのか",
      "category": "カテゴリ（例：テック、本、体験など）"
    },
    {
      "name": "ギフト名2", 
      "reason": "この投稿に基づいて、なぜこのギフトが彼らにぴったりなのか",
      "category": "カテゴリ"
    },
    {
      "name": "ギフト名3",
      "reason": "この投稿に基づいて、なぜこのギフトが彼らにぴったりなのか",
      "category": "カテゴリ"
    }
  ]
}
  `;
}