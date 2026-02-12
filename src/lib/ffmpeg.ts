import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

/**
 * 音声トラックに関する情報を保持するインターフェース
 */
export interface AudioTrackInfo {
	/** トラックの連番インデックス (0始まり) */
	index: number;
	/** FFmpegによって割り当てられたグローバルなストリームインデックス (例: 0:1 => 1) */
	streamIndex: number;
	/** 言語コード (例: 'jpn', 'eng', 'und'など) */
	language?: string;
	/** コーデック名 (例: 'aac', 'mp3', 'pcm_s16le'など) */
	codec: string;
	/** ストリームの詳細な説明 */
	description: string;
}

/**
 * FFmpegの操作を管理するサービスクラス
 * シングルトンとしてインスタンス化され、FFmpegのロード、ファイル分析、音声抽出の責務を負う
 */
export class FFmpegService {
	private ffmpeg: FFmpeg | null = null;
	private loaded = false;

	constructor() {
		// SSRエラーを回避するため、コンストラクタではFFmpegをインスタンス化しない
	}

	/**
	 * FFmpegコアとWASMをロードし、初期化する
	 * @param messageCallback FFmpegからのログメッセージを受け取るコールバック関数
	 */
	async load(messageCallback?: (msg: { message: string; type: string }) => void) {
		if (this.loaded && this.ffmpeg) return;

		if (!this.ffmpeg) {
			this.ffmpeg = new FFmpeg();
		}

		const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

		if (messageCallback) {
			this.ffmpeg.on('log', messageCallback);
			// 必要な場合はここで'progress'イベントもハンドル可能
		}

		await this.ffmpeg.load({
			coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
			wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
		});

		this.loaded = true;
	}

	/**
	 * 動画/音声ファイルから音声トラック情報を取得する
	 * @param file 分析対象のファイル
	 * @returns 検出された音声トラックのリストと動画の長さ（秒）
	 * @throws FFmpegがロードされていない場合にエラーをスロー
	 */
	async getAudioTracks(file: File): Promise<{ tracks: AudioTrackInfo[]; duration: number }> {
		if (!this.loaded || !this.ffmpeg) {
			throw new Error('FFmpeg not loaded');
		}

		const inputDir = '/input_mnt_probe';
		const fileName = file.name;
		const inputPath = `${inputDir}/${fileName}`;

		try {
			await this.ffmpeg.createDir(inputDir);
		} catch (e) {
			// ディレクトリが既に存在する場合は無視
		}

		// ファイルをメモリに全てロードせず処理するためWORKERFSを使用
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await this.ffmpeg.mount('WORKERFS' as any, { files: [file] }, inputDir);

		const logs: string[] = [];
		const logHandler = ({ message }: { message: string }) => logs.push(message);
		this.ffmpeg.on('log', logHandler);

		try {
			// ファイル情報を取得のみ行うために入力として指定だけする
			await this.ffmpeg.exec(['-i', inputPath]);
		} catch (e) {
			// 実行情報を表示して終了コード1で終わるのは仕様通りの挙動
		}

		this.ffmpeg.off('log', logHandler);

		try {
			await this.ffmpeg.unmount(inputDir);
			await this.ffmpeg.deleteDir(inputDir);
		} catch (cleanupErr) {
			console.error('Cleanup error:', cleanupErr);
		}

		const output = logs.join('\n');
		const tracks: AudioTrackInfo[] = [];
		let duration = 0;

		// Duration: 00:09:42.57, ...
		const durationMatch = /Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/.exec(output);
		if (durationMatch) {
			const hours = parseFloat(durationMatch[1]);
			const minutes = parseFloat(durationMatch[2]);
			const seconds = parseFloat(durationMatch[3]);
			duration = hours * 3600 + minutes * 60 + seconds;
		}

		// FFmpegの出力からストリーム情報を解析する正規表現
		const regex = /Stream #0:(\d+)(?:.*?\((.*?)\))?.*?: Audio: (.*)/g;
		let match;

		let audioIndex = 0;
		while ((match = regex.exec(output)) !== null) {
			const streamIndex = parseInt(match[1], 10);
			const language = match[2] || 'und';
			const details = match[3];
			const codec = details.split(' ')[0].trim().replace(',', '');

			tracks.push({
				index: audioIndex++,
				streamIndex: streamIndex,
				language,
				codec,
				description: details
			});
		}

		return { tracks, duration };
	}

