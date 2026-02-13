<script lang="ts">
	/** 操作コントロールコンポーネントのProps */
	interface Props {
		/** 音声出力フォーマット (bindable) */
		outputFormat: 'mp3' | 'aac' | 'wav';
		/** 処理中かどうか */
		isProcessing: boolean;
		/** 進捗状況 (0-100) */
		progress: number;
		/** 抽出実行が可能かどうか */
		canExtract: boolean;
		/** 抽出ボタンクリック時のコールバック */
		onExtract: () => void;
	}

	let {
		outputFormat = $bindable(),
		isProcessing,
		progress,
		canExtract,
		onExtract
	}: Props = $props();

	import * as m from '$paraglide/messages';
</script>

<div class="flex flex-col gap-2">
	<label class="label" for="output-format">
		<span class="label-text">{m.output_format_label()}</span>
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

<div class="mt-4 card-actions flex-col items-center justify-center gap-4">
	{#if isProcessing}
		<div class="flex w-full flex-col gap-1">
			<progress class="progress w-full progress-primary" value={progress} max="100"></progress>
			<div class="text-right text-xs text-base-content/70">{m.processing_progress({ progress })}</div>
		</div>
	{/if}

	<button
		class="btn w-full btn-primary md:w-auto"
		onclick={onExtract}
		disabled={!canExtract || isProcessing}
	>
		{#if isProcessing}
			<span class="loading loading-spinner"></span>
			{m.processing_label()}
		{:else}
			{m.extract_button_label()}
		{/if}
	</button>
</div>
