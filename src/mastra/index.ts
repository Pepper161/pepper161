
import { Mastra } from '@mastra/core';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { redditGeminiGiftWorkflow } from './workflows/reddit-gemini-gift-workflow';
// import { modernRedditGiftWorkflow } from './workflows/modern-reddit-gift-workflow';
import { birthdayGiftAgent } from './agents/gift-consultant-agent';

export const mastra = new Mastra({
  workflows: { 
    redditGeminiGiftWorkflow
    // modernRedditGiftWorkflow
  },
  agents: { 
    birthdayGiftAgent 
  },
  // storage: new LibSQLStore({
  //   // EmotiGift用の永続化ストレージを使用（一時的にメモリに変更）
  //   url: ":memory:",
  // }),
  logger: new PinoLogger({
    name: 'EmotiGift-Mastra',
    level: 'info',
  }),
});
