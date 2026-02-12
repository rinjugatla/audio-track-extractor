import { ffmpegService, type AudioTrackInfo } from './ffmpeg';

/** UI側で選択状態を管理するための拡張音声トラック情報 */
export interface SelectableAudioTrack extends AudioTrackInfo {
	/** ユーザーによって選択されているかどうか */
	selected: boolean;
}

/** 抽出された音声トラックのデータ構造 */
export interface ExtractedTrack {
	/** ファイル名 */
	name: string;
	/** トラック番号（1始まり） */
	number: number;
	/** Object URL (再生・ダウンロード用) */
	url: string;
	/** 表示用のラベル */
	label: string;
}

/**
 * アプリケーションのメインロジックとなるViewModelクラス
 * Svelte 5のRunesを使用してリアクティブな状態管理を行う
 */
export class AudioExtractor {
	/** FFmpegのロードが完了したかどうか */
	isLoaded = $state(false);
	/** 音声抽出処理中かどうか */
	isProcessing = $state(false);
	/** ファイル分析（プローブ）中かどうか */
	isProbing = $state(false);
	/** 現在のステータスメッセージ */
	message = $state('Loading FFmpeg...');
	/** FFmpegからのログメッセージ履歴 */
	logs = $state<string[]>([]);
	/** ユーザーが選択したファイル */
	selectedFile = $state<File | null>(null);
	/** 抽出完了したトラックのリスト */
	extractedTracks = $state<ExtractedTrack[]>([]);
	/** 検出された音声トラックのリスト */
	tracks = $state<SelectableAudioTrack[]>([]);
	/** 出力フォーマット ('mp3' | 'aac' | 'wav') */
	outputFormat = $state<'mp3' | 'aac' | 'wav'>('mp3');
	/** エラーメッセージ（nullの場合はエラーなし） */
	error = $state<string | null>(null);

	constructor() {
		// 初期化ロジックは明示的に呼び出す形にする
	}

	/**
	 * アプリケーションの初期化処理
	 * FFmpegのロードを行う
	 */
	async init() {
		try {
			await ffmpegService.load(({ message }) => {
				// ログは最新の4つ + 新しいものを保持（UI側で制御してもいいが、ロジック側で制限する）
				// ここでは全てのログを保持してもいいが、パフォーマンスを考慮して適宜トリミングするか、
				// またはUI側でslice表示するか。元のコードはslice(-4)していた。
				// ここでは全てのログを追加する形にして、表示側で制御、あるいは無限に増えないように管理する。
				this.logs = [...this.logs, message];
			});
			this.message = 'Ready';
			this.isLoaded = true;
		} catch (e) {
			this.error = 'Failed to load FFmpeg. Please check your connection or browser compatibility.';
			console.error(e);
		}
	}

	/**
	 * ファイルが選択された時のハンドラ
	 * ファイルを分析し、音声トラック情報を取得する
	 * @param file 選択されたファイル
	 */
	async handleFileSelect(file: File) {
		this.selectedFile = file;
		// Clear previous results
		this.cleanupUrls();
		this.extractedTracks = [];
		this.error = null;
		this.tracks = [];

		this.isProbing = true;
		try {
			const audioTracks = await ffmpegService.getAudioTracks(this.selectedFile);
			this.tracks = audioTracks.map((t) => ({ ...t, selected: true }));
			if (this.tracks.length === 0) {
				this.error = 'No audio tracks found in this file.';
			}
		} catch (e: any) {
			console.error(e);
			this.error = 'Failed to analyze file: ' + e.message;
		} finally {
			this.isProbing = false;
		}
	}

	/**
	 * 全トラックの選択状態を一括で切り替える
	 * @param select trueで全選択、falseで全解除
	 */
	toggleAll(select: boolean) {
		this.tracks = this.tracks.map((t) => ({ ...t, selected: select }));
	}

	/** 選択された音声トラックの抽出を実行する */
	async extractAudio() {
		if (!this.selectedFile) return;

		const selectedIndices = this.tracks.filter((t) => t.selected).map((t) => t.streamIndex);

		if (selectedIndices.length === 0) {
			this.error = 'Please select at least one track to extract.';
			return;
		}

		this.isProcessing = true;
		this.error = null;
		this.cleanupUrls();
		this.extractedTracks = [];

		try {
			const results = await ffmpegService.extractAudio(
				this.selectedFile,
				this.outputFormat,
				selectedIndices
			);

			this.extractedTracks = results.map((track) => {
				const blob = new Blob([track.data as unknown as BlobPart], {
					type: `audio/${this.outputFormat}`
				});
				const originalTrack = this.tracks.find((t) => t.streamIndex === track.streamIndex);
				return {
					name: track.filename,
					number: track.streamIndex + 1,
					url: URL.createObjectURL(blob),
					label: originalTrack ? `Track ${originalTrack.index + 1}` : `Track ${track.filename}`
				};
			});

			this.message = `Extraction complete! Extracted ${this.extractedTracks.length} tracks.`;
		} catch (e: any) {
			this.error = e.message || 'An error occurred during extraction. Check logs for details.';
			console.error(e);
		} finally {
			this.isProcessing = false;
		}
	}

	/** 生成されたObject URLを破棄してメモリリークを防ぐ */
	cleanupUrls() {
		this.extractedTracks.forEach((track) => URL.revokeObjectURL(track.url));
	}
}
