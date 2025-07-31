import { LegacyStep, LegacyWorkflow } from '@mastra/core/workflows/legacy';
import { z } from 'zod';
import { redditAnalyzerTool } from '../tools/reddit-analyzer-tool';
import { geminiGiftAnalyzerTool } from '../tools/gemini-gift-analyzer-tool';

// Reddit投稿データ取得ステップ
const fetchRedditDataStep = new LegacyStep({
  id: 'fetchRedditData',
  inputSchema: z.object({
    redditUsername: z.string(),
    postLimit: z.number().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    username: z.string().optional(),
    combinedPostText: z.string().optional(),
    analysisData: z.any().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const triggerData = context.getStepResult('trigger');
    const redditUsername = triggerData?.redditUsername;
    const postLimit = triggerData?.postLimit || 50;
    
    if (!redditUsername) {
      return {
        success: false,
        error: 'Redditユーザー名が指定されていません'
      };
    }

    const result = await redditAnalyzerTool.execute({
      context,
      input: {
        redditUsername,
        postLimit,
        timeRange: 'year' as const
      }
    });
    
    return result;
  }
});

// Gemini AI分析ステップ
const analyzeWithGeminiStep = new LegacyStep({
  id: 'analyzeWithGemini',
  outputSchema: z.object({
    success: z.boolean(),
    username: z.string().optional(),
    userProfile: z.any().optional(),
    giftRecommendations: z.any().optional(),
    error: z.string().optional(),
    redditError: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const redditResult = context.getStepResult(fetchRedditDataStep);
    
    // Reddit取得が失敗した場合はエラーを返す
    if (!redditResult?.success || !redditResult.combinedPostText || !redditResult.username) {
      return {
        success: false,
        error: 'Reddit投稿の取得に失敗しました',
        redditError: redditResult?.error
      };
    }
    
    const result = await geminiGiftAnalyzerTool.execute({
      context,
      input: {
        redditPosts: redditResult.combinedPostText,
        username: redditResult.username
      }
    });
    
    return result;
  }
});

// レガシーワークフローの定義
export const redditGeminiGiftWorkflow = new LegacyWorkflow({
  name: 'reddit-gemini-gift-workflow',
  triggerSchema: z.object({
    redditUsername: z.string().describe('分析対象のRedditユーザー名'),
    postLimit: z.number().min(1).max(100).default(50).optional().describe('取得する投稿数の上限'),
  }),
});

// ワークフローステップの構築
redditGeminiGiftWorkflow
  .step(fetchRedditDataStep)
  .then(analyzeWithGeminiStep)
  .commit();