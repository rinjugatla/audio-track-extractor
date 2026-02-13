<script lang="ts">
	/** ログ表示用コンポーネントのProps */
	interface Props {
		/** 表示するログメッセージの配列 */
		logs: string[];
	}

	let { logs }: Props = $props();

	let container = $state<HTMLDivElement>();
	let isSticky = $state(true);

	/**
	 * スクロールイベントハンドラ
	 * ユーザーが手動でスクロールした場合、自動スクロールを一時停止するか判定する
	 */
	function onScroll() {
		if (!container) return;
		const { scrollTop, scrollHeight, clientHeight } = container;
		isSticky = scrollHeight - (scrollTop + clientHeight) < 20;
	}

	/**
	 * ログが更新されたときに、最下部を表示していれば自動スクロールするEffect
	 */
	$effect(() => {
		logs;
		if (isSticky && container) {
			container.scrollTop = container.scrollHeight;
		}
	});

	import * as m from '../../paraglide/messages';
</script>

{#if logs.length > 0}
	<div class="divider text-sm text-base-content/50">{m.logs_title()}</div>
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
