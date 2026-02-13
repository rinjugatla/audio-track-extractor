<script lang="ts">
	import { onMount } from 'svelte';
	import { AudioExtractor } from '$lib/audio-extractor.svelte';
	import FileUploader from '$lib/components/FileUploader.svelte';
	import TrackList from '$lib/components/TrackList.svelte';
	import Controls from '$lib/components/Controls.svelte';
	import LogViewer from '$lib/components/LogViewer.svelte';
	import ResultList from '$lib/components/ResultList.svelte';
	import * as m from '../paraglide/messages';

	const viewModel = new AudioExtractor();

	onMount(() => {
		viewModel.init();
	});
</script>

<div class="container mx-auto max-w-2xl p-4">
	<div class="card bg-base-100 shadow-xl">
		<figure class="flex flex-col items-center px-10 pt-10">
			<h1 class="text-4xl font-bold text-primary">{m.app_title()}</h1>
			<p class="mt-2 flex items-center gap-2 text-sm text-base-content/70">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					class="h-4 w-4"
				>
					<path
						fill-rule="evenodd"
						d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
						clip-rule="evenodd"
					/>
				</svg>
				{m.local_processing_notice()}
			</p>
		</figure>
		<div class="card-body items-center text-center">
			{#if !viewModel.isLoaded && !viewModel.error}
				<div class="flex flex-col items-center gap-2">
					<span class="loading loading-lg loading-spinner"></span>
					<p>{viewModel.message}</p>
				</div>
			{:else if viewModel.error}
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
					<span>{viewModel.error}</span>
				</div>
			{/if}

			{#if viewModel.isLoaded}
				<div class="form-control w-full gap-4">
					<FileUploader
						selectedFile={viewModel.selectedFile}
						isProcessing={viewModel.isProcessing}
						isProbing={viewModel.isProbing}
						onFileSelect={(f) => viewModel.handleFileSelect(f)}
					/>

					<TrackList
						bind:tracks={viewModel.tracks}
						isProcessing={viewModel.isProcessing}
						onToggleAll={(s) => viewModel.toggleAll(s)}
					/>

					<Controls
						bind:outputFormat={viewModel.outputFormat}
						isProcessing={viewModel.isProcessing}
						progress={viewModel.progress}
						canExtract={!!(
							viewModel.selectedFile &&
							viewModel.tracks.length > 0 &&
							viewModel.tracks.filter((t) => t.selected).length > 0
						)}
						onExtract={() => viewModel.extractAudio()}
					/>
				</div>

				<LogViewer logs={viewModel.logs} />

				<ResultList
					selectedFile={viewModel.selectedFile}
					extractedTracks={viewModel.extractedTracks}
				/>
			{/if}
		</div>
	</div>
</div>
