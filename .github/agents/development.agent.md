---
name: development-agent
description: Audio Track Extractor 開発専門エージェントです。SvelteKit, Svelte 5 (Runes), FFmpeg/WASM を用いた機能開発、コード改善、バグ修正、および Cloudflare 環境への最適化支援を行います。
---

## 実行可能なコマンド

- **依存関係の管理**:
  - ライブラリの追加: `pnpm install name-of-library`
  - 開発用ライブラリの追加: `pnpm install -D name-of-library`
- **開発・ビルド**:
  - 開発サーバー起動: `pnpm run dev`
  - ビルド: `pnpm run build`
  - Cloudflare ローカルプレビュー: `pnpm run preview`
  - Cloudflare 型生成: `pnpm run gen`
- **品質管理**:
  - フォーマット (Prettier): `pnpm run format`
  - Lintチェック (ESLint): `pnpm run lint`
  - 型チェック・Svelteチェック: `pnpm run check`

## テスト

- **テストフレームワーク**: Vitest, Playwright
- **ユニットテストの実行**: `pnpm run test:unit`
- **E2Eテストの実行**: `pnpm run test:e2e`
- **全テストの実行**: `pnpm run test`

## プロジェクト構成

- `src/lib/`: 再利用可能なコンポーネント、FFmpegロジック、型定義
- `src/routes/`: ページコンポーネント、エンドポイント
- `static/`: 静的アセット（FFmpeg WASMバイナリの配置検討場所）
- `tests/`: テストコード

## Gitワークフロー

- **ブランチ命名**: `feature/`, `fix/`, `docs/`, `refactor/` プレフィックスを使用（英語命名）
- **コミットメッセージ規約**: Conventional Commits形式（メッセージは日本語で記述）
  - `feat:` 新機能
  - `fix:` バグ修正
  - `update:` 既存機能の更新
  - `refactor:` リファクタリング（Runes移行など）
  - `style:` フォーマット・CSS変更
  - `docs:` ドキュメント更新
  - `test:` テストの追加・修正
- **作業終了前のチェック**: `pnpm run format; pnpm run lint; pnpm run check` を実行し、エラーがないことを確認する。

## 境界線 (Boundaries)

### 常に行うこと (Always Do)

- **Svelte 5 Runes**: 常に `$state`, `$derived`, `$effect` を使用し、古い `let` や `$: ` 構文を避ける。
- **セキュリティヘッダーの意識**: `SharedArrayBuffer` 利用のため、COOP/COEP ヘッダーに影響する変更には細心の注意を払う。
- **TypeScript Deep Dive 準拠**: インターフェース、Union Types を活用し、厳格な型定義を行う。
- **クリーンアップ**: FFmpeg のインスタンスや Object URL は、メモリリーク防止のため適切に破棄（terminate/revoke）する。

### 確認が必要なこと (Ask First)

- `package.json` への新しい依存関係の追加。
- FFmpeg WASM のロード戦略の根本的な変更。

### 絶対にやらないこと (Never Do)

- `any` 型を安易に使用しない。
- `.env` や秘密情報をリポジトリにコミットしない。
- ブラウザで動作しない Node.js 固有のライブラリをクライアントサイドロジックに含めない。
- ユーザーに通知せず、バックグラウンドで大容量ファイルの処理を強制的に開始しない。
