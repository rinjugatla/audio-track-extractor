import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FFmpegService } from './ffmpeg';

// Mock FFmpeg and util
const mockWriteFile = vi.fn();
const mockExec = vi.fn();
const mockReadFile = vi.fn();
const mockDeleteFile = vi.fn();
const mockLoad = vi.fn();
const mockOn = vi.fn();

vi.mock('@ffmpeg/ffmpeg', () => {
	return {
		FFmpeg: class {
			load = mockLoad;
			on = mockOn;
			writeFile = mockWriteFile;
			exec = mockExec;
			readFile = mockReadFile;
			deleteFile = mockDeleteFile;
		}
	};
});

vi.mock('@ffmpeg/util', () => {
	return {
		toBlobURL: vi.fn().mockResolvedValue('blob:url')
	};
});

describe('FFmpegService', () => {
	let service: FFmpegService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new FFmpegService();
	});

	it('should instantiate', () => {
		expect(service).toBeTruthy();
	});

	it('should load ffmpeg', async () => {
		await service.load();
		expect(mockLoad).toHaveBeenCalled();
	});

	// Note: Testing extractAudio requires a File object which might be tricky in Node environment
	// without jsdom/happy-dom properly configured or a polyfill.
	// But vitest with environment: 'node' (default for server project) won't have File.
	// The client project in vite.config.ts has environment: 'happy-dom' or similar implicitly via 'browser' mode?
	// The config shows 'browser' provider: 'playwright'. This runs real browser tests for unit tests? 
	// Or maybe 'environment' is not set for client, so it defaults to node?
	// Let's check vite.config.ts again.
});
