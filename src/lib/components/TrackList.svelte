<script lang="ts">
	import type { SelectableAudioTrack } from '$lib/audio-extractor.svelte';

	interface Props {
		tracks: SelectableAudioTrack[];
		isProcessing: boolean;
		onToggleAll: (select: boolean) => void;
	}

	let { tracks = $bindable(), isProcessing, onToggleAll }: Props = $props();
</script>

{#if tracks.length > 0}
	<div class="divider text-sm text-base-content/50">Audio Tracks Found</div>
	<div class="flex w-full flex-col gap-2">
		<div class="flex items-center justify-between">
			<span class="text-sm font-bold">{tracks.length} tracks detected</span>
			<div class="flex gap-2">
				<button
					class="btn btn-outline btn-xs"
					onclick={() => onToggleAll(true)}
					disabled={isProcessing}
				>
					Select All
				</button>
				<button
					class="btn btn-outline btn-xs"
					onclick={() => onToggleAll(false)}
					disabled={isProcessing}
				>
					Deselect All
				</button>
			</div>
		</div>

		<div
			class="flex max-h-60 flex-col gap-1 overflow-y-auto rounded-box border border-base-300 bg-base-200 p-2"
		>
			{#each tracks as track (track.index)}
				<label
					class="label cursor-pointer justify-start gap-4 rounded p-2 transition-colors hover:bg-base-300"
				>
					<input
						type="checkbox"
						bind:checked={track.selected}
						class="checkbox checkbox-sm checkbox-primary"
						disabled={isProcessing}
					/>
					<div class="flex flex-col text-left text-xs">
						<span class="font-bold">Track {track.index + 1} ({track.language})</span>
						<span class="text-base-content/70">{track.description}</span>
					</div>
				</label>
			{/each}
		</div>
	</div>
{/if}
