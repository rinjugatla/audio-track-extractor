# Copilot Instructions: Audio Track Extractor

## プロジェクト概要

Node.js, SvelteKit, Svelte 5 を使用し、動画ファイル内のすべての音声トラックをブラウザ上で分離・抽出するウェブアプリを構築します。
プライバシー保護と通信量削減のため、すべての処理（FFmpeg/WASM）はクライアントサイド（ブラウザ）で完結させます。

## 技術スタック

- **Frontend**: Svelte 5 (Runes mode), SvelteKit
- **Styling**: Tailwind CSS 4, DaisyUI 5
- **WASM**: @ffmpeg/ffmpeg v0.12.x, @ffmpeg/util
- **Runtime**: Node.js v24.12.0
- **Deployment**: Cloudflare Workers (adapter-cloudflare)

## コーディング規約

- **TypeScript Deep Dive 準拠**:
  - 型安全性を最大限に確保。`any` の使用を禁止し、インターフェースと型の命名を明確にする。
  - 列挙型（Enum）よりも Union Types を推奨。
- **Svelte 5 規約**:
  - `let` によるステート管理ではなく、`$state`, `$derived`, `$effect` などの Runes を使用。
  - コンポーネントは機能単位で適切に分割。
- **言語ルール**:
  - コード内のコメント、JSDoc、ドキュメント、UI テキストはすべて日本語。
  - 変数名、関数名、ブランチ名は英語。

## 主要機能と実装要件

### 1. クライアントサイド FFmpeg 処理

- `@ffmpeg/ffmpeg` を使用し、ブラウザ上で動画ファイルを読み込む。
- 動画内のすべてのストリームを解析し、音声トラック（Audio Streams）を特定する。
- ユーザーがシングルスレッド（MTなし）とマルチスレッド（MTあり）を選択できるトグルを実装。

### 2. Cloudflare Headers (COOP/COEP)

- FFmpeg WASM (SharedArrayBuffer) の動作に必要なため、`svelte.config.js` または `hooks.server.ts` 等で以下のレスポンスヘッダーを付与する。
  - `Cross-Origin-Embedder-Policy: require-corp`
  - `Cross-Origin-Opener-Policy: same-origin`

### 3. UI/UX

- **ファイルアップロード**: ドラッグ＆ドロップ対応。
- **トラック選択**: 検出された音声トラック（言語、コーデック情報を含む）を一覧表示。
- **進捗表示**: FFmpeg の `progress` イベントを利用し、処理状況をプログレスバーで表示。
- **ダウンロード**: 処理完了後、抽出された音声ファイルをブラウザから直接ダウンロード。

### 4. パフォーマンスと制限

- 大容量ファイル（GB単位）を扱う可能性があるため、ブラウザのメモリ制限を考慮し、処理中のメモリ解放を適切に行う。

## プロジェクト構造（推奨）

- `src/lib/ffmpeg/`: FFmpeg の初期化、処理ロジック。
- `src/lib/components/`: UI コンポーネント（Uploader, TrackList, Progress, Settings）。
- `src/routes/`: メインページとヘッダー制御ロジック。

## 開発フローへの指示

1. **初期設定**: `hooks.server.ts` でのセキュリティヘッダー付与を最優先。
2. **FFmpeg Worker**: WASM のロードと、スレッド切り替えロジックの実装。
3. **UI 実装**: DaisyUI を活用したレスポンシブなデザイン。
4. **エラーハンドリング**: WASM ロード失敗やメモリ不足時のユーザーへの通知。

この指示書に従い、クリーンでメンテナンス性の高いコードを生成してください。
