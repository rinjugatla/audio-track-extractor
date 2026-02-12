import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export interface AudioTrackInfo {
	index: number;
	streamIndex: number; // The global stream index (0:1, 0:2, etc.)
	language?: string;
	codec: string;
	description: string;
}

export class FFmpegService {
	private ffmpeg: FFmpeg | null = null;
	private loaded = false;

	constructor() {
		// Do not instantiate FFmpeg in constructor to avoid SSR errors
	}

	async load(messageCallback?: (msg: { message: string; type: string }) => void) {
		if (this.loaded && this.ffmpeg) return;

		if (!this.ffmpeg) {
			this.ffmpeg = new FFmpeg();
		}

		const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

		if (messageCallback) {
			this.ffmpeg.on('log', messageCallback);
			this.ffmpeg.on('progress', (event) => {
				// You might want to handle progress here too if needed,
				// but 'log' gives text updates.
				// Progress event gives { progress: number, time: number }
			});
		}

		await this.ffmpeg.load({
			coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
			wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
		});

		this.loaded = true;
	}

	async getAudioTracks(file: File): Promise<AudioTrackInfo[]> {
		if (!this.loaded || !this.ffmpeg) {
			throw new Error('FFmpeg not loaded');
		}

		const inputDir = '/input_mnt_probe';
		const fileName = file.name;
		const inputPath = `${inputDir}/${fileName}`;

		try {
			await this.ffmpeg.createDir(inputDir);
		} catch (e) {
			// Directory likely exists
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await this.ffmpeg.mount('WORKERFS' as any, { files: [file] }, inputDir);

		const logs: string[] = [];
		const logHandler = ({ message }: { message: string }) => logs.push(message);
		this.ffmpeg.on('log', logHandler);

		try {
			await this.ffmpeg.exec(['-i', inputPath]);
		} catch (e) {
			// Expected code 1
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

		// Regex to parse FFmpeg stream output
		// We use a more flexible regex to handle various formats:
		// Stream #0:1(und): Audio: aac ...
		// Stream #0:1[0x1]: Audio: mp3 ...
		// Stream #0:1: Audio: wav ...
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

		return tracks;
	}

	async extractAudio(
		file: File,
		outputFormat: 'mp3' | 'aac' | 'wav' = 'mp3',
		targetStreamIndices: number[] = [] // Optional: if empty, extract all
	): Promise<{ filename: string; data: Uint8Array; streamIndex: number }[]> {
		if (!this.loaded || !this.ffmpeg) {
			throw new Error('FFmpeg not loaded');
		}

		// Mount the file effectively avoiding memory issues for large files
		const inputDir = '/input_mnt';
		const fileName = file.name;
		const inputPath = `${inputDir}/${fileName}`;

		try {
			// Clean up previous mount if somehow stuck (though we clean up at end)
			// or create the dir
			await this.ffmpeg.createDir(inputDir);
		} catch (e) {
			// Directory likely exists
		}

		// WORKERFS allows mounting the File object directly without loading it all into RAM
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await this.ffmpeg.mount('WORKERFS' as any, { files: [file] }, inputDir);

		// If no specific streams requested, try to get all
		// However, we rely on the component passing the indices usually.
		// If empty, we probe again just in case (fallback for backward compatibility if any)
		if (targetStreamIndices.length === 0) {
			// We can reuse getAudioTracks logic here or just rely on the component having called it.
			// Ideally the component should always pass indices now.
			// Let's quickly probe if we really have no info, or just fail.
			// For robustness, let's probe.
			// But since we are already mounted in inputDir, not inputDir_probe...
			// Let's just implement a quick count or assume caller provides indices.
			// For this refactor, I'll assume caller provides indices if they want specific tracks,
			// or ALL tracks if array is empty (which requires probing).
			
			// Let's probe using the current mount.
			const logs: string[] = [];
			const logHandler = ({ message }: { message: string }) => logs.push(message);
			this.ffmpeg.on('log', logHandler);
			try { await this.ffmpeg.exec(['-i', inputPath]); } catch (e) { /* expected */ }
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
			// Map specific audio track using the stream index directly
			args.push('-map', `0:${streamIndex}`);
			// Add codec options for this output
			args.push(...codecArgs);
			// Output filename for this track
			args.push(outName);
		});

		try {
			// Run the command
			await this.ffmpeg.exec(args);

			// Read all output files
			for (const outInfo of outputNames) {
				try {
					const data = await this.ffmpeg.readFile(outInfo.name);
					results.push({ filename: outInfo.name, data: data as Uint8Array, streamIndex: outInfo.streamIndex });
					await this.ffmpeg.deleteFile(outInfo.name);
				} catch (e) {
					console.warn(`Could not read output file ${outInfo.name}`, e);
				}
			}
		} finally {
			// Cleanup input mount
			// Even if exec fails, we must unmount
			try {
				await this.ffmpeg.unmount(inputDir);
				await this.ffmpeg.deleteDir(inputDir);
			} catch (cleanupErr) {
				console.error('Cleanup error:', cleanupErr);
			}
		}

		return results;
	}

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
