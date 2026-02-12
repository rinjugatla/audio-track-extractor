<script lang="ts">
	interface Props {
		logs: string[];
	}

	let { logs }: Props = $props();

	let container = $state<HTMLDivElement>();
	let isSticky = $state(true);

	function onScroll() {
		if (!container) return;
		const { scrollTop, scrollHeight, clientHeight } = container;
		isSticky = scrollHeight - (scrollTop + clientHeight) < 20;
	}

	$effect(() => {
		logs;
		if (isSticky && container) {
			container.scrollTop = container.scrollHeight;
		}
	});
</script>

{#if logs.length > 0}
	<div
		bind:this={container}
		onscroll={onScroll}
		class="mockup-code mt-6 max-h-32 w-full overflow-y-auto text-left text-xs"
	>
		{#each logs as log, i (i)}
			<pre data-prefix=">" class="wrap-break-words whitespace-pre-wrap"><code>{log}</code></pre>
		{/each}
	</div>
{/if}
