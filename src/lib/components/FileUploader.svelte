<script lang="ts">
	/** ファイルアップロードコンポーネントのProps */
	interface Props {
		/** 現在選択されているファイル */
		selectedFile: File | null;
		/** 処理中かどうか (無効化制御用) */
		isProcessing: boolean;
		/** ファイル分析中かどうか (無効化制御用) */
		isProbing: boolean;
		/** ファイルが選択された時のコールバック */
		onFileSelect: (file: File) => void;
	}

	let { selectedFile, isProcessing, isProbing, onFileSelect }: Props = $props();

	/**
	 * input要素の変更イベントハンドラ
	 */
	function handleChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			onFileSelect(target.files[0]);
		}
	}

	/**
	 * バイト数を読みやすい形式にフォーマットする
	 * @param bytes バイト数
	 */
	function formatSize(bytes: number) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
	import * as m from '$paraglide/messages';
</script>

<div class="flex flex-col gap-2">
	<label class="label" for="file-upload">
		<span class="label-text">{m.file_upload_label()}</span>
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
