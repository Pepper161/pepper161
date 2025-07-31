import { Tool } from '@mastra/core/tools';
import { z } from 'zod';

export const redditAnalyzerTool = new Tool({
  id: 'reddit_analyzer_tool',
  description: 'Reddit JSON APIを使用してユーザーの投稿を取得し、その人の興味・価値観・性格を分析します',
  inputSchema: z.object({
    redditUsername: z.string().describe('分析対象のRedditユーザー名'),
    postLimit: z.number().min(1).max(100).default(50).describe('取得する投稿数の上限'),
    timeRange: z.enum(['week', 'month', 'year', 'all']).default('year').describe('取得する投稿の期間')
  }),
  execute: async ({ input }) => {
    try {
      const { redditUsername, postLimit, timeRange } = input;
      
      // Reddit JSON APIからユーザーの投稿を取得（supporterz-hackathonロジックを採用）
      const redditApiUrl = `https://www.reddit.com/user/${redditUsername}/submitted.json?limit=${postLimit}`;
      
      const response = await fetch(redditApiUrl, {
        headers: {
          'User-Agent': 'EmotiGift/1.0'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: 'ユーザーが見つかりません。ユーザー名を確認してください。',
            statusCode: 404
          };
        }
        throw new Error(`Reddit API Error: ${response.status} ${response.statusText}`);
      }
      
      const redditData = await response.json();
      
      if (!redditData.data || !redditData.data.children || redditData.data.children.length === 0) {
        return {
          success: false,
          error: 'このユーザーの投稿が見つからないか、プライベート設定になっています。',
          statusCode: 204
        };
      }
      
      // 投稿データを処理（supporterz-hackathonの形式に合わせる）  
      const posts = redditData.data.children.slice(0, 20).map((child: any) => {
        const post = child.data;
        return {
          id: post.id,
          title: post.title || '',
          content: post.selftext || '',
          subreddit: post.subreddit || '',
          score: post.score || 0,
          num_comments: post.num_comments || 0,
          created_utc: post.created_utc,
          url: post.url,
          permalink: `https://reddit.com${post.permalink}`
        };
      });

      // supporterz-hackathon形式の投稿テキスト生成
      const postTexts = posts.map(post => 
        `Subreddit: ${post.subreddit}\nTitle: ${post.title}\nText: ${post.content}\n---`
      );
      const combinedPostText = postTexts.join('\n');
      
      // サブレディットの分析
      const subredditFrequency = posts.reduce((acc: Record<string, number>, post) => {
        acc[post.subreddit] = (acc[post.subreddit] || 0) + 1;
        return acc;
      }, {});
      
      const topSubreddits = Object.entries(subredditFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([subreddit, count]) => ({ subreddit, count }));
      
      // キーワード抽出（簡易版）
      const allText = posts.map(post => `${post.title} ${post.content}`).join(' ');
      const keywords = extractKeywords(allText);
      
      // 活動パターン分析
      const activityPattern = analyzeActivityPattern(posts);
      
      return {
        success: true,
        username: redditUsername,
        combinedPostText, // Gemini AIでの分析用
        analysisData: {
          totalPosts: posts.length,
          posts: posts.slice(0, 10), // 最新10件のみ詳細データ
          topSubreddits,
          keywords,
          activityPattern,
          analysisMetadata: {
            analyzedAt: new Date().toISOString(),
            timeRange,
            postLimit
          }
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Reddit投稿の取得中にエラーが発生しました',
        statusCode: 500
      };
    }
  }
});

// キーワード抽出関数（簡易版）
function extractKeywords(text: string): Array<{word: string, frequency: number}> {
  // 基本的なテキスト前処理
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => 
      word.length > 3 && 
      !['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'said', 'each', 'which', 'their', 'time', 'about', 'would', 'there', 'could', 'other', 'more', 'very', 'what', 'know', 'just', 'first', 'into', 'over', 'think', 'also', 'your', 'work', 'life', 'only', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word)
    );
  
  // 頻度カウント
  const wordFreq = words.reduce((acc: Record<string, number>, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});
  
  return Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20)
    .map(([word, frequency]) => ({ word, frequency }));
}

// 活動パターン分析
function analyzeActivityPattern(posts: any[]) {
  if (posts.length === 0) return null;
  
  const postTimes = posts.map(post => new Date(post.created_utc * 1000));
  const avgScore = posts.reduce((sum, post) => sum + post.score, 0) / posts.length;
  const totalComments = posts.reduce((sum, post) => sum + post.num_comments, 0);
  
  // 最も古い投稿と新しい投稿
  const oldestPost = new Date(Math.min(...postTimes.map(date => date.getTime())));
  const newestPost = new Date(Math.max(...postTimes.map(date => date.getTime())));
  
  return {
    averageScore: Math.round(avgScore * 10) / 10,
    totalComments,
    postingPeriod: {
      from: oldestPost.toISOString().split('T')[0],
      to: newestPost.toISOString().split('T')[0]
    },
    averagePostsPerMonth: posts.length / Math.max(1, Math.round((newestPost.getTime() - oldestPost.getTime()) / (1000 * 60 * 60 * 24 * 30)))
  };
}