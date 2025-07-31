Next.jsプロジェクトにMastraを統合する
MastraをNext.jsアプリケーションに統合する主な方法は2つあります：別個のバックエンドサービスとして、またはNext.jsアプリに直接統合する方法です。

1. バックエンドの個別統合
以下を実現したい大規模プロジェクトに最適：

AIバックエンドを独立してスケーリング
明確な関心の分離を維持
より柔軟なデプロイメント
Mastraバックエンドの作成
CLIを使用して新しいMastraプロジェクトを作成します：

bash copy npx create-mastra@latest
詳細なセットアップ手順については、インストールガイドをご覧ください。

MastraClientのインストール
bash copy npm install @mastra/client-js@latest
MastraClientの使用
クライアントインスタンスを作成し、Next.jsアプリケーションで使用します：

lib/mastra.ts

import { MastraClient } from "@mastra/client-js";
 
// Initialize the client
export const mastraClient = new MastraClient({
  baseUrl: process.env.NEXT_PUBLIC_MASTRA_API_URL || "http://localhost:4111",
});
Reactコンポーネントでの使用例：

app/components/SimpleWeather.tsx

'use client'
 
import { mastraClient } from '@/lib/mastra'
 
export function SimpleWeather() {
  async function handleSubmit(formData: FormData) {
    const city = formData.get('city')
    const agent = mastraClient.getAgent('weatherAgent')
 
    try {
      const response = await agent.generate({
        messages: [{ role: 'user', content: `What's the weather like in ${city}?` }],
      })
      // Handle the response
      console.log(response.text)
    } catch (error) {
      console.error('Error:', error)
    }
  }
 
  return (
    <form action={handleSubmit}>
      <input name="city" placeholder="Enter city name" />
      <button type="submit">Get Weather</button>
    </form>
  )
}
デプロイメント
デプロイの準備ができたら、プラットフォーム固有のデプロイヤー（Vercel、Netlify、Cloudflare）を使用するか、任意のNode.jsホスティングプラットフォームにデプロイできます。詳細な手順については、デプロイメントガイドをご確認ください。

2. 直接統合
小規模なプロジェクトやプロトタイプに適しています。このアプローチではMastraをNext.jsアプリケーションに直接バンドルします。

Next.jsのルートでMastraを初期化する
まず、Next.jsプロジェクトのルートに移動し、Mastraを初期化します：


cd your-nextjs-app
次に初期化コマンドを実行します：

bash copy npx mastra@latest init
これによりNext.jsプロジェクトにMastraがセットアップされます。初期化やその他の設定オプションの詳細については、mastra init リファレンスをご覧ください。

Next.jsの設定
next.config.jsに以下を追加します：

