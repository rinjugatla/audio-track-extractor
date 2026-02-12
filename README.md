# Audio Track Extractor

Audio Track Extractorは、SvelteKitを使用して構築されたウェブアプリケーションで、音声トラックの抽出機能を提供します。このプロジェクトは、FFmpegライブラリを活用して音声ファイルを処理します。

## プロジェクト概要

- **技術スタック**: SvelteKit, TypeScript, TailwindCSS, DaisyUI, FFmpeg
- **主要機能**:
  - 音声ファイルのアップロード
  - 音声トラックの抽出とプレビュー
  - GitHub Pages へのデプロイ対応
- **テスト**: Vitest（ユニットテスト）、Playwright（E2Eテスト）

## セットアップ方法

### 必要なツール

- Node.js（推奨バージョン: 16以上）
- pnpm（パッケージマネージャ）

### インストール手順

1. リポジトリをクローンします。

   ```sh
   git clone <リポジトリURL>
   cd audio-track-extractor
   ```

2. 依存関係をインストールします。

   ```sh
   pnpm install
   ```

3. 開発サーバーを起動します。

   ```sh
   pnpm run dev
   ```

   ブラウザで `http://localhost:5173` を開いてアプリケーションを確認できます。

### ビルドとデプロイ

1. プロダクションビルドを作成します。

   ```sh
   pnpm run build
   ```

2. Cloudflare Workersでプレビューします。

   ```sh
   pnpm run preview
   ```

3. デプロイには、`wrangler` を使用します。環境変数を設定した後、以下のコマンドを実行してください。

   ```sh
   pnpm run deploy
   ```

## 開発計画

1. **FFmpeg機能の実装**: [x]
   - 音声トラックの抽出ロジックを作成。
   - `@ffmpeg/ffmpeg` と `@ffmpeg/util` を活用。

2. **UIの構築**: [x]
   - TailwindCSSとDaisyUIを使用して、直感的なインターフェースをデザイン。
   - 音声ファイルのアップロードとプレビュー機能を追加。

3. **テストの整備**: [x]
   - ユニットテスト（Vitest）とE2Eテスト（Playwright）を設定。
   - 主要な機能のテストケースを作成。

4. **Cloudflare Workersへのデプロイ準備**: [x]
   - `wrangler` を使用してデプロイ設定を確認。
   - 必要な環境変数を設定（ヘッダー設定完了）。

5. **ドキュメントの整備**: [ ]
   - READMEに使用方法と開発手順を追記。

> 詳細なドキュメントやサポートについては、プロジェクトの[GitHubリポジトリ](https://github.com/)をご覧ください。