	/**
	 * 指定された音声トラックを抽出し、指定フォーマットに変換する
	 * @param file ソースファイル
	 * @param outputFormat 出力フォーマット ('mp3' | 'aac' | 'wav')
	 * @param targetStreamIndices 抽出対象のストリームインデックス配列。空の場合は全ての音声トラックを抽出
	 * @param totalDuration ファイルの総時間（秒）。進捗計算用
	 * @param onProgress 進捗更新コールバック
	 * @returns 抽出されたファイルのバイナリデータとメタ情報の配列
	 */
	async extractAudio(
		file: File,
		outputFormat: 'mp3' | 'aac' | 'wav' = 'mp3',
		targetStreamIndices: number[] = [],
		totalDuration: number = 0,
		onProgress?: (ratio: number) => void
	): Promise<{ filename: string; data: Uint8Array; streamIndex: number }[]> {
		if (!this.loaded || !this.ffmpeg) {
			throw new Error('FFmpeg not loaded');
		}

		const inputDir = '/input_mnt';
		const fileName = file.name;
		const inputPath = `${inputDir}/${fileName}`;

		try {
			await this.ffmpeg.createDir(inputDir);
		} catch (e) {
			// ディレクトリが既に存在する場合
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await this.ffmpeg.mount('WORKERFS' as any, { files: [file] }, inputDir);

		// 抽出対象が指定されていない場合、再スキャンして検出を試みる
		if (targetStreamIndices.length === 0) {
			const logs: string[] = [];
			const logHandler = ({ message }: { message: string }) => logs.push(message);
			this.ffmpeg.on('log', logHandler);
			try {
				await this.ffmpeg.exec(['-i', inputPath]);
			} catch (e) {
				/* expected */
			}
			this.ffmpeg.off('log', logHandler);

			const output = logs.join('\n');
			const regex = /Stream #0:(\d+).*?: Audio:/g;
			let match;
			while ((match = regex.exec(output)) !== null) {
				targetStreamIndices.push(parseInt(match[1], 10));
			}
		}

		if (targetStreamIndices.length === 0) {
			await this.ffmpeg.unmount(inputDir);
			await this.ffmpeg.deleteDir(inputDir);
			throw new Error('No audio tracks found or selected');
		}

		const results: { filename: string; data: Uint8Array; streamIndex: number }[] = [];
		const args = ['-i', inputPath];
		const outputNames: { name: string; streamIndex: number }[] = [];

		const codecArgs = this.getCodecArgs(outputFormat).filter((a) => a !== '-vn');

		targetStreamIndices.forEach((streamIndex, i) => {
			const outName = `track_${streamIndex}_${i}.${outputFormat}`;
			outputNames.push({ name: outName, streamIndex });

			// 特定のストリームをマップ
			args.push('-map', `0:${streamIndex}`);
			// コーデックオプションを追加
			args.push(...codecArgs);
			// 出力ファイル名
			args.push(outName);
		});

		// 進捗を監視するためのログハンドラ
		const progressHandler = ({ message }: { message: string }) => {
			if (totalDuration > 0 && onProgress) {
				const timeMatch = /time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/.exec(message);
				if (timeMatch) {
					const hours = parseFloat(timeMatch[1]);
					const minutes = parseFloat(timeMatch[2]);
					const seconds = parseFloat(timeMatch[3]);
					const currentTime = hours * 3600 + minutes * 60 + seconds;
					const ratio = Math.min(currentTime / totalDuration, 1.0);
					onProgress(ratio);
				}
			}
		};
		this.ffmpeg.on('log', progressHandler);

		try {
			await this.ffmpeg.exec(args);
			this.ffmpeg.off('log', progressHandler);

			// 出力ファイルを読み込む
			for (const outInfo of outputNames) {
				try {
					const data = await this.ffmpeg.readFile(outInfo.name);
					results.push({
						filename: outInfo.name,
						data: data as Uint8Array,
						streamIndex: outInfo.streamIndex
					});
					await this.ffmpeg.deleteFile(outInfo.name);
				} catch (e) {
					console.warn(`Could not read output file ${outInfo.name}`, e);
				}
			}
		} finally {
			// クリーンアップ
			try {
				await this.ffmpeg.unmount(inputDir);
				await this.ffmpeg.deleteDir(inputDir);
			} catch (cleanupErr) {
				console.error('Cleanup error:', cleanupErr);
			}
		}

		return results;
	}

	/**
	 * 指定されたフォーマットに対するFFmpegのコーデック引数を取得する
	 * @param format 出力フォーマット
	 * @returns FFmpeg引数の配列
	 */
	private getCodecArgs(format: string): string[] {
		switch (format) {
			case 'mp3':
				return ['-vn', '-acodec', 'libmp3lame', '-q:a', '2'];
			case 'aac':
				return ['-vn', '-acodec', 'aac'];
			case 'wav':
				return ['-vn', '-acodec', 'pcm_s16le'];
			default:
				return ['-vn'];
		}
	}

	private getFileExtension(filename: string): string {
		return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2)
			? '.' + filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2)
			: '';
	}
}

// Helper for fetching file data
async function fetchFile(file: File): Promise<Uint8Array> {
	return new Uint8Array(await file.arrayBuffer());
}

export const ffmpegService = new FFmpegService();