next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@mastra/*"],
  // ... その他のNext.js設定
};
 
module.exports = nextConfig;
サーバーアクションの例
app/actions.ts

"use server";
 
import { mastra } from "@/mastra";
 
export async function getWeatherInfo(city: string) {
  const agent = mastra.getAgent("weatherAgent");
 
  const result = await agent.generate(`What's the weather like in ${city}?`);
 
  return result;
}
コンポーネントでの使用方法：

app/components/Weather.tsx

'use client'
 
import { getWeatherInfo } from '../actions'
 
export function Weather() {
  async function handleSubmit(formData: FormData) {
    const city = formData.get('city') as string
    const result = await getWeatherInfo(city)
    // 結果を処理する
    console.log(result)
  }
 
  return (
    <form action={handleSubmit}>
      <input name="city" placeholder="Enter city name" />
      <button type="submit">Get Weather</button>
    </form>
  )
}
APIルートの例
app/api/chat/route.ts

import { mastra } from "@/mastra";
import { NextResponse } from "next/server";
 
export async function POST(req: Request) {
  const { city } = await req.json();
  const agent = mastra.getAgent("weatherAgent");
 
  const result = await agent.stream(`What's the weather like in ${city}?`);
 
  return result.toDataStreamResponse();
}
デプロイメント
直接統合を使用する場合、MastraインスタンスはNext.jsアプリケーションと一緒にデプロイされます。以下を確認してください：

デプロイメントプラットフォームでLLM APIキーの環境変数を設定する
本番環境での適切なエラーハンドリングを実装する
AIエージェントのパフォーマンスとコストを監視する
オブザーバビリティ
Mastra は、AI オペレーションの監視、デバッグ、最適化を支援するための組み込みオブザーバビリティ機能を提供します。これには以下が含まれます：

AI オペレーションとそのパフォーマンスのトレーシング
プロンプト、コンプリーション、エラーのロギング
Langfuse や LangSmith などのオブザーバビリティプラットフォームとの統合
Next.js のローカル開発に特化した詳細なセットアップ手順や設定オプションについては、Next.js オブザーバビリティ設定ガイドをご覧ください。


プロジェクト構造
このページではMastraでのフォルダとファイルの整理方法についてのガイドを提供します。Mastraはモジュラーフレームワークであり、各モジュールを個別に、または組み合わせて使用することができます。

すべてを1つのファイルに書くこともできますし、各エージェント、ツール、ワークフローを独自のファイルに分けることもできます。

特定のフォルダ構造を強制することはありませんが、いくつかのベストプラクティスを推奨しており、CLIは適切な構造でプロジェクトをスキャフォールドします。

プロジェクト構造の例
CLIで作成されたデフォルトプロジェクトは次のような構造になります：

トップレベルフォルダ
フォルダ	説明
src/mastra	コアアプリケーションフォルダ
src/mastra/agents	エージェントの設定と定義
src/mastra/tools	カスタムツールの定義
src/mastra/workflows	ワークフローの定義
トップレベルファイル
ファイル	説明
src/mastra/index.ts	Mastraのメイン設定ファイル
.env	環境変数
package.json	Node.jsプロジェクトのメタデータ、スクリプト、依存関係
tsconfig.json	TypeScriptコンパイラの設定

レガシーワークフローにおける制御フロー：分岐、マージ、条件
複数ステップのプロセスを作成する場合、ステップを並行して実行したり、順番に連鎖させたり、結果に基づいて異なるパスをたどる必要があるかもしれません。このページでは、ロジック要件を満たすワークフローを構築するために、分岐、マージ、条件をどのように管理できるかを説明します。コードスニペットは、複雑な制御フローを構築するための主要なパターンを示しています。

並列実行
互いに依存関係のないステップを同時に実行することができます。ステップが独立したタスクを実行する場合、このアプローチによってワークフローを高速化できます。以下のコードは、2つのステップを並列に追加する方法を示しています：

myWorkflow.step(fetchUserData).step(fetchOrderData);
詳細については、並列ステップの例を参照してください。

順次実行
時には、あるステップの出力が次のステップの入力になるように、厳密な順序でステップを実行する必要があります。依存する操作をリンクするには .then() を使用します。以下のコードは、ステップを順番に連鎖させる方法を示しています：

myWorkflow.step(fetchOrderData).then(validateData).then(processOrder);
詳細については、順次ステップの例を参照してください。

分岐と合流パス
異なる結果に異なるパスが必要な場合、分岐が役立ちます。また、完了後にパスを後で合流させることもできます。以下のコードは、stepAの後に分岐し、後でstepFで収束する方法を示しています：

myWorkflow
  .step(stepA)
  .then(stepB)
  .then(stepD)
  .after(stepA)
  .step(stepC)
  .then(stepE)
  .after([stepD, stepE])
  .step(stepF);
この例では：

stepAはstepBに進み、その後stepDに進みます。
別途、stepAはstepCもトリガーし、それがstepEにつながります。
別途、stepFはstepDとstepEの両方が完了したときにトリガーされます。
詳細については、分岐パスの例を参照してください。

複数のブランチのマージ
時には、複数の他のステップが完了した後にのみ実行されるステップが必要な場合があります。Mastraは、ステップに対して複数の依存関係を指定できる複合的な.after([])構文を提供しています。

myWorkflow
  .step(fetchUserData)
  .then(validateUserData)
  .step(fetchProductData)
  .then(validateProductData)
  // This step will only run after BOTH validateUserData AND validateProductData have completed
  .after([validateUserData, validateProductData])
  .step(processOrder);
この例では：

fetchUserDataとfetchProductDataは並列ブランチで実行されます
各ブランチには独自の検証ステップがあります
processOrderステップは、両方の検証ステップが正常に完了した後にのみ実行されます
このパターンは特に以下の場合に役立ちます：

並列実行パスの結合
ワークフローに同期ポイントを実装する
進行する前にすべての必要なデータが利用可能であることを確認する
複数の.after([])呼び出しを組み合わせることで、複雑な依存関係パターンを作成することもできます：

myWorkflow
  // First branch
  .step(stepA)
  .then(stepB)
  .then(stepC)
 
  // Second branch
  .step(stepD)
  .then(stepE)
 
  // Third branch
  .step(stepF)
  .then(stepG)
 
  // This step depends on the completion of multiple branches
  .after([stepC, stepE, stepG])
  .step(finalStep);
循環依存関係とループ
ワークフローでは、特定の条件が満たされるまでステップを繰り返す必要がよくあります。Mastra では、ループを作成するための強力な2つの方法、until と while を提供しています。これらのメソッドは、繰り返しタスクを直感的に実装する方法を提供します。

手動による循環依存関係の利用（レガシーな方法）
以前のバージョンでは、条件付きで循環依存関係を手動で定義することでループを作成できました：

myWorkflow
  .step(fetchData)
  .then(processData)
  .after(processData)
  .step(finalizeData, {
    when: { "processData.status": "success" },
  })
  .step(fetchData, {
    when: { "processData.status": "retry" },
  });
この方法も引き続き利用できますが、より新しい until や while メソッドを使うことで、よりシンプルで保守しやすいループを作成できます。

until を使った条件付きループ
until メソッドは、指定した条件が真になるまでステップを繰り返します。引数は以下の通りです：

ループを終了する条件
繰り返すステップ
繰り返しステップに渡すオプションの変数
import { LegacyStep, LegacyWorkflow } from "@mastra/core/workflows/legacy";
import { z } from "zod";
 
// 目標値に達するまでカウンターをインクリメントするステップ
const incrementStep = new LegacyStep({
  id: "increment",
  inputSchema: z.object({
    // 現在のカウンター値
    counter: z.number().optional(),
  }),
  outputSchema: z.object({
    // 更新後のカウンター値
    updatedCounter: z.number(),
  }),
  execute: async ({ context }) => {
    const { counter = 0 } = context.inputData;
    return { updatedCounter: counter + 1 };
  },
});
 
workflow
  .step(incrementStep)
  .until(
    async ({ context }) => {
      // カウンターが10に達したら停止
      const result = context.getStepResult(incrementStep);
      return (result?.updatedCounter ?? 0) >= 10;
    },
    incrementStep,
    {
      // 現在のカウンターを次のイテレーションに渡す
      counter: {
        step: incrementStep,
        path: "updatedCounter",
      },
    },
  )
  .then(finalStep);
参照ベースの条件も利用できます：

workflow
  .step(incrementStep)
  .until(
    {
      ref: { step: incrementStep, path: "updatedCounter" },
      query: { $gte: 10 },
    },
    incrementStep,
    {
      counter: {
        step: incrementStep,
        path: "updatedCounter",
      },
    },
  )
  .then(finalStep);
while を使った条件付きループ
while メソッドは、指定した条件が真である間ステップを繰り返します。引数は until と同じです：

ループを継続する条件
繰り返すステップ
繰り返しステップに渡すオプションの変数
// 目標値未満の間カウンターをインクリメントするステップ
const incrementStep = new LegacyStep({
  id: "increment",
  inputSchema: z.object({
    // 現在のカウンター値
    counter: z.number().optional(),
  }),
  outputSchema: z.object({
    // 更新後のカウンター値
    updatedCounter: z.number(),
  }),
  execute: async ({ context }) => {
    const { counter = 0 } = context.inputData;
    return { updatedCounter: counter + 1 };
  },
});
 
workflow
  .step(incrementStep)
  .while(
    async ({ context }) => {
      // カウンターが10未満の間継続
      const result = context.getStepResult(incrementStep);
      return (result?.updatedCounter ?? 0) < 10;
    },
    incrementStep,
    {
      // 現在のカウンターを次のイテレーションに渡す
      counter: {
        step: incrementStep,
        path: "updatedCounter",
      },
    },
  )
  .then(finalStep);
参照ベースの条件も利用できます：

workflow
  .step(incrementStep)
  .while(
    {
      ref: { step: incrementStep, path: "updatedCounter" },
      query: { $lt: 10 },
    },
    incrementStep,
    {
      counter: {
        step: incrementStep,
        path: "updatedCounter",
      },
    },
  )
  .then(finalStep);
参照条件の比較演算子
参照ベースの条件を使用する場合、以下の比較演算子を使用できます：

演算子	説明
$eq	等しい
$ne	等しくない
$gt	より大きい
$gte	以上
$lt	より小さい
$lte	以下
条件
前のステップからのデータに基づいてステップを実行するかどうかを制御するには、when プロパティを使用します。以下は条件を指定する3つの方法です。

オプション1：関数
myWorkflow.step(
  new Step({
    id: "processData",
    execute: async ({ context }) => {
      // Action logic
    },
  }),
  {
    when: async ({ context }) => {
      const fetchData = context?.getStepResult<{ status: string }>("fetchData");
      return fetchData?.status === "success";
    },
  },
);
オプション2：クエリオブジェクト
myWorkflow.step(
  new Step({
    id: "processData",
    execute: async ({ context }) => {
      // Action logic
    },
  }),
  {
    when: {
      ref: {
        step: {
          id: "fetchData",
        },
        path: "status",
      },
      query: { $eq: "success" },
    },
  },
);
オプション3：シンプルなパス比較
myWorkflow.step(
  new Step({
    id: "processData",
    execute: async ({ context }) => {
      // Action logic
    },
  }),
  {
    when: {
      "fetchData.status": "success",
    },
  },
);
データアクセスパターン
Mastraはステップ間でデータを受け渡すためのいくつかの方法を提供しています：

コンテキストオブジェクト - コンテキストオブジェクトを通じて直接ステップの結果にアクセスする
変数マッピング - あるステップの出力を別のステップの入力に明示的にマッピングする
getStepResultメソッド - ステップの出力を取得するための型安全なメソッド
各アプローチは、ユースケースと型安全性の要件に応じて、それぞれ利点があります。

getStepResultメソッドの使用
getStepResultメソッドは、ステップの結果にアクセスするための型安全な方法を提供します。TypeScriptを使用する場合は、型情報を保持するためにこのアプローチが推奨されます。

基本的な使用法
より良い型安全性のために、getStepResultに型パラメータを提供することができます：

src/mastra/workflows/get-step-result.ts

import { LegacyStep, LegacyWorkflow } from "@mastra/core/workflows/legacy";
import { z } from "zod";
 
const fetchUserStep = new LegacyStep({
  id: "fetchUser",
  outputSchema: z.object({
    name: z.string(),
    userId: z.string(),
  }),
  execute: async ({ context }) => {
    return { name: "John Doe", userId: "123" };
  },
});
 
const analyzeDataStep = new LegacyStep({
  id: "analyzeData",
  execute: async ({ context }) => {
    // Type-safe access to previous step result
    const userData = context.getStepResult<{ name: string; userId: string }>(
      "fetchUser",
    );
 
    if (!userData) {
      return { status: "error", message: "User data not found" };
    }
 
    return {
      analysis: `Analyzed data for user ${userData.name}`,
      userId: userData.userId,
    };
  },
});
ステップ参照の使用
最も型安全なアプローチは、getStepResult呼び出しで直接ステップを参照することです：

src/mastra/workflows/step-reference.ts

import { LegacyStep, LegacyWorkflow } from "@mastra/core/workflows/legacy";
import { z } from "zod";
 
// Define step with output schema
const fetchUserStep = new LegacyStep({
  id: "fetchUser",
  outputSchema: z.object({
    userId: z.string(),
    name: z.string(),
    email: z.string(),
  }),
  execute: async () => {
    return {
      userId: "user123",
      name: "John Doe",
      email: "john@example.com",
    };
  },
});
 
const processUserStep = new LegacyStep({
  id: "processUser",
  execute: async ({ context }) => {
    // TypeScript will infer the correct type from fetchUserStep's outputSchema
    const userData = context.getStepResult(fetchUserStep);
 
    return {
      processed: true,
      userName: userData?.name,
    };
  },
});
 
const workflow = new LegacyWorkflow({
  name: "user-workflow",
});
 
workflow.step(fetchUserStep).then(processUserStep).commit();
変数マッピングの使用
変数マッピングは、ステップ間のデータフローを定義する明示的な方法です。 このアプローチは依存関係を明確にし、優れた型安全性を提供します。 ステップに注入されたデータはcontext.inputDataオブジェクトで利用可能であり、ステップのinputSchemaに基づいて型付けされます。

src/mastra/workflows/variable-mapping.ts

import { LegacyStep, LegacyWorkflow } from "@mastra/core/workflows/legacy";
import { z } from "zod";
 
const fetchUserStep = new LegacyStep({
  id: "fetchUser",
  outputSchema: z.object({
    userId: z.string(),
    name: z.string(),
    email: z.string(),
  }),
  execute: async () => {
    return {
      userId: "user123",
      name: "John Doe",
      email: "john@example.com",
    };
  },
});
 
const sendEmailStep = new LegacyStep({
  id: "sendEmail",
  inputSchema: z.object({
    recipientEmail: z.string(),
    recipientName: z.string(),
  }),
  execute: async ({ context }) => {
    const { recipientEmail, recipientName } = context.inputData;
 
    // Send email logic here
    return {
      status: "sent",
      to: recipientEmail,
    };
  },
});
 
const workflow = new LegacyWorkflow({
  name: "email-workflow",
});
 
workflow
  .step(fetchUserStep)
  .then(sendEmailStep, {
    variables: {
      // Map specific fields from fetchUser to sendEmail inputs
      recipientEmail: { step: fetchUserStep, path: "email" },
      recipientName: { step: fetchUserStep, path: "name" },
    },
  })
  .commit();
変数マッピングの詳細については、ワークフローバリアブルによるデータマッピングのドキュメントをご覧ください。

Contextオブジェクトの使用
contextオブジェクトは、すべてのステップ結果とその出力に直接アクセスすることができます。この方法はより柔軟ですが、型安全性を維持するためには慎重な取り扱いが必要です。 ステップの結果には context.steps オブジェクトを通じて直接アクセスできます。

src/mastra/workflows/context-access.ts

import { LegacyStep, LegacyWorkflow } from "@mastra/core/workflows/legacy";
import { z } from "zod";
 
const processOrderStep = new LegacyStep({
  id: "processOrder",
  execute: async ({ context }) => {
    // Access data from a previous step
    let userData: { name: string; userId: string };
    if (context.steps["fetchUser"]?.status === "success") {
      userData = context.steps.fetchUser.output;
    } else {
      throw new Error("User data not found");
    }
 
    return {
      orderId: "order123",
      userId: userData.userId,
      status: "processing",
    };
  },
});
 
const workflow = new LegacyWorkflow({
  name: "order-workflow",
});
 
workflow.step(fetchUserStep).then(processOrderStep).commit();
ワークフローレベルの型安全性
ワークフロー全体で包括的な型安全性を確保するために、すべてのステップの型を定義し、それらをWorkflowに渡すことができます。 これにより、条件や最終的なワークフロー出力でcontextオブジェクトやステップ結果に対して型安全性を得ることができます。

src/mastra/workflows/workflow-typing.ts

import { LegacyStep, LegacyWorkflow } from "@mastra/core/workflows/legacy";
import { z } from "zod";
 
// Create steps with typed outputs
const fetchUserStep = new LegacyStep({
  id: "fetchUser",
  outputSchema: z.object({
    userId: z.string(),
    name: z.string(),
    email: z.string(),
  }),
  execute: async () => {
    return {
      userId: "user123",
      name: "John Doe",
      email: "john@example.com",
    };
  },
});
 
const processOrderStep = new LegacyStep({
  id: "processOrder",
  execute: async ({ context }) => {
    // TypeScript knows the shape of userData
    const userData = context.getStepResult(fetchUserStep);
 
    return {
      orderId: "order123",
      status: "processing",
    };
  },
});
 
const workflow = new LegacyWorkflow<
  [typeof fetchUserStep, typeof processOrderStep]
>({
  name: "typed-workflow",
});
 
workflow
  .step(fetchUserStep)
  .then(processOrderStep)
  .until(async ({ context }) => {
    // TypeScript knows the shape of userData here
    const res = context.getStepResult("fetchUser");
    return res?.userId === "123";
  }, processOrderStep)
  .commit();
トリガーデータへのアクセス
ステップ結果に加えて、ワークフローを開始した元のトリガーデータにもアクセスできます。

src/mastra/workflows/trigger-data.ts

import { LegacyStep, LegacyWorkflow } from "@mastra/core/workflows/legacy";
import { z } from "zod";
 
// Define trigger schema
const triggerSchema = z.object({
  customerId: z.string(),
  orderItems: z.array(z.string()),
});
 
type TriggerType = z.infer<typeof triggerSchema>;
 
const processOrderStep = new LegacyStep({
  id: "processOrder",
  execute: async ({ context }) => {
    // Access trigger data with type safety
    const triggerData = context.getStepResult<TriggerType>("trigger");
 
    return {
      customerId: triggerData?.customerId,
      itemCount: triggerData?.orderItems.length || 0,
      status: "processing",
    };
  },
});
 
const workflow = new LegacyWorkflow({
  name: "order-workflow",
  triggerSchema,
});
 
workflow.step(processOrderStep).commit();
レジュームデータへのアクセス
ステップに注入されたデータは context.inputData オブジェクトで利用でき、ステップの inputSchema に基づいて型付けされます。

src/mastra/workflows/resume-data.ts

import { LegacyStep, LegacyWorkflow } from "@mastra/core/workflows/legacy";
import { z } from "zod";
 
const processOrderStep = new LegacyStep({
  id: "processOrder",
  inputSchema: z.object({
    orderId: z.string(),
  }),
  execute: async ({ context, suspend }) => {
    const { orderId } = context.inputData;
 
    if (!orderId) {
      await suspend();
      return;
    }
 
    return {
      orderId,
      status: "processed",
    };
  },
});
 
const workflow = new LegacyWorkflow({
  name: "order-workflow",
});
 
workflow.step(processOrderStep).commit();
 
const run = workflow.createRun();
const result = await run.start();
 
const resumedResult = await workflow.resume({
  runId: result.runId,
  stepId: "processOrder",
  inputData: {
    orderId: "123",
  },
});
 
console.log({ resumedResult });
ワークフロー結果へのアクセス
Workflow 型パラメータにステップ型を注入することで、ワークフローの結果に型安全にアクセスできます。

src/mastra/workflows/get-results.ts

import { LegacyStep, LegacyWorkflow } from "@mastra/core/workflows/legacy";
import { z } from "zod";
 
const fetchUserStep = new LegacyStep({
  id: "fetchUser",
  outputSchema: z.object({
    userId: z.string(),
    name: z.string(),
    email: z.string(),
  }),
  execute: async () => {
    return {
      userId: "user123",
      name: "John Doe",
      email: "john@example.com",
    };
  },
});
 
const processOrderStep = new LegacyStep({
  id: "processOrder",
  outputSchema: z.object({
    orderId: z.string(),
    status: z.string(),
  }),
  execute: async ({ context }) => {
    const userData = context.getStepResult(fetchUserStep);
    return {
      orderId: "order123",
      status: "processing",
    };
  },
});
 
const workflow = new LegacyWorkflow<
  [typeof fetchUserStep, typeof processOrderStep]
>({
  name: "typed-workflow",
});
 
workflow.step(fetchUserStep).then(processOrderStep).commit();
 
const run = workflow.createRun();
const result = await run.start();
 
// The result is a discriminated union of the step results
// So it needs to be narrowed down via status checks
if (result.results.processOrder.status === "success") {
  // TypeScript will know the shape of the results
  const orderId = result.results.processOrder.output.orderId;
  console.log({ orderId });
}
 
if (result.results.fetchUser.status === "success") {
  const userId = result.results.fetchUser.output.userId;
  console.log({ userId });
}
データフローのベストプラクティス
型安全性のために Step 参照とともに getStepResult を使用する

TypeScript が正しい型を推論できるようにする
コンパイル時に型エラーを検出できる
*依存関係を明示するために変数マッピングを使用する

データフローが明確かつ保守しやすくなる
ステップ間の依存関係をドキュメント化できる
ステップごとに出力スキーマを定義する

実行時にデータを検証できる
execute 関数の戻り値の型を検証できる
TypeScript での型推論が向上する
データが存在しない場合も適切に処理する

プロパティへアクセスする前に必ずステップ結果の有無を確認する
オプションデータにはフォールバック値を用意する
データ変換はシンプルに保つ

変数マッピング内ではなく、専用のステップでデータを変換する
ワークフローのテストやデバッグが容易になる
データフロー手法の比較
手法	型安全性	明示性	ユースケース
getStepResult	最高	高い	厳格な型付けが必要な複雑なワークフロー
変数マッピング	高い	高い	依存関係を明確にしたい場合
context.steps	中程度	低い	シンプルなワークフローでステップデータへ素早くアクセスしたい場合
ユースケースに合ったデータフロー手法を選択することで、型安全かつ保守性の高いワークフローを構築できます。
