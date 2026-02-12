<script lang="ts">
	interface Props {
		selectedFile: File | null;
		isProcessing: boolean;
		isProbing: boolean;
		onFileSelect: (file: File) => void;
	}

	let { selectedFile, isProcessing, isProbing, onFileSelect }: Props = $props();

	function handleChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			onFileSelect(target.files[0]);
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

<div class="flex flex-col gap-2">
	<label class="label" for="file-upload">
		<span class="label-text">Select Video File</span>
	</label>
	<input
		id="file-upload"
		type="file"
		accept="video/*,audio/*"
		onchange={handleChange}
		class="file-input-bordered file-input w-full file-input-primary"
		disabled={isProcessing || isProbing}
	/>
	{#if isProbing}
		<div class="mt-2 flex items-center justify-center gap-2 text-sm text-base-content/70">
			<span class="loading loading-xs loading-spinner"></span> Analyzing file...
		</div>
	{:else if selectedFile}
		<div class="text-left text-sm text-base-content/70">
			Selected: {selectedFile.name} ({formatSize(selectedFile.size)})
		</div>
	{/if}
</div>
