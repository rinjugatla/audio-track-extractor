<script lang="ts">
	interface Props {
		logs: string[];
	}

	let { logs }: Props = $props();
</script>

{#if logs.length > 0}
	<div class="mockup-code mt-6 max-h-40 w-full overflow-y-auto text-left text-xs">
		{#each logs as log, i (i)}
			<pre data-prefix=">"><code>{log}</code></pre>
		{/each}
	</div>
{/if}
