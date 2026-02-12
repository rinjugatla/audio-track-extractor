<script lang="ts">
	import { onMount } from 'svelte';
	import { ffmpegService } from '$lib/ffmpeg';

	let isLoaded = $state(false);
	let isProcessing = $state(false);
	let message = $state('Loading FFmpeg...');
	let logs = $state<string[]>([]);
	let selectedFile = $state<File | null>(null);
	let extractedTracks = $state<{ name: string; url: string }[]>([]);
	let outputFormat = $state<'mp3' | 'aac' | 'wav'>('mp3');
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			await ffmpegService.load(({ message }) => {
				logs = [...logs.slice(-4), message];
			});
			message = 'Ready';
			isLoaded = true;
		} catch (e) {
			error = 'Failed to load FFmpeg. Please check your connection or browser compatibility.';
			console.error(e);
		}
	});

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			selectedFile = target.files[0];
			// Clear previous results
			cleanupUrls();
			extractedTracks = [];
			error = null;
		}
	}

	function cleanupUrls() {
		extractedTracks.forEach((track) => URL.revokeObjectURL(track.url));
	}

	async function extractAudio() {
		if (!selectedFile) return;

		isProcessing = true;
		error = null;
		cleanupUrls();
		extractedTracks = [];

		try {
			const results = await ffmpegService.extractAudio(selectedFile, outputFormat);

			extractedTracks = results.map((track) => {
				const blob = new Blob([track.data as unknown as BlobPart], {
					type: `audio/${outputFormat}`
				});
				return {
					name: track.filename,
					url: URL.createObjectURL(blob)
				};
			});

			message = `Extraction complete! Extracted ${extractedTracks.length} tracks.`;
		} catch (e: any) {
			error = e.message || 'An error occurred during extraction. Check logs for details.';
			console.error(e);
		} finally {
			isProcessing = false;
		}
	}

	function formatSize(bytes: number) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
</script>

<div class="container mx-auto max-w-2xl p-4">
	<div class="card bg-base-100 shadow-xl">
		<figure class="px-10 pt-10">
			<h1 class="text-4xl font-bold text-primary">Audio Track Extractor</h1>
		</figure>
		<div class="card-body items-center text-center">

			{#if !isLoaded && !error}
				<div class="flex flex-col items-center gap-2">
					<span class="loading loading-lg loading-spinner"></span>
					<p>Loading FFmpeg engine...</p>
				</div>
			{:else if error}
				<div class="alert alert-error">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 shrink-0 stroke-current"
						fill="none"
						viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
						/></svg
					>
					<span>{error}</span>
				</div>
			{/if}

			{#if isLoaded}
				<div class="form-control w-full gap-4">
					<div class="flex flex-col gap-2">
						<label class="label" for="file-upload">
							<span class="label-text">Select Video File</span>
						</label>
						<input
							id="file-upload"
							type="file"
							accept="video/*,audio/*"
							onchange={handleFileSelect}
							class="file-input-bordered file-input w-full file-input-primary"
							disabled={isProcessing}
						/>
						{#if selectedFile}
							<div class="text-left text-sm text-base-content/70">
								Selected: {selectedFile.name} ({formatSize(selectedFile.size)})
							</div>
						{/if}
					</div>

					<div class="flex flex-col gap-2">
						<label class="label" for="output-format">
							<span class="label-text">Output Format</span>
						</label>
						<select
							id="output-format"
							bind:value={outputFormat}
							class="select-bordered select w-full"
							disabled={isProcessing}
						>
							<option value="mp3">MP3</option>
							<option value="aac">AAC</option>
							<option value="wav">WAV</option>
						</select>
					</div>

					<div class="mt-4 card-actions justify-center">
						<button
							class="btn w-full btn-primary md:w-auto"
							onclick={extractAudio}
							disabled={!selectedFile || isProcessing}
						>
							{#if isProcessing}
								<span class="loading loading-spinner"></span>
								Processing...
							{:else}
								Extract Audio
							{/if}
						</button>
					</div>
				</div>

				{#if logs.length > 0}
					<div class="mockup-code mt-6 max-h-40 w-full overflow-y-auto text-left text-xs">
						{#each logs as log}
							<pre data-prefix=">"><code>{log}</code></pre>
						{/each}
					</div>
				{/if}

				{#if extractedTracks.length > 0}
					<div class="divider"></div>
					<div class="flex w-full flex-col items-center gap-4">
						<h3 class="text-xl font-bold text-success">
							Extraction Successful! ({extractedTracks.length} tracks)
						</h3>

						{#each extractedTracks as track, i}
							<div class="card w-full bg-base-200 p-4 shadow-sm">
								<h4 class="mb-2 text-left font-bold">Track {i + 1}</h4>
								<audio controls src={track.url} class="mb-2 w-full"></audio>
								<div class="flex justify-end">
									<a
										href={track.url}
										download={track.name}
										class="btn btn-outline btn-sm btn-secondary"
									>
										Download {track.name}
									</a>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>
