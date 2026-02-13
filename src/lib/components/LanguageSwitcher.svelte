<script lang="ts">
	import { page } from '$app/stores';
	import { locales, getLocale } from '$paraglide/runtime';
	import { goto } from '$app/navigation';

	const labels: Record<string, string> = {
		en: 'English',
		ja: '日本語'
	};

	let currentLang = $derived($page.url.searchParams.get('lang') || getLocale());

	function switchLanguage(newLang: string) {
		if (newLang === currentLang) return;

		const url = new URL($page.url);
		url.searchParams.set('lang', newLang);
		goto(url.toString(), { keepFocus: true });
	}

	// Explicitly define locales as string array to avoid type issues with paraglide runtime
	const availableLocales = locales as unknown as string[];
</script>

<div class="dropdown dropdown-end">
	<div tabindex="0" role="button" class="btn btn-circle btn-ghost" aria-label="Language">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
			/>
		</svg>
	</div>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<ul tabindex="0" class="dropdown-content menu z-[1] w-52 rounded-box bg-base-100 p-2 shadow">
		{#each availableLocales as loc}
			<li>
				<button class={currentLang === loc ? 'active' : ''} onclick={() => switchLanguage(loc)}>
					{labels[loc] || loc}
				</button>
			</li>
		{/each}
	</ul>
</div>
