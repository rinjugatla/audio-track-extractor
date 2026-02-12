<script lang="ts">
	import type { ExtractedTrack } from '$lib/audio-extractor.svelte';

	interface Props {
		extractedTracks: ExtractedTrack[];
	}

	let { extractedTracks }: Props = $props();
</script>

{#if extractedTracks.length > 0}
	<div class="divider"></div>
	<div class="flex w-full flex-col items-center gap-4">
		<h3 class="text-xl font-bold text-success">
			Extraction Successful! ({extractedTracks.length} tracks)
		</h3>

		{#each extractedTracks as track (track.name)}
			<div class="card w-full bg-base-200 p-4 shadow-sm">
				<h4 class="mb-2 text-left font-bold">{track.label}</h4>
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
