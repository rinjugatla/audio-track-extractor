import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export class FFmpegService {
	private ffmpeg: FFmpeg | null = null;
	private loaded = false;

	constructor() {
		// Do not instantiate FFmpeg in constructor to avoid SSR errors
	}

	async load(messageCallback?: (msg: { message: string, type: string }) => void) {
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

	async extractAudio(file: File, outputFormat: 'mp3' | 'aac' | 'wav' = 'mp3'): Promise<{ filename: string, data: Uint8Array }[]> {
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
		await this.ffmpeg.mount('WORKERFS', { files: [file] }, inputDir);

		let trackCount: number;
		try {
			trackCount = await this.getAudioStreamCount(inputPath);
		} catch (e) {
			// If probing fails, unmount and rethrow
			await this.ffmpeg.unmount(inputDir);
			await this.ffmpeg.deleteDir(inputDir);
			throw e;
		}
		
		if (trackCount === 0) {
			await this.ffmpeg.unmount(inputDir);
			await this.ffmpeg.deleteDir(inputDir);
			throw new Error('No audio tracks found');
		}

		const results: { filename: string, data: Uint8Array }[] = [];
		const args = ['-i', inputPath];
		const outputNames: string[] = [];
		
		const codecArgsRaw = this.getCodecArgs(outputFormat);
		const codecArgs = codecArgsRaw.filter(a => a !== '-vn');

		for (let i = 0; i < trackCount; i++) {
			const outName = `track_${i + 1}.${outputFormat}`;
			outputNames.push(outName);
			// Map specific audio track
			args.push('-map', `0:a:${i}`);
			// Add codec options for this output
			args.push(...codecArgs);
			// Output filename for this track
			args.push(outName);
		}

		try {
			// Run the command
			await this.ffmpeg.exec(args);

			// Read all output files
			for (const outName of outputNames) {
				try {
					const data = await this.ffmpeg.readFile(outName);
					results.push({ filename: outName, data: data as Uint8Array });
					await this.ffmpeg.deleteFile(outName);
				} catch (e) {
					console.warn(`Could not read output file ${outName}`, e);
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

	private async getAudioStreamCount(inputName: string): Promise<number> {
		if (!this.ffmpeg) return 0;
		
		const logs: string[] = [];
		const logHandler = ({ message }: { message: string }) => logs.push(message);
		this.ffmpeg.on('log', logHandler);
		
		// Run ffmpeg -i inputName to get info
		// This usually creates an error (exit code 1) because no output file is provided,
		// but we only care about the logs.
		try {
			await this.ffmpeg.exec(['-i', inputName]);
		} catch (e) {
			// Output expected to verify info
		}
		
		this.ffmpeg.off('log', logHandler);
		
		const output = logs.join('\n');
		// Look for "Stream #0:x... Audio:"
		// Example: Stream #0:1(und): Audio: aac ...
		// We use a looser regex to handle various metadata formats (lang codes, ids, etc)
		const matches = output.match(/Stream #0:\d+.*?: Audio:/g);
		return matches ? matches.length : 0;
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
		return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2) ? "." + filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2) : "";
	}
}

// Helper for fetching file data
async function fetchFile(file: File): Promise<Uint8Array> {
	return new Uint8Array(await file.arrayBuffer());
}

export const ffmpegService = new FFmpegService();
