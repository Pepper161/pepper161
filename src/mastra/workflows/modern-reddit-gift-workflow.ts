import { Workflow } from '@mastra/core';
import { z } from 'zod';
import { redditAnalyzerTool } from '../tools/reddit-analyzer-tool';
import { geminiGiftAnalyzerTool } from '../tools/gemini-gift-analyzer-tool';

export const modernRedditGiftWorkflow = new Workflow({
  name: 'modern-reddit-gift-workflow',
  triggerSchema: z.object({
    redditUsername: z.string().describe('分析対象のRedditユーザー名'),
    postLimit: z.number().min(1).max(100).default(50).optional().describe('取得する投稿数の上限'),
  }),
})
.step({
  id: 'fetchRedditData',
  execute: async ({ context }) => {
    const trigger = context.machineContext?.triggerPayload || context.triggerPayload;
    const result = await redditAnalyzerTool.execute({
      context: {
        redditUsername: trigger.redditUsername,
        postLimit: trigger.postLimit || 50,
        timeRange: 'year' as const
      }
    });
    return result;
  }
})
.step({
  id: 'analyzeWithGemini', 
  execute: async ({ context }) => {
    const redditResult = context.stepResults?.fetchRedditData;
    if (!redditResult?.success || !redditResult.combinedPostText) {
      throw new Error('Reddit投稿の取得に失敗しました');
    }
    const result = await geminiGiftAnalyzerTool.execute({
      context: {
        redditPosts: redditResult.combinedPostText,
        username: redditResult.username || 'unknown'
      }
    });
    return result;
  }
})
.commit();