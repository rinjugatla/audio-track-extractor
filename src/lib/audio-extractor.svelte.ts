import { ffmpegService, type AudioTrackInfo } from './ffmpeg';

// UI用の拡張トラック情報
export interface SelectableAudioTrack extends AudioTrackInfo {
	selected: boolean;
}

export interface ExtractedTrack {
	name: string;
	url: string;
	label: string;
}

export class AudioExtractor {
	isLoaded = $state(false);
	isProcessing = $state(false);
	isProbing = $state(false);
	message = $state('Loading FFmpeg...');
	logs = $state<string[]>([]);
	selectedFile = $state<File | null>(null);
	extractedTracks = $state<ExtractedTrack[]>([]);
	tracks = $state<SelectableAudioTrack[]>([]);
	outputFormat = $state<'mp3' | 'aac' | 'wav'>('mp3');
	error = $state<string | null>(null);

	constructor() {
		// 初期化ロジックは明示的に呼び出す形にする
	}

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

	toggleAll(select: boolean) {
		this.tracks = this.tracks.map((t) => ({ ...t, selected: select }));
	}

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

	cleanupUrls() {
		this.extractedTracks.forEach((track) => URL.revokeObjectURL(track.url));
	}
}
