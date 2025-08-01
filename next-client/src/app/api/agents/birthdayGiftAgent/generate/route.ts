import { NextRequest, NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    const userMessage = messages[0]?.content;
    if (!userMessage) {
      return NextResponse.json({ error: 'No message content' }, { status: 400 });
    }

    // Extract Reddit username from the message
    const usernameMatch = userMessage.match(/「([^」]+)」/);
    const username = usernameMatch ? usernameMatch[1] : null;

    if (!username) {
      return NextResponse.json({ error: 'Username not found in message' }, { status: 400 });
    }

    // Fetch Reddit data
    const redditData = await fetchRedditPosts(username);
    
    // Generate AI response
    const prompt = `
あなたは優秀なプレゼント選びの専門家です。以下のRedditユーザー「${username}」の投稿内容を詳細に分析し、
その人だけの個性と特徴を深く理解して、本当に驚いてもらえる誕生日プレゼントを3つ提案してください。

Reddit投稿データ:
${redditData}

## 出力フォーマット **【厳格遵守】**

**重要: 出力規則**
- 出力は **JSONのみ**。前置き・後置きの文章、Markdown、コードフェンスは禁止。
- JSONは **ダブルクォート**で囲う、末尾カンマ禁止、null/undefined禁止（空なら空配列もしくは空文字で置き換え）。
- 文字種はUTF-8。理由内で引用する際は 「」を使い、"を使わない（エスケープ事故回避）。

{
  "user_profile": {
    "interests": ["具体的な興味1", "専門分野2", "趣味・嗜好3"],
    "personality_traits": ["性格1", "人柄2", "思考パターン3"],
    "values": ["価値観1", "大切にしていること2"],
    "key_subreddits": ["主要なサブレディット1", "サブレディット2"]
  },
  "gift_recommendations": [
    {
      "name": "具体的なプレゼント名1",
      "price_range": "5,000円〜8,000円",
      "reason": "投稿の具体的な内容を引用した推薦理由",
      "category": "カテゴリー",
      "special_point": "誕生日ギフトとしての特別な価値",
      "amazon_keywords": "実際に購入可能な具体的検索キーワード"
    },
    {
      "name": "具体的なプレゼント名2",
      "price_range": "概算価格",
      "reason": "サブレディットでの投稿に基づく推薦理由",
      "category": "カテゴリー",
      "special_point": "誕生日ギフトとしての特別な価値",
      "amazon_keywords": "実際に購入可能な具体的検索キーワード"
    },
    {
      "name": "具体的なプレゼント名3",
      "price_range": "概算価格",
      "reason": "価値観や悩みから導き出された推薦理由",
      "category": "カテゴリー",
      "special_point": "誕生日ギフトとしての特別な価値",
      "amazon_keywords": "実際に購入可能な具体的検索キーワード"
    }
  ]
}
`;

    const { text } = await generateText({
      model: google('gemini-2.0-flash-exp'),
      prompt: prompt,
    });

    return NextResponse.json({ text });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function fetchRedditPosts(username: string): Promise<string> {
  try {
    const response = await fetch(
      `https://www.reddit.com/user/${username}/submitted.json?limit=25&sort=top&t=year`,
      {
        headers: {
          'User-Agent': 'EmotiGift/1.0.0 (Gift Recommendation Bot)'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data = await response.json();
    const posts = data.data?.children || [];
    
    if (posts.length === 0) {
      return `ユーザー「${username}」の公開投稿が見つかりませんでした。一般的な趣味を想定して推薦してください。`;
    }

    const postTexts = posts.map((post: any) => {
      const postData = post.data;
      return `Subreddit: r/${postData.subreddit}
Title: ${postData.title}
Content: ${postData.selftext || '(画像・リンク投稿)'}
Score: ${postData.score}↑ Comments: ${postData.num_comments}💬
---`;
    }).join('\n');

    return postTexts;
  } catch (error) {
    console.error('Reddit fetch error:', error);
    return `ユーザー「${username}」のRedditデータ取得に失敗しました。一般的な趣味を想定して推薦してください。`;
  }
}