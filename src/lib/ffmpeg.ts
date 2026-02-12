import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export class FFmpegService {
	private ffmpeg: FFmpeg | null = null;
	private loaded = false;

	constructor() {
		this.ffmpeg = new FFmpeg();
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

	async extractAudio(file: File, outputFormat: 'mp3' | 'aac' | 'wav' = 'mp3'): Promise<Uint8Array> {
		if (!this.loaded || !this.ffmpeg) {
			throw new Error('FFmpeg not loaded');
		}

		const inputName = 'input' + this.getFileExtension(file.name);
		const outputName = `output.${outputFormat}`;

		await this.ffmpeg.writeFile(inputName, await fetchFile(file));

		// Extract audio: -i input -vn (no video) -acodec (codec based on format) output
		// For mp3: libmp3lame, aac: aac, wav: pcm_s16le
		const codecArgs = this.getCodecArgs(outputFormat);
		
		await this.ffmpeg.exec(['-i', inputName, ...codecArgs, outputName]);

		const data = await this.ffmpeg.readFile(outputName);
		
		// Cleanup
		await this.ffmpeg.deleteFile(inputName);
		await this.ffmpeg.deleteFile(outputName);

		return data as Uint8Array;
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
